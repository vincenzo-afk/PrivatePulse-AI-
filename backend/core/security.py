"""Session token generation and validation."""

import uuid
from datetime import datetime, timedelta


def generate_session_id() -> str:
    """Generate a new unique session ID."""
    return str(uuid.uuid4())


def validate_session_id(session_id: str) -> bool:
    """Validate that a session ID is a valid UUID."""
    try:
        uuid.UUID(session_id)
        return True
    except (ValueError, AttributeError):
        return False
