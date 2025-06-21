from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from configs import logger
import os
import sys

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
                "LOG_LEVEL": os.environ.get("LOG_LEVEL", "INFO")
            }
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