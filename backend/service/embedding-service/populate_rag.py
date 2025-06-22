#!/usr/bin/env python3
"""
AI Content Consultant - Multimodal RAG Population Script
Fetches real data from TikTok, Instagram, and Twitter with multimodal support

Note: For hackathon trending video discovery, use the new scraping-service instead.
This file focuses on building RAG embeddings for content analysis.
"""

import os, sys, json, asyncio
from datetime import datetime, timedelta
import uuid, logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import aiohttp
from PIL import Image
import requests
from io import BytesIO

# Vector Database & Embeddings
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import clip
import torch
from sentence_transformers import SentenceTransformer
import pandas as pd
import numpy as np
import cv2
from dotenv import load_dotenv

# Social Media APIs
import instaloader
import tweepy
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

# Data processing
from pathlib import Path

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MultimodalPost:
    """Data class for multimodal social media posts"""
    id: str
    platform: str
    content_type: str  # 'text', 'image', 'video'
    text: str
    media_url: Optional[str]
    media_path: Optional[str]
    hashtags: List[str]
    author: str
    views: int
    likes: int
    shares: int
    comments: int
    engagement_rate: float
    posted_at: datetime
    category: str
    text_embedding: Optional[List[float]] = None
    image_embedding: Optional[List[float]] = None
    video_embedding: Optional[List[float]] = None

