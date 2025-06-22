import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from configs import logger
import os
import sys
from google import genai
from google.genai import types
from models import ContentGenerationRequest
from prompts import CREATE_CONTENT_SYSTEM_PROMPT
from utils import extract_content_from_text, extract_json_from_response
from conversation_graph import process_conversation
from dotenv import load_dotenv
from retriever import MultimodalRetriever

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

router = APIRouter()

# Shared Qdrant/Cohere retriever instance
video_retriever = MultimodalRetriever()


@router.get("/")
async def health_check_endpoint():
    """Enhanced health check endpoint for Cloud Run deployment"""
    try:
        logger.info("Health check / called.")

        # Basic health check response
        health_data = {
            "status": "healthy",
            "service": "Python Worker Service",
            "version": "0.1.0",
            "python_version": sys.version,
            "environment": {
                "PORT": os.environ.get("PORT", "8080"),
                "LOG_LEVEL": os.environ.get("LOG_LEVEL", "INFO"),
            },
        }

        return JSONResponse(content=health_data, status_code=200)

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


@router.get("/readiness")
async def readiness_check():
    """Readiness probe endpoint"""
    return {"status": "ready", "message": "Service is ready to accept requests"}


@router.get("/liveness")
async def liveness_check():
    """Liveness probe endpoint"""
    return {"status": "alive", "message": "Service is running"}


@router.post("/generate-content")
async def generate_content(request: ContentGenerationRequest):
    """Generate content endpoint using Gemini service"""
    logger.info(f"Generate content request received: {request}")
    try:
        # Call Gemini via the new GenAI SDK
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=request.user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=CREATE_CONTENT_SYSTEM_PROMPT
            )
        )

        # Get the response text
        raw = response.text
        logger.info(f"Raw Gemini response: {raw}")
        
        # Handle case where response.text might be None
        if not raw:
            raise ValueError("Empty response from Gemini")
        
        # Try to extract JSON from the response (it might be embedded in conversational text)
        json_data = extract_json_from_response(raw)
        
        if json_data:
            data = json_data
        else:
            # If no JSON found, try to extract structured content from text
            logger.warning("No JSON found in response, attempting to extract from text")
            data = extract_content_from_text(raw)
        
        # Extract the structured fields
        content_dict = {
            "idea": data.get("idea", "No idea generated"),
            "videoStructure": data.get("videoStructure", "No structure provided"),
            "caption": data.get("caption", "No caption generated"),
            "hashtags": data.get("hashtags", []),
        }

        return JSONResponse(
            content={"success": True, "content": content_dict},
            status_code=200
        )

    except Exception as e:
        logger.error(f"Error in generate_content endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Content generation failed: {str(e)}"
        )


class ConversationRequest(BaseModel):
    """Request model for conversation management."""
    user_input: str
    conversation_history: Optional[List[dict]] = None
    user_context: Optional[dict] = None


@router.post("/conversation")
async def conversation_endpoint(request: ConversationRequest):
    """Conversation endpoint using LangGraph state management"""
    logger.info(f"Conversation request received: {request.user_input}")
    try:
        # Process conversation using the state graph
        result = process_conversation(
            user_input=request.user_input,
            conversation_history=request.conversation_history or [],
            user_context=request.user_context or {}
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Conversation processing failed")
            )
        
        # Prepare response
        response_data = {
            "success": True,
            "response": result["response"],
            "structured_content": result.get("structured_content"),
            "conversation_context": result.get("conversation_context", {}),
            "content_history": result.get("content_history", [])
        }
        
        return JSONResponse(content=response_data, status_code=200)
        
    except Exception as e:
        logger.error(f"Error in conversation endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Conversation failed: {str(e)}"
        )


class VideoSearchResponse(BaseModel):
    id: str
    title: str | None = None
    description: str | None = None
    content_type: str
    url: str | None = None
    thumbnail_url: str | None = None
    transcript: str | None = None
    views: int | None = None
    likes: int | None = None
    shares: int | None = None
    comments: int | None = None
    engagement_rate: float | None = None
    created_at: str | None = None


@router.get("/videos", response_model=List[VideoSearchResponse])
async def search_videos_endpoint(search_term: Optional[str] = None, content_types: Optional[str] = None, top_k: int = 20):
    """Search viral posts in Qdrant and return metadata for frontend display."""
    try:
        # If no search term supplied, fall back to a generic query to return top items
        query = search_term or "trending"
        results = video_retriever.search(query_text=query, top_k=top_k)

        # Apply content_type filter if provided (comma-separated list)
        if content_types:
            allowed = {c.strip().lower() for c in content_types.split(',')}
            results = [r for r in results if r.get("platform", "").lower() in allowed]

        # Map to frontend schema
        mapped: List[VideoSearchResponse] = []
        for r in results:
            mapped.append(VideoSearchResponse(
                id=r.get("id", r.get("video_id", "")),
                title=r.get("title"),
                description=r.get("text", ""),
                content_type=r.get("platform", "tiktok"),
                url=r.get("url") or r.get("media_url"),
                thumbnail_url=r.get("thumbnail_url") or r.get("media_url"),
                transcript=None,
                views=r.get("views"),
                likes=r.get("likes"),
                shares=r.get("shares"),
                comments=r.get("comments"),
                engagement_rate=r.get("engagement_rate"),
                created_at=str(r.get("posted_at", "")),
            ))

        return mapped

    except Exception as e:
        logger.error(f"/videos search failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to search videos")