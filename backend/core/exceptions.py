"""Custom exception classes for the application."""


class PrivatePulseError(Exception):
    """Base exception for all application errors."""

    def __init__(self, code: str, message: str, detail: dict | None = None):
        self.code = code
        self.message = message
        self.detail = detail or {}
        super().__init__(self.message)


class ExtractionError(PrivatePulseError):
    """Raised when document text extraction fails."""

    def __init__(self, message: str, detail: dict | None = None):
        super().__init__("EXTRACTION_FAILED", message, detail)


class DocumentNotFoundError(PrivatePulseError):
    """Raised when a document is not found."""

    def __init__(self, document_id: str):
        super().__init__("DOCUMENT_NOT_FOUND", f"Document {document_id} not found")


class InvalidFileTypeError(PrivatePulseError):
    """Raised when an invalid file type is uploaded."""

    def __init__(self, file_type: str, allowed: list[str]):
        super().__init__(
            "INVALID_FILE_TYPE",
            f"File type '{file_type}' is not supported. Allowed types: {', '.join(allowed)}",
        )


class FileTooLargeError(PrivatePulseError):
    """Raised when file exceeds maximum size."""

    def __init__(self, size_mb: int, max_mb: int):
        super().__init__(
            "FILE_TOO_LARGE",
            f"File size ({size_mb}MB) exceeds maximum allowed ({max_mb}MB)",
        )


class SessionNotFoundError(PrivatePulseError):
    """Raised when a session is not found."""

    def __init__(self, session_id: str):
        super().__init__("SESSION_NOT_FOUND", f"Session {session_id} not found")


class EmbeddingError(PrivatePulseError):
    """Raised when embedding generation fails."""

    def __init__(self, message: str):
        super().__init__("EMBEDDING_FAILED", message)


class GenerationError(PrivatePulseError):
    """Raised when LLM generation fails."""

    def __init__(self, message: str):
        super().__init__("GENERATION_FAILED", message)


class GroqAPIError(PrivatePulseError):
    """Raised when Groq API returns an error."""

    def __init__(self, message: str):
        super().__init__("GROQ_API_ERROR", message)


class GroqRateLimitError(GroqAPIError):
    """Raised when Groq rate limit is hit."""

    def __init__(self, message: str = "Rate limit exceeded. Please wait and retry."):
        super().__init__(message)


class GroqContextLengthError(GroqAPIError):
    """Raised when prompt exceeds 128K context window."""

    def __init__(self, message: str = "Prompt too long. Reduce document context or use fewer images."):
        super().__init__(message)