class MultimodalEmbedder:
    """Handles multimodal embeddings using CLIP and SentenceTransformers"""
    
    def __init__(self):
        logger.info("🤖 Loading multimodal embedding models...")
        
        # Load CLIP for image/video embeddings
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.clip_model, self.clip_preprocess = clip.load("ViT-B/32", device=self.device)
        
        # Load SentenceTransformer for text embeddings
        self.text_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        logger.info(f"✅ Models loaded on {self.device}")
    
    def encode_text(self, text: str) -> List[float]:
        """Generate text embeddings"""
        return self.text_model.encode(text).tolist()
    
    def encode_image(self, image_url: str) -> Optional[List[float]]:
        """Generate image embeddings using CLIP"""
        try:
            response = requests.get(image_url, timeout=10)
            image = Image.open(BytesIO(response.content))
            
            # Preprocess and encode
            image_tensor = self.clip_preprocess(image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                image_features = self.clip_model.encode_image(image_tensor)
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            
            return image_features.cpu().numpy().flatten().tolist()
        except Exception as e:
            logger.error(f"Failed to encode image {image_url}: {e}")
            return None
    
    def encode_video_frame(self, video_url: str, frame_time: int = 5) -> Optional[List[float]]:
        """Generate video embeddings from key frame using CLIP"""
        try:
            # Download and extract frame at specified time
            cap = cv2.VideoCapture(video_url)
            cap.set(cv2.CAP_PROP_POS_MSEC, frame_time * 1000)
            
            ret, frame = cap.read()
            if not ret:
                return None
            
            # Convert BGR to RGB and create PIL image
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image = Image.fromarray(frame_rgb)
            
            # Process with CLIP
            image_tensor = self.clip_preprocess(image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                image_features = self.clip_model.encode_image(image_tensor)
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            
            cap.release()
            return image_features.cpu().numpy().flatten().tolist()
            
        except Exception as e:
            logger.error(f"Failed to encode video {video_url}: {e}")
            return None

class SocialMediaFetcher:
    """Fetches real data from social media platforms"""
    
    def __init__(self):
        self.setup_credentials()
        self.setup_selenium()
    
    def setup_credentials(self):
        """Setup API credentials from environment variables"""
        # Twitter API
        self.twitter_bearer_token = os.getenv('TWITTER_BEARER_TOKEN')
        self.twitter_api_key = os.getenv('TWITTER_API_KEY')
        self.twitter_api_secret = os.getenv('TWITTER_API_SECRET')
        
        # Instagram (using instaloader - no API key needed)
        self.instagram_username = os.getenv('INSTAGRAM_USERNAME')
        self.instagram_password = os.getenv('INSTAGRAM_PASSWORD')
        
        # Note: TikTok official API is restricted, using web scraping
    
    def setup_selenium(self):
        """Setup Selenium for web scraping"""
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
        except Exception as e:
            logger.warning(f"Selenium setup failed: {e}. Web scraping will be disabled.")
            self.driver = None
    
    async def fetch_twitter_posts(self, hashtags: List[str], limit: int = 50) -> List[MultimodalPost]:
        """Fetch viral Twitter posts"""
        posts = []
        
        if not self.twitter_bearer_token:
            logger.warning("Twitter API credentials not found. Skipping Twitter data.")
            return posts
        
        try:
            # Setup Twitter API v2
            client = tweepy.Client(bearer_token=self.twitter_bearer_token)
            
            for hashtag in hashtags:
                query = f"#{hashtag} -is:retweet lang:en has:media"
                
                tweets = tweepy.Paginator(
                    client.search_recent_tweets,
                    query=query,
                    max_results=min(limit, 100),
                    tweet_fields=['created_at', 'public_metrics', 'attachments'],
                    media_fields=['url', 'type'],
                    expansions=['attachments.media_keys', 'author_id']
                ).flatten(limit=limit)
                
                for tweet in tweets:
                    # Extract media URLs
                    media_url = None
                    content_type = 'text'
                    
                    if hasattr(tweet, 'attachments') and tweet.attachments:
                        # This would need proper media expansion handling
                        content_type = 'image'  # or 'video' based on media type
                    
                    post = MultimodalPost(
                        id=str(tweet.id),
                        platform='twitter',
                        content_type=content_type,
                        text=tweet.text,
                        media_url=media_url,
                        media_path=None,
                        hashtags=self.extract_hashtags(tweet.text),
                        author=f"user_{tweet.author_id}",
                        views=tweet.public_metrics.get('impression_count', 0),
                        likes=tweet.public_metrics.get('like_count', 0),
                        shares=tweet.public_metrics.get('retweet_count', 0),
                        comments=tweet.public_metrics.get('reply_count', 0),
                        engagement_rate=self.calculate_engagement(tweet.public_metrics),
                        posted_at=tweet.created_at,
                        category=self.classify_content(tweet.text)
                    )
                    posts.append(post)
                    
        except Exception as e:
            logger.error(f"Error fetching Twitter posts: {e}")
        
        return posts
    
    async def fetch_instagram_posts(self, hashtags: List[str], limit: int = 50) -> List[MultimodalPost]:
        """Fetch viral Instagram posts"""
        posts = []
        
        try:
            L = instaloader.Instaloader()
            
            # Login if credentials provided
            if self.instagram_username and self.instagram_password:
                L.login(self.instagram_username, self.instagram_password)
            
            for hashtag in hashtags:
                hashtag_posts = L.get_hashtag_posts(hashtag)
                count = 0
                
                for post_data in hashtag_posts:
                    if count >= limit:
                        break
                    
                    # Determine content type
                    content_type = 'image'
                    if post_data.is_video:
                        content_type = 'video'
                    elif len(post_data.get_sidecar_nodes()) > 1:
                        content_type = 'carousel'
                    
                    # Get media URL
                    media_url = post_data.url
                    if post_data.is_video:
                        media_url = post_data.video_url
                    
                    post = MultimodalPost(
                        id=post_data.shortcode,
                        platform='instagram',
                        content_type=content_type,
                        text=post_data.caption or "",
                        media_url=media_url,
                        media_path=None,
                        hashtags=self.extract_hashtags(post_data.caption or ""),
                        author=post_data.owner_username,
                        views=post_data.video_view_count if post_data.is_video else 0,
                        likes=post_data.likes,
                        shares=0,  # Instagram doesn't provide share count
                        comments=post_data.comments,
                        engagement_rate=self.calculate_instagram_engagement(post_data),
                        posted_at=post_data.date,
                        category=self.classify_content(post_data.caption or "")
                    )
                    posts.append(post)
                    count += 1
                    
        except Exception as e:
            logger.error(f"Error fetching Instagram posts: {e}")
        
        return posts
    
    def extract_hashtags(self, text: str) -> List[str]:
        """Extract hashtags from text"""
        import re
        hashtags = re.findall(r'#\w+', text.lower())
        return [tag[1:] for tag in hashtags]  # Remove # symbol
    
    def calculate_engagement(self, metrics: dict) -> float:
        """Calculate engagement rate from metrics"""
        total_engagement = metrics.get('like_count', 0) + metrics.get('retweet_count', 0) + metrics.get('reply_count', 0)
        impressions = metrics.get('impression_count', 1)
        return (total_engagement / impressions) * 100 if impressions > 0 else 0
    
    def calculate_instagram_engagement(self, post) -> float:
        """Calculate Instagram engagement rate"""
        total_engagement = post.likes + post.comments
        # Instagram doesn't provide follower count in this context, using view approximation
        estimated_reach = max(post.likes * 10, 1000)  # Rough estimation
        return (total_engagement / estimated_reach) * 100
    
    def classify_content(self, text: str) -> str:
        """Basic content classification"""
        text_lower = text.lower()
        
        categories = {
            'lifestyle': ['life', 'daily', 'routine', 'morning', 'night'],
            'fitness': ['workout', 'gym', 'fitness', 'health', 'exercise'],
            'food': ['food', 'recipe', 'cooking', 'meal', 'eat'],
            'fashion': ['outfit', 'style', 'fashion', 'clothes', 'wear'],
            'business': ['business', 'entrepreneur', 'startup', 'work', 'career'],
            'tech': ['tech', 'software', 'app', 'code', 'programming'],
            'entertainment': ['funny', 'comedy', 'music', 'dance', 'entertainment']
        }
        
        for category, keywords in categories.items():
            if any(keyword in text_lower for keyword in keywords):
                return category
        
        return 'general'

class MultimodalVectorDB:
    """Qdrant-based multimodal vector database"""
    
    def __init__(self, host: str = "localhost", port: int = 6333, url: str = None, api_key: str = None):
        """Initialize Qdrant client.

        Priority:
        1. Explicit `url` argument (managed Qdrant Cloud) – optional `api_key`.
        2. Environment variables `QDRANT_URL` and optional `QDRANT_API_KEY`.
        3. Fallback to local host/port (default).
        """

        # Resolve connection settings with sensible fallbacks
        url = url or os.getenv("QDRANT_URL")
        api_key = api_key or os.getenv("QDRANT_API_KEY")

        if url:
            # Managed / remote Qdrant instance
            self.client = QdrantClient(url=url, api_key=api_key)
            logger.info(f"🔗 Connected to managed Qdrant instance: {url}")
        else:
            # Local Qdrant instance via host/port
            self.client = QdrantClient(host=host, port=port)
            logger.info(f"💾 Connected to local Qdrant instance at {host}:{port}")

        self.collection_name = "viral_multimodal_posts"
        self.embedder = MultimodalEmbedder()
        
    def setup_collection(self):
        """Create collection with multimodal vector configuration"""
        try:
            # Create collection with multiple vector fields
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config={
                    "text": VectorParams(size=384, distance=Distance.COSINE),    # SentenceTransformer
                    "visual": VectorParams(size=512, distance=Distance.COSINE), # CLIP
                }
            )
            logger.info(f"✅ Created collection: {self.collection_name}")
        except Exception as e:
            if "already exists" in str(e):
                logger.info(f"Collection {self.collection_name} already exists")
            else:
                logger.error(f"Error creating collection: {e}")
    
    async def add_posts(self, posts: List[MultimodalPost]):
        """Add multimodal posts to vector database"""
        points = []
        
        for post in posts:
            # Generate embeddings
            text_embedding = self.embedder.encode_text(post.text)
            
            # Visual embedding (image or video)
            visual_embedding = None
            if post.content_type == 'image' and post.media_url:
                visual_embedding = self.embedder.encode_image(post.media_url)
            elif post.content_type == 'video':
                source = post.media_path or post.media_url
                if source:
                    visual_embedding = self.embedder.encode_video_frame(source)
            
            # Create default visual embedding if none available
            if visual_embedding is None:
                visual_embedding = [0.0] * 512  # CLIP embedding size
            
            # Qdrant requires point IDs to be unsigned integers or UUID strings.
            # Convert purely numeric IDs to int; otherwise keep original string/UUID.
            point_id: Any
            if isinstance(post.id, str) and post.id.isdigit():
                try:
                    point_id = int(post.id)
                except ValueError:
                    point_id = str(uuid.uuid4())
            else:
                point_id = post.id if isinstance(post.id, (int, str)) else str(post.id)

            point = PointStruct(
                id=point_id,
                vector={
                    "text": text_embedding,
                    "visual": visual_embedding
                },
                payload={
                    "platform": post.platform,
                    "content_type": post.content_type,
                    "text": post.text,
                    "media_url": post.media_url,
                    "hashtags": post.hashtags,
                    "author": post.author,
                    "views": post.views,
                    "likes": post.likes,
                    "shares": post.shares,
                    "comments": post.comments,
                    "engagement_rate": post.engagement_rate,
                    "posted_at": post.posted_at.isoformat(),
                    "category": post.category,
                    "added_at": datetime.now().isoformat()
                }
            )
            points.append(point)
        
        # Insert points in batches
        batch_size = 100
        for i in range(0, len(points), batch_size):
            batch = points[i:i + batch_size]
            self.client.upsert(collection_name=self.collection_name, points=batch)
            logger.info(f"✅ Inserted batch {i//batch_size + 1}, {len(batch)} posts")
    
    def search_multimodal(self, query: str, query_image: str = None, limit: int = 10, platform_filter: str = None):
        """Search using both text and image queries"""
        # Generate query embeddings
        text_embedding = self.embedder.encode_text(query)
        
        search_params = {
            "collection_name": self.collection_name,
            "query_vector": ("text", text_embedding),
            "limit": limit,
            "with_payload": True
        }
        
        # Add platform filter if specified
        if platform_filter:
            search_params["query_filter"] = {
                "must": [{"key": "platform", "match": {"value": platform_filter}}]
            }
        
        results = self.client.search(**search_params)
        return results

async def main():
    """Main function to populate multimodal RAG"""
    logger.info("🎯 AI Content Consultant - Multimodal RAG Population")
    logger.info("=" * 60)
    
    # Initialize components
    fetcher = SocialMediaFetcher()
    vector_db = MultimodalVectorDB()
    
    # Setup vector database
    vector_db.setup_collection()
    
    # Define trending hashtags to fetch
    trending_hashtags = [
        'viral', 'trending', 'fyp', 'contentcreator', 'socialmedia',
        'productivity', 'lifestyle', 'fitness', 'fashion', 'food',
        'business', 'entrepreneur', 'tech', 'motivation', 'selfcare'
    ]
    
    all_posts = []
    
    # We're only using TikTok data from the scraping service
    logger.info("🔄 Loading TikTok data from scraping service...")
    
    # -------------------------------------------------------------
    # TikTok from individual data/*.json files (with rich metadata)
    # -------------------------------------------------------------
    
    def load_tiktok_data_files() -> List[MultimodalPost]:
        """Load individual *.json files from scraping-service/data/ folder."""
        
        scrape_data_dir = Path(__file__).resolve().parents[1] / "scraping-service" / "data"
        posts: List[MultimodalPost] = []
        
        if not scrape_data_dir.exists():
            logger.warning(f"⚠️  Data directory not found: {scrape_data_dir}")
            return posts
        
        # Get all individual JSON files (exclude manifest files)
        json_files = [f for f in scrape_data_dir.glob("*.json") if "manifest" not in f.name]
        
        if not json_files:
            logger.warning(f"⚠️  No individual JSON files found in {scrape_data_dir}")
            return posts
        
        def classify_content_from_hashtags(hashtags: List[str]) -> str:
            """Simple content classification using hashtags."""
            if not hashtags:
                return "general"
            
            # Filter out generic hashtags and use meaningful ones
            meaningful_hashtags = [
                tag for tag in hashtags 
                if tag not in ['fyp', 'foryou', 'viral', 'trending', 'tiktok', 'xyzbca', 'blowthisup', 'capcut', 'makeitviral']
                and len(tag) > 2
            ]
            
            if meaningful_hashtags:
                # Use the first meaningful hashtag as category
                return meaningful_hashtags[0]
            
            return "general"
        
        logger.info(f"📁 Processing {len(json_files)} individual TikTok data files...")
        
        for json_file in json_files:
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                
                # Extract data from the rich metadata format
                video_id = meta.get("video_id", "")
                if not video_id:
                    continue
                
                views = meta.get("views", 0)
                likes = meta.get("likes", 0)
                comments = meta.get("comments", 0)
                shares = meta.get("shares", 0)
                engagement_rate = (
                    (likes + comments + shares) / views * 100 if views > 0 else 0.0
                )
                
                # Parse created_at
                created_at_str = meta.get("created_at", "")
                try:
                    if created_at_str:
                        posted_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                    else:
                        posted_at = datetime.now()
                except:
                    posted_at = datetime.now()
                
                # Check if video file exists
                file_path = meta.get("file_path", "")
                video_file_path = None
                if file_path:
                    full_video_path = scrape_data_dir / Path(file_path).name
                    if full_video_path.exists():
                        video_file_path = str(full_video_path)
                
                post = MultimodalPost(
                    id=video_id,
                    platform="tiktok",
                    content_type="video",
                    text=meta.get("description", ""),
                    media_url=meta.get("thumbnail_url", ""),
                    media_path=video_file_path,
                    hashtags=meta.get("hashtags", []),
                    author=meta.get("creator", ""),
                    views=views,
                    likes=likes,
                    shares=shares,
                    comments=comments,
                    engagement_rate=engagement_rate,
                    posted_at=posted_at,
                    category=classify_content_from_hashtags(meta.get("hashtags", [])),
                )
                posts.append(post)
                
                logger.debug(f"✅ Loaded: {video_id} - {meta.get('title', '')[:50]}...")
                
            except Exception as e:
                logger.warning(f"Failed to parse {json_file.name}: {e}")
        
        return posts
    
    logger.info("🎵 Loading TikTok data from individual JSON files...")
    tiktok_posts = load_tiktok_data_files()
    all_posts.extend(tiktok_posts)
    logger.info(f"✅ Loaded {len(tiktok_posts)} TikTok posts with rich metadata")
    
    # Add posts to vector database
    if all_posts:
        logger.info(f"💾 Adding {len(all_posts)} posts to multimodal vector database...")
        await vector_db.add_posts(all_posts)
    else:
        logger.warning("⚠️ No posts fetched. Check API credentials and network connection.")
    
    # Test search
    logger.info("\n🔍 Testing multimodal search...")
    test_queries = [
        "productivity tips and morning routines",
        "fashion outfit inspiration",
        "healthy cooking recipes",
        "business and entrepreneurship advice"
    ]
    
    for query in test_queries:
        logger.info(f"\nQuery: '{query}'")
        results = vector_db.search_multimodal(query, limit=3)
        
        for i, result in enumerate(results):
            payload = result.payload
            logger.info(f"  {i+1}. [{payload['platform'].upper()}] {payload['text'][:100]}...")
            logger.info(f"     Engagement: {payload['engagement_rate']:.2f}% | Category: {payload['category']}")
    
    logger.info(f"\n🎉 Multimodal RAG setup complete!")
    logger.info(f"   Total posts indexed: {len(all_posts)}")
    logger.info(f"   Platform: TikTok (with rich metadata)")
    logger.info(f"   Database: Qdrant multimodal collection")
    logger.info(f"   Embeddings: CLIP (visual) + SentenceTransformer (text)")

if __name__ == "__main__":
    print("Starting RAG population...")
    asyncio.run(main()) 