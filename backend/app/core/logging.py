import logging
import os
import sys
from loguru import logger
from app.core.config import settings

class InterceptHandler(logging.Handler):
    """
    Standard Handler to intercept standard Python logging logs and route them to Loguru.
    Ref: https://github.com/Delgan/loguru#entirely-compatible-with-standard-logging
    """
    def emit(self, record):
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_name == "emit":
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())

def setup_logging():
    """Configure Loguru structured logging console and rotated file targets."""
    # Clear all default standard logger handlers
    logging.root.handlers = []
    
    # Set levels for standard loggers
    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"):
        logging_logger = logging.getLogger(logger_name)
        logging_logger.handlers = [InterceptHandler()]
        logging_logger.propagate = False

    # Ensure log output directories exist
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)
    log_file_path = os.path.join(log_dir, "ridemate_backend.log")

    # Define clean layout format
    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    )

    # Configure Loguru
    logger.configure(
        handlers=[
            # Console logger output
            {
                "sink": sys.stdout,
                "level": settings.LOG_LEVEL,
                "format": log_format,
                "colorize": True,
            },
            # Daily rotated file log output
            {
                "sink": log_file_path,
                "level": settings.LOG_LEVEL,
                "format": log_format,
                "rotation": "00:00",  # Rotates daily at midnight
                "retention": "30 days",
                "compression": "zip",
                "enqueue": True,      # Thread-safe log writing
            }
        ]
    )

    logger.info("centralized structured logging setup completed.")
