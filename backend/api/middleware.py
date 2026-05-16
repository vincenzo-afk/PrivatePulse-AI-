"""API middleware for session injection, UUID validation, and request logging."""

import time
import uuid
from fastapi import Request, Response, HTTPException
from starlette.status import HTTP_400_BAD_REQUEST
from core.logging import get_logger

logger = get_logger(__name__)


async def session_middleware(request: Request, call_next):
    """Middleware that ensures session ID is available and valid.

    If the X-Session-ID header is missing, generates a new UUID.
    If present but malformed, rejects the request with 400.
    """
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        # Generate a session ID if not provided
        session_id = str(uuid.uuid4())
        request.state.session_id = session_id
    else:
        # Validate that the provided session ID is a valid UUID
        try:
            parsed = uuid.UUID(session_id)
            # Normalize to canonical form
            request.state.session_id = str(parsed)
        except (ValueError, AttributeError):
            logger.warning("invalid_session_id", provided=session_id[:20])
            raise HTTPException(
                status_code=HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "INVALID_SESSION_ID",
                        "message": "The provided session ID is not a valid UUID format.",
                        "detail": {},
                    }
                },
            )

    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    # Log request
    logger.info(
        "api_request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration_ms=int(process_time * 1000),
        session_id=session_id[:8] + "...",
    )

    # Add processing time header
    response.headers["X-Process-Time-MS"] = str(int(process_time * 1000))
    return response
