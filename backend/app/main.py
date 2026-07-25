from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from loguru import logger

from app.core.config import settings
from app.core.logging import setup_logging
from app.middleware.logging import LoggingMiddleware
from app.api.v1.api import api_router
from app.schemas.response import ErrorResponse

# Initialize structured logger configurations
setup_logging()

# Setup FastAPI Instance
app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API corridor supporting RideMate carpooling matching services",
    version="0.1.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS Policy configuration
cors_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
]
if settings.CORS_ORIGINS:
    for o in settings.CORS_ORIGINS:
        if o != "*" and o not in cors_origins:
            cors_origins.append(o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.middleware.rate_limit import RateLimitMiddleware

# Security & Latency Interceptors
app.add_middleware(RateLimitMiddleware, requests_per_minute=600)
app.add_middleware(LoggingMiddleware)


# Version-1 routes registry
app.include_router(api_router, prefix="/api/v1")

from app.api.v1.endpoints.websocket import router as ws_router
from app.websocket.redis_bus import redis_bus
from app.services.websocket_service import start_heartbeat_monitor, stop_heartbeat_monitor

# Root level /ws endpoint route
app.include_router(ws_router)


@app.on_event("startup")
async def startup_event():
    """Initialize Redis Pub/Sub and heartbeat monitor task."""
    logger.info("Application starting: initializing Redis bus and heartbeat monitor.")
    await redis_bus.connect()
    start_heartbeat_monitor()


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up background tasks and Redis connection on shutdown."""
    logger.info("Application shutting down: closing Redis bus and heartbeat monitor.")
    stop_heartbeat_monitor()
    await redis_bus.disconnect()



# --- GLOBAL EXCEPTION HANDLERS ---

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Intercept validation errors and return structured error outputs."""
    errors = []
    for err in exc.errors():
        field = " -> ".join(str(p) for p in err.get("loc", []))
        msg = err.get("msg", "Validation mismatch")
        errors.append(f"{field}: {msg}")
        
    logger.warning(f"Request validation failure on path {request.url.path}: {errors}")
    
    payload = ErrorResponse(
        success=False,
        message="Request parameters validation failed.",
        errors=errors,
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=payload.model_dump(),
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Intercept standard HTTP exception messages."""
    logger.warning(f"HTTP exception route error on {request.url.path} - Code: {exc.status_code} - Detail: {exc.detail}")
    
    payload = ErrorResponse(
        success=False,
        message=str(exc.detail),
        errors=[str(exc.detail)],
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=payload.model_dump(),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all fallback filter to intercept and logs unexpected database/server failures."""
    logger.exception(f"Unhandled system error encountered on {request.url.path} - Detail: {str(exc)}")
    
    payload = ErrorResponse(
        success=False,
        message="Internal server execution failure.",
        errors=[str(exc)] if settings.DEBUG else ["Please contact administrator."],
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=payload.model_dump(),
    )


# Helper function to avoid import circular dependencies on JSONResponse
from fastapi.responses import JSONResponse
