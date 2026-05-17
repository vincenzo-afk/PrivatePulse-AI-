"""PrivatePulse AI - FastAPI application entry point."""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from core.exceptions import PrivatePulseError
from core.logging import configure_logging, get_logger
from models.database import create_tables
from api.middleware import session_middleware
from core.rate_limiter import rate_limit_middleware
from api.routes import api_router

# Configure structured logging
configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize resources on startup, clean up on shutdown."""
    logger.info("application_starting", version=settings.version)
    # Create database tables
    create_tables()
    # Ensure upload directory exists
    import os
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(settings.chroma_persist_dir, exist_ok=True)

    # Start periodic rate limiter cleanup
    from core.rate_limiter import query_rate_limiter
    cleanup_task = asyncio.create_task(_cleanup_rate_limiter())

    yield

    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    logger.info("application_shutting_down")


async def _cleanup_rate_limiter():
    """Periodically clean up expired rate limiter entries."""
    from core.rate_limiter import query_rate_limiter, general_rate_limiter
    while True:
        await asyncio.sleep(300)  # Every 5 minutes
        await query_rate_limiter.cleanup_expired()
        await general_rate_limiter.cleanup_expired()


app = FastAPI(
    title="PrivatePulse AI",
    description="Privacy-first RAG-powered document intelligence assistant",
    version=settings.version,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session middleware
app.middleware("http")(session_middleware)

# Rate limiting middleware (applied after session middleware)
app.middleware("http")(rate_limit_middleware)


# Global exception handler
@app.exception_handler(PrivatePulseError)
async def privatepulse_error_handler(request: Request, exc: PrivatePulseError):
    """Handle known application errors with structured responses."""
    status_codes = {
        "EXTRACTION_FAILED": 500,
        "DOCUMENT_NOT_FOUND": 404,
        "INVALID_FILE_TYPE": 400,
        "FILE_TOO_LARGE": 400,
        "SESSION_NOT_FOUND": 404,
        "EMBEDDING_FAILED": 400,
        "GENERATION_FAILED": 400,
        "GROQ_API_ERROR": 400,
    }
    status = status_codes.get(exc.code, 500)
    return JSONResponse(
        status_code=status,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "detail": exc.detail,
            }
        },
    )


@app.exception_handler(Exception)
async def general_error_handler(request: Request, exc: Exception):
    """Handle unexpected errors with a safe response."""
    logger.exception("unhandled_error", path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred. Please try again.",
                "detail": {},
            }
        },
    )


# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint - API info."""
    return {
        "name": "PrivatePulse AI API",
        "version": settings.version,
        "docs": "/docs",
    }
# Uvicorn reload trigger for updated .env settings & embedding methods
