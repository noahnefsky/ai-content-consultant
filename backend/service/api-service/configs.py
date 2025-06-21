import logging
import os

# Configure logging
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

# Create logger
logger = logging.getLogger("api-service")
logger.setLevel(getattr(logging, LOG_LEVEL))

# Create console handler with a simple format
handler = logging.StreamHandler()
handler.setLevel(getattr(logging, LOG_LEVEL))

# Create formatter
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
handler.setFormatter(formatter)

# Add handler to logger
logger.addHandler(handler)

def init_clients():
    """Initialize any clients needed by the application."""
    logger.info("API Service initialization complete - no external clients needed for basic deployment.") 