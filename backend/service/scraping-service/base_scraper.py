"""
Base Scraper for ScrapingDog API
Handles common functionality for all social media scrapers
"""

import os
import requests
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import time
import json

logger = logging.getLogger(__name__)

@dataclass
class TrendingVideo:
    """Data class for trending video content"""
    platform: str
    video_id: str
    title: str
    description: str
    url: str
    thumbnail_url: str
    video_url: Optional[str]
    creator: str
    creator_followers: int
    views: int
    likes: int
    comments: int
    shares: int
    engagement_score: int
    hashtags: List[str]
    created_at: datetime
    duration: Optional[int] = None  # in seconds
    is_video: bool = True

class BaseScraper:
    """Base class for ScrapingDog API scrapers"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('SCRAPINGDOG_API_KEY')
        if not self.api_key:
            raise ValueError("ScrapingDog API key is required. Set SCRAPINGDOG_API_KEY environment variable.")
        
        self.session = requests.Session()
        
        # Rate limiting
        self.last_request_time = 0
        self.min_request_interval = 1.0  # 1 second between requests
        
        logger.info(f"Initialized {self.__class__.__name__} with ScrapingDog API")
    
    def _rate_limit(self):
        """Implement basic rate limiting"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.min_request_interval:
            sleep_time = self.min_request_interval - time_since_last
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def _make_request(self, url: str, params: Dict[str, Any]) -> Optional[Dict]:
        """Make a request to ScrapingDog API with error handling"""
        self._rate_limit()
        
        # Ensure API key is in params
        if 'api_key' not in params:
            params['api_key'] = self.api_key
        
        try:
            logger.info(f"Making request to {url}")
            
            response = self.session.get(url, params=params, timeout=60)
            
            if response.status_code == 200:
                # Try to parse as JSON first, fall back to text
                try:
                    return response.json()
                except json.JSONDecodeError:
                    return {'text': response.text}
            elif response.status_code == 410:
                logger.warning(f"Request timeout for {url}")
                return None
            elif response.status_code == 403:
                logger.error("Request limit reached or invalid API key")
                return None
            elif response.status_code == 429:
                logger.warning("Rate limit hit, waiting...")
                time.sleep(5)
                return self._make_request(url, params)  # Retry once
            else:
                logger.error(f"API request failed: {response.status_code} - {response.text}")
                return None
                
        except requests.exceptions.Timeout:
            logger.error(f"Request timeout for {url}")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed for {url}: {e}")
            return None
    
    def calculate_engagement_rate(self, likes: int, comments: int, shares: int, views: int) -> float:
        """Calculate engagement rate based on platform metrics"""
        if views == 0:
            return 0.0
        
        total_engagement = likes + comments + shares
        return (total_engagement / views) * 100
    
    def extract_hashtags(self, text: str) -> List[str]:
        """Extract hashtags from text"""
        import re
        hashtags = re.findall(r'#(\w+)', text)
        return [tag.lower() for tag in hashtags]
    
    def is_trending_content(self, video: TrendingVideo, min_engagement_score: int = 1000) -> bool:
        """Determine if content is trending based on engagement metrics"""
        return (
            video.engagement_score >= min_engagement_score and
            video.views > 100 and
            video.likes > 10
        ) 