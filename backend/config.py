"""Application configuration via pydantic-settings."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Keys
    groq_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None

    # Groq LLM settings
    groq_model: str = "llama-3.2-90b-vision-preview"
    groq_api_url: str = "https://api.groq.com/openai/v1/chat/completions"
    groq_max_tokens: int = 4096
    groq_temperature: float = 0.3

    # Database
    database_url: str = "sqlite:///./privatepulse.db"

    # Storage
    upload_dir: str = "./uploads"
    chroma_persist_dir: str = "./data/chroma_db"

    # Upload limits
    max_upload_size_mb: int = 20
    allowed_extensions: str = "pdf,txt,docx"

    # RAG settings
    top_k_retrieval: int = 5
    chunk_size: int = 800
    chunk_overlap: int = 100
    min_relevance_score: float = 0.30

    # Model settings
    embedding_model: str = "text-embedding-3-small"

    # Server
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:3000"
    version: str = "1.0.0"

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def allowed_extensions_list(self) -> list[str]:
        return [ext.strip().lower() for ext in self.allowed_extensions.split(",")]

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "case_sensitive": False}


settings = Settings()
