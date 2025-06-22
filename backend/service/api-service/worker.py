import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from controllers import router as api_router # Import the router from controllers
from configs import logger, init_clients # Import logger and init_clients from configs

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up Python Worker Service...")
    try:
        init_clients() # Initialize Firestore and S3 clients from configs.py
        logger.info("Python Worker Service startup complete.")
        yield
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise
    finally:
        # Shutdown (if needed)
        logger.info("Shutting down Python Worker Service...")

app = FastAPI(
    title="Python Worker Service",
    description="Handles direct and R2-based code execution for Python.",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API routes
app.include_router(api_router)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port) 