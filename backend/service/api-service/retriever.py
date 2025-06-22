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
import cv2

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

import cohere

logger = logging.getLogger(__name__)


class _HuggingFaceEmbedder:
    """Embedder that calls Hugging Face Inference API for text & image embeddings."""

    def __init__(self):
        self.api_token = os.getenv("HF_API_TOKEN") or os.getenv("HUGGINGFACE_API_TOKEN")
        if not self.api_token:
            raise RuntimeError("HF_API_TOKEN env var is required for remote embedding")

        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Accept": "application/json",
        }

        # Allow overriding the endpoints via env for custom endpoints
        self.text_endpoint = os.getenv(
            "HF_TEXT_ENDPOINT",
            "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
        )
        self.image_endpoint = os.getenv(
            "HF_IMAGE_ENDPOINT",
            "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32",
        )

        logger.info("🔗 Using Hugging Face Inference API for embeddings")

    # --------------------------- helpers ---------------------------
    def _post_json(self, url: str, payload: Dict[str, Any]):
        resp = requests.post(url, headers=self.headers, json=payload, timeout=30)
        resp.raise_for_status()
        return resp.json()

    # --------------------------- public ----------------------------
    def encode_text(self, text: str) -> List[float]:
        try:
            data = self._post_json(self.text_endpoint, {"inputs": text})
            # HF returns [ [emb] ]
            if data and isinstance(data[0], list):
                return data[0]
            return data
        except Exception as e:
            logger.error("HF text embedding failed: %s", e)
            return None

    def _get_image_bytes(self, path_or_url: str) -> bytes:
        if path_or_url.startswith("http"):
            return requests.get(path_or_url, timeout=15).content
        with open(path_or_url, "rb") as f:
            return f.read()

    def encode_image(self, image_url_or_path: str) -> Optional[List[float]]:
        try:
            img_bytes = self._get_image_bytes(image_url_or_path)
            resp = requests.post(self.image_endpoint, headers=self.headers, data=img_bytes, timeout=60)
            resp.raise_for_status()
            data = resp.json()
            if data and isinstance(data[0], list):
                return data[0]
            return data
        except Exception as e:
            logger.warning("HF image embedding failed: %s", e)
            return None

    def encode_video_frame(self, video_path: str, frame_time: int = 5) -> Optional[List[float]]:
        try:
            cap = cv2.VideoCapture(video_path)
            cap.set(cv2.CAP_PROP_POS_MSEC, frame_time * 1000)
            ret, frame = cap.read()
            if not ret:
                return None
            # Encode frame as JPEG into memory
            success, buf = cv2.imencode(".jpg", frame)
            if not success:
                return None
            img_bytes = buf.tobytes()
            resp = requests.post(self.image_endpoint, headers=self.headers, data=img_bytes, timeout=60)
            resp.raise_for_status()
            data = resp.json()
            if data and isinstance(data[0], list):
                return data[0]
            return data
        except Exception as e:
            logger.warning("HF video frame embedding failed: %s", e)
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

        self.embedder = _HuggingFaceEmbedder()

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

        # If embedding failed, fall back to returning top posts (scroll)
        if not vector or (isinstance(vector, list) and len(vector) == 0):
            logger.warning("Embedding failed – falling back to generic scroll for top posts")
            try:
                hits, _ = self.client.scroll(
                    collection_name=self.collection_name,
                    limit=top_k,
                    with_payload=True,
                )
                return [h.payload for h in hits]
            except Exception as e:
                logger.error("Scroll fallback failed: %s", e)
                return []

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