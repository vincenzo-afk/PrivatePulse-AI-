"""SQLModel database engine and session factory."""

from sqlmodel import SQLModel, create_engine, Session
from config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=False,
)


def create_tables():
    """Create all database tables."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Get a database session."""
    with Session(engine) as session:
        yield session
