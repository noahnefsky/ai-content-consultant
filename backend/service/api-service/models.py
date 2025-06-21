from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class Platform(str, Enum):
    TIKTOK = "tiktok"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    YOUTUBE = "youtube"

class ContentType(str, Enum):
    VIDEO = "video"
    IMAGE = "image"
    TEXT = "text"
    CAROUSEL = "carousel"

class TrendStatus(str, Enum):
    ACTIVE = "active"
    DECLINING = "declining"
    EMERGING = "emerging"

# Request/Response Models
class IdeaRequest(BaseModel):
    prompt: str
    target_platforms: List[Platform]
    content_type: Optional[ContentType] = None

class VideoUploadRequest(BaseModel):
    video_url: Optional[str] = None
    video_file: Optional[str] = None  # Will be handled as multipart form data
    target_platforms: List[Platform]

class ContentAnalysisRequest(BaseModel):
    content_id: str
    platforms: List[Platform]

# Data Models
class ViralPost(BaseModel):
    id: str
    platform: Platform
    content_type: ContentType
    title: Optional[str] = None
    description: Optional[str] = None
    transcript: Optional[str] = None
    hashtags: List[str] = []
    views: int
    likes: int
    shares: int
    comments: int
    engagement_rate: float
    post_url: str
    author_handle: str
    posted_at: datetime
    scraped_at: datetime
    embedding: Optional[List[float]] = None
    summary: Optional[str] = None

class Trend(BaseModel):
    id: str
    title: str
    description: str
    platforms: List[Platform]
    related_posts: List[str]  # IDs of related ViralPost
    hashtags: List[str]
    keywords: List[str]
    status: TrendStatus
    confidence_score: float
    created_at: datetime
    updated_at: datetime
    embedding: Optional[List[float]] = None

class ContentSuggestion(BaseModel):
    platform: Platform
    content_type: ContentType
    title: str
    description: str
    script: Optional[str] = None
    caption: str
    hashtags: List[str]
    hooks: List[str]  # Attention-grabbing opening lines
    cta: str  # Call to action
    estimated_performance: Dict[str, Any]  # Views, likes, etc predictions
    similar_viral_posts: List[str]  # IDs of similar viral posts
    confidence_score: float

class VideoAnalysis(BaseModel):
    video_id: str
    transcript: str
    duration: int  # in seconds
    topics: List[str]
    sentiment: str
    key_moments: List[Dict[str, Any]]  # Timestamp and description
    embedding: Optional[List[float]] = None
    summary: str

class UserProject(BaseModel):
    id: str
    user_id: str
    title: str
    original_idea: str
    target_platforms: List[Platform]
    content_suggestions: List[ContentSuggestion]
    video_analysis: Optional[VideoAnalysis] = None
    status: str  # draft, in_progress, completed
    created_at: datetime
    updated_at: datetime

# Response Models
class IdeaResponse(BaseModel):
    project_id: str
    content_suggestions: List[ContentSuggestion]
    trending_examples: List[ViralPost]
    confidence_score: float

class VideoAnalysisResponse(BaseModel):
    analysis: VideoAnalysis
    content_suggestions: List[ContentSuggestion]
    similar_trends: List[Trend]
    hashtag_recommendations: Dict[Platform, List[str]]

class TrendResponse(BaseModel):
    trends: List[Trend]
    total_count: int
    page: int
    page_size: int

class SearchResponse(BaseModel):
    similar_posts: List[ViralPost]
    related_trends: List[Trend]
    suggestions: List[ContentSuggestion]
    total_matches: int

# Error Models
class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None

class CloudTaskPayload(BaseModel):
    job_id: str
    code: str
    language: str # Language field, though python-worker only handles python
    input: Optional[str] = None

class WorkerFile(BaseModel):
    r2_object_key: str = Field(..., alias="r2_object_key")
    file_path: str = Field(..., alias="file_path")

class CloudTaskAuthPayload(BaseModel):
    job_id: str
    workspace_id: str
    entrypoint_file: str
    language: str
    input: Optional[str] = None
    r2_bucket_name: str
    files: List[WorkerFile]

# Optional: A common model for updating Firestore job status
class JobStatusUpdate(BaseModel):
    status: str
    output: Optional[str] = None
    error: Optional[str] = None

class CodeExecutionResult(BaseModel):
    output: Optional[str] = None
    error: Optional[str] = None
    status_code: int # 0: success, 1: runtime error, 2: timeout, 3: internal error 