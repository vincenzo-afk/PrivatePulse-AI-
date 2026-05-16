"""In-memory sliding window rate limiter.

Uses a simple sliding window counter per client key (session_id or IP).
No external dependencies required. Suitable for single-process deployments.
"""

import time
import asyncio
from collections import defaultdict
from typing import Callable
from fastapi import Request, Response, HTTPException
from starlette.status import HTTP_429_TOO_MANY_REQUESTS
from core.logging import get_logger

logger = get_logger(__name__)


class SlidingWindowRateLimiter:
    """Sliding window rate limiter using in-memory counters.

    Each window is a fixed duration (e.g., 60 seconds) with a max number of requests.
    Windows are tracked per client key.
    """

    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._windows: dict[str, list[float]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def check(self, key: str) -> tuple[bool, int, int, int]:
        """Check if a request is allowed.

        Returns:
            Tuple of (allowed, current_count, limit)
        """
        now = time.time()
        window_start = now - self.window_seconds

        async with self._lock:
            timestamps = self._windows[key]
            # Remove expired timestamps
            self._windows[key] = [t for t in timestamps if t > window_start]
            current_count = len(self._windows[key])

            if current_count >= self.max_requests:
                retry_after = (
                    int(timestamps[0] + self.window_seconds - now)
                    if timestamps
                    else self.window_seconds
                )
                return False, current_count, self.max_requests, retry_after

            self._windows[key].append(now)
            return True, current_count + 1, self.max_requests, 0

    async def cleanup_expired(self):
        """Periodically clean up expired entries to prevent memory leaks."""
        now = time.time()
        window_start = now - self.window_seconds
        async with self._lock:
            expired_keys = []
            for key, timestamps in self._windows.items():
                self._windows[key] = [t for t in timestamps if t > window_start]
                if not self._windows[key]:
                    expired_keys.append(key)
            for key in expired_keys:
                del self._windows[key]

    @property
    def tracked_keys(self) -> int:
        return len(self._windows)


# Default rate limiters
# 30 requests per minute for expensive LLM endpoints
query_rate_limiter = SlidingWindowRateLimiter(max_requests=30, window_seconds=60)
# 60 requests per minute for general read endpoints
general_rate_limiter = SlidingWindowRateLimiter(max_requests=60, window_seconds=60)


async def rate_limit_middleware(request: Request, call_next: Callable):
    """FastAPI middleware that applies rate limiting to specific paths."""
    path = request.url.path

    # Determine which rate limiter to use based on path
    if "/api/v1/chat/query" in path:
        limiter = query_rate_limiter
    elif any(p in path for p in ["/api/v1/documents/upload"]):
        limiter = general_rate_limiter
    else:
        return await call_next(request)

    # Get client key: prefer session_id from header, fall back to IP
    client_key = (
        request.headers.get("X-Session-ID") or request.client.host
        if request.client
        else "unknown"
    )

    allowed, count, limit, retry_after = await limiter.check(client_key)

    if not allowed:
        logger.warning(
            "rate_limit_exceeded",
            client_key=client_key[:8] + "...",
            path=path,
            count=count,
            limit=limit,
        )
        raise HTTPException(
            status_code=HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": {
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": f"Too many requests. Please wait {retry_after} seconds before trying again.",
                    "detail": {
                        "retry_after_seconds": retry_after,
                        "limit": limit,
                        "current": count,
                    },
                }
            },
            headers={"Retry-After": str(retry_after)},
        )

    response = await call_next(request)
    # Add rate limit headers
    response.headers["X-RateLimit-Limit"] = str(limit)
    response.headers["X-RateLimit-Remaining"] = str(limit - count)
    return response
