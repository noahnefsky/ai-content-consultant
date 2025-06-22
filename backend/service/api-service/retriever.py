#!/usr/bin/env python3
"""
MultimodalRetriever
-------------------
Helper utility for the API-service layer.
• Embeds an incoming text (and optional video or image path) using the same
  SentenceTransformer + CLIP models as the embedding-service.
• Performs an initial similarity search in the Qdrant collection
  "viral_multimodal_posts".
"""

from __future__ import annotations

import os
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
from io import BytesIO
import uuid

import numpy as np
import requests
from PIL import Image
import cv2

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

from sentence_transformers import SentenceTransformer
import torch
import clip
import cohere

logger = logging.getLogger(__name__)


class _MultimodalEmbedder:
    """Lightweight wrapper around CLIP + SentenceTransformers."""

    def __init__(self):
        logger.info("🔌 Loading text & visual encoders for retrieval…")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.text_model = SentenceTransformer("all-MiniLM-L6-v2")
        self.clip_model, self.clip_preprocess = clip.load("ViT-B/32", device=self.device)
        logger.info("✅ Encoders ready (device=%s)", self.device)

    def encode_text(self, text: str) -> List[float]:
        return self.text_model.encode(text).tolist()

    def encode_image(self, image_url_or_path: str) -> Optional[List[float]]:
        try:
            if image_url_or_path.startswith("http"):
                resp = requests.get(image_url_or_path, timeout=10)
                img = Image.open(BytesIO(resp.content))
            else:
                img = Image.open(image_url_or_path)
            inp = self.clip_preprocess(img).unsqueeze(0).to(self.device)
            with torch.no_grad():
                feats = self.clip_model.encode_image(inp)
                feats = feats / feats.norm(dim=-1, keepdim=True)
            return feats.cpu().numpy().flatten().tolist()
        except Exception as e:
            logger.warning("encode_image failed: %s", e)
            return None

    def encode_video_frame(self, video_path: str, frame_time: int = 5) -> Optional[List[float]]:
        try:
            cap = cv2.VideoCapture(video_path)
            cap.set(cv2.CAP_PROP_POS_MSEC, frame_time * 1000)
            ret, frame = cap.read()
            if not ret:
                return None
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img = Image.fromarray(frame_rgb)
            inp = self.clip_preprocess(img).unsqueeze(0).to(self.device)
            with torch.no_grad():
                feats = self.clip_model.encode_image(inp)
                feats = feats / feats.norm(dim=-1, keepdim=True)
            cap.release()
            return feats.cpu().numpy().flatten().tolist()
        except Exception as e:
            logger.warning("encode_video_frame failed: %s", e)
            return None


class MultimodalRetriever:
    """Searches Qdrant and (optionally) Cohere-reranks the results."""

    def __init__(self, *, collection_name: str = "viral_multimodal_posts", n_candidates: int = 20):
        self.collection_name = collection_name
        self.n_candidates = n_candidates

        # Qdrant connection (managed or local)
        url = os.getenv("QDRANT_URL")
        api_key = os.getenv("QDRANT_API_KEY")
        if url:
            self.client = QdrantClient(url=url, api_key=api_key)
            logger.info("🔗 Using managed Qdrant at %s", url)
        else:
            host = os.getenv("QDRANT_HOST", "localhost")
            port = int(os.getenv("QDRANT_PORT", 6333))
            self.client = QdrantClient(host=host, port=port)
            logger.info("💾 Using local Qdrant at %s:%s", host, port)

        self.embedder = _MultimodalEmbedder()

        # Cohere client (optional)
        self.cohere_api_key = os.getenv("COHERE_API_KEY")
        self.cohere_client = cohere.Client(self.cohere_api_key) if self.cohere_api_key else None
        if self.cohere_client:
            logger.info("✨ Cohere rerank enabled")
        else:
            logger.info("⚠️  COHERE_API_KEY not set – skipping rerank")

    # ---------------------------------------------------------------------
    # Public API
    # ---------------------------------------------------------------------
    def search(self, *, query_text: Optional[str] = None, query_video: Optional[str] = None, top_k: int = 5) -> List[Dict[str, Any]]:
        """Return top-k post payloads relevant to the query."""
        if not query_text and not query_video:
            raise ValueError("Either query_text or query_video must be provided")

        # Build query vector
        if query_video:
            vector = self.embedder.encode_video_frame(query_video)
            vector_name = "visual"
            if vector is None:
                logger.warning("Video embedding failed – falling back to text search")
                vector = self.embedder.encode_text(query_text or "")
                vector_name = "text"
        else:
            vector = self.embedder.encode_text(query_text)
            vector_name = "text"

        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=(vector_name, vector),
            limit=self.n_candidates,
            with_payload=True,
        )

        if not results:
            return []

        if self.cohere_client and query_text:
            docs = [res.payload.get("text", "") for res in results]
            try:
                reranked = self.cohere_client.rerank(
                    query=query_text,
                    documents=docs,
                    top_n=top_k,
                    model="rerank-english-v3.0",
                )
                idxs = [r.index for r in reranked.results]
                final_hits = [results[i] for i in idxs]
            except Exception as e:
                logger.warning("Cohere rerank failed (%s) – falling back to raw sim", e)
                final_hits = results[:top_k]
        else:
            final_hits = results[:top_k]

        return [hit.payload for hit in final_hits] 