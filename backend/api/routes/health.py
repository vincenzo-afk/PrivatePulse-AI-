"""Health check endpoint."""

import time
from fastapi import APIRouter
from config import settings

router = APIRouter()
_start_time = time.time()


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "version": settings.version,
        "uptime_seconds": int(time.time() - _start_time),
        "llm_provider": "groq",
        "llm_model": settings.groq_model,
        "embedding_provider": "openai",
        "embedding_model": settings.embedding_model,
        "vision_enabled": True,
    }
