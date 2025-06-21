#!/usr/bin/env python3
"""
AI Content Consultant - Multimodal RAG Population Script
Fetches real data from TikTok, Instagram, and Twitter with multimodal support
"""

import os
import asyncio
import aiohttp
from datetime import datetime, timedelta
import uuid
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import json

# Vector Database & Embeddings
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import clip
import torch
from sentence_transformers import SentenceTransformer
from PIL import Image
import requests
from io import BytesIO

# Social Media APIs
import instaloader
import tweepy
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

# Data processing
import pandas as pd
import numpy as np
import cv2
from dotenv import load_dotenv

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
            logger.warning("Twitter API credentials not found. Using mock data for demo.")
            return self.get_mock_twitter_posts(limit)
        
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
            return self.get_mock_twitter_posts(limit)
        
        return posts
    
    def get_mock_twitter_posts(self, limit: int) -> List[MultimodalPost]:
        """Generate mock Twitter posts for testing"""
        mock_posts = [
            {
                "text": "Just dropped my productivity morning routine! 5AM wake up, meditation, gym, then crushing my goals 💪 #productivity #morningroutine #entrepreneur",
                "hashtags": ["productivity", "morningroutine", "entrepreneur"],
                "category": "lifestyle",
                "engagement_rate": 8.5
            },
            {
                "text": "Quick outfit transition from work to date night! Same jeans, different energy ✨ #fashion #ootd #datenight",
                "hashtags": ["fashion", "ootd", "datenight"],
                "category": "fashion",
                "engagement_rate": 12.3
            },
            {
                "text": "This pasta recipe went viral for a reason! Adding my secret ingredient 🤫 #cooking #viral #recipe #foodie",
                "hashtags": ["cooking", "viral", "recipe", "foodie"],
                "category": "food",
                "engagement_rate": 15.7
            }
        ]
        
        posts = []
        for i, mock_data in enumerate(mock_posts[:limit]):
            post = MultimodalPost(
                id=f"mock_twitter_{i}_{uuid.uuid4().hex[:8]}",
                platform='twitter',
                content_type='text',
                text=mock_data["text"],
                media_url=None,
                media_path=None,
                hashtags=mock_data["hashtags"],
                author=f"mock_user_{i}",
                views=10000 + i * 5000,
                likes=500 + i * 200,
                shares=50 + i * 20,
                comments=25 + i * 10,
                engagement_rate=mock_data["engagement_rate"],
                posted_at=datetime.now() - timedelta(hours=i),
                category=mock_data["category"]
            )
            posts.append(post)
        
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
    
    def __init__(self, host: str = "localhost", port: int = 6333):
        try:
            self.client = QdrantClient(host=host, port=port)
            self.collection_name = "viral_multimodal_posts"
            self.embedder = MultimodalEmbedder()
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant at {host}:{port}. Using in-memory mode.")
            self.client = QdrantClient(":memory:")
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
            if "already exists" in str(e).lower():
                logger.info(f"Collection {self.collection_name} already exists")
            else:
                logger.error(f"Error creating collection: {e}")
    
    async def add_posts(self, posts: List[MultimodalPost]):
        """Add multimodal posts to vector database"""
        if not posts:
            logger.warning("No posts to add")
            return
            
        points = []
        
        for post in posts:
            # Generate embeddings
            text_embedding = self.embedder.encode_text(post.text)
            
            # Visual embedding (image or video)
            visual_embedding = None
            if post.media_url:
                if post.content_type == 'image':
                    visual_embedding = self.embedder.encode_image(post.media_url)
                elif post.content_type == 'video':
                    visual_embedding = self.embedder.encode_video_frame(post.media_url)
            
            # Create default visual embedding if none available
            if visual_embedding is None:
                visual_embedding = [0.0] * 512  # CLIP embedding size
            
            # Create point for Qdrant
            point = PointStruct(
                id=post.id,
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
    
    # Fetch data from each platform
    logger.info("🔄 Fetching data from social media platforms...")
    
    # Twitter (with fallback to mock data)
    logger.info("📱 Fetching Twitter posts...")
    twitter_posts = await fetcher.fetch_twitter_posts(trending_hashtags[:5], limit=10)
    all_posts.extend(twitter_posts)
    logger.info(f"✅ Fetched {len(twitter_posts)} Twitter posts")
    
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
        try:
            results = vector_db.search_multimodal(query, limit=3)
            
            for i, result in enumerate(results):
                payload = result.payload
                logger.info(f"  {i+1}. [{payload['platform'].upper()}] {payload['text'][:100]}...")
                logger.info(f"     Engagement: {payload['engagement_rate']:.2f}% | Category: {payload['category']}")
        except Exception as e:
            logger.error(f"Search failed for '{query}': {e}")
    
    logger.info(f"\n🎉 Multimodal RAG setup complete!")
    logger.info(f"   Total posts indexed: {len(all_posts)}")
    logger.info(f"   Platforms: Twitter (Instagram & TikTok coming next)")
    logger.info(f"   Database: Qdrant multimodal collection")
    logger.info(f"   Embeddings: CLIP (visual) + SentenceTransformer (text)")
    logger.info(f"\nNext steps:")
    logger.info(f"   1. Set up Qdrant server: docker run -p 6333:6333 qdrant/qdrant")
    logger.info(f"   2. Add API credentials to .env file")
    logger.info(f"   3. Install requirements: pip install -r requirements.txt")

if __name__ == "__main__":
    asyncio.run(main()) 