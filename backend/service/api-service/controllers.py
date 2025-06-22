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

client = genai.Client(api_key="GEMINI_API_KEY")

router = APIRouter()


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
        print(f"Raw Gemini response: {raw}")
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