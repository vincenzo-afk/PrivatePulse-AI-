"""API routes init. Includes all route modules."""

from fastapi import APIRouter
from .health import router as health_router
from .documents import router as documents_router
from .chat import router as chat_router
from .audit import router as audit_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(documents_router)
api_router.include_router(chat_router)
api_router.include_router(audit_router)
