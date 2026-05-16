# PrivatePulse AI - Setup Guide

## Prerequisites

- Node.js 20+
- Python 3.11+
- `uv` package manager (install: `curl -LsSf https://astral.sh/uv/install.sh | sh`)
- **Ollama** - for local embeddings (https://ollama.ai)

## Install Ollama

1. Download and install Ollama from https://ollama.ai
2. Pull the embedding model:
   ```bash
   ollama pull nomic-embed-text
   ```
3. Make sure Ollama is running on http://localhost:11434

## Quick Start

### 1. Clone and enter the project

```bash
cd privatepulse
```

### 2. Backend Setup

```bash
cd backend
uv sync
cp ../.env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 3. Initialize the database

```bash
uv run python -c "from models.database import create_tables; create_tables()"
```

### 4. Start the backend

```bash
uv run uvicorn main:app --reload --port 8000
```

### 5. Frontend Setup (new terminal)

```bash
cd ../frontend
npm install
cp .env.example .env.local
npm run dev
```

### 6. Open the app

- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

## Usage Flow

1. Open http://localhost:3000
2. Go to Dashboard and upload your documents (PDF, TXT, or DOCX)
3. Wait for processing to complete (status will change to "Ready")
4. Navigate to Chat and ask questions about your documents
5. View sources in the right panel
6. Check the Audit Trail to see all logged operations

## Vision Features

- **Scanned PDF OCR**: When text extraction fails, PDF pages are auto-converted to images and processed via the Groq vision model
- **Image-based Queries**: Attach images to your chat queries for multimodal understanding
- **5 Images Per Request**: Max 5 images per query (Groq API limit)

## Environment Variables

### Backend (.env)

| Variable | Required | Default | Description |
|---|---|---|---|
| GROQ_API_KEY | Yes | - | Groq API key for Llama 3.2 90B Vision |
| EMBEDDING_PROVIDER | No | ollama | "ollama" (local) or "openai" (cloud) |
| OLLAMA_BASE_URL | No | http://localhost:11434 | Ollama API endpoint |
| OLLAMA_EMBEDDING_MODEL | No | nomic-embed-text | Ollama embedding model |
| GROQ_MODEL | No | llama-3.2-90b-vision-preview | Groq model ID |
| DATABASE_URL | No | sqlite:///./privatepulse.db | SQLite database path |
| UPLOAD_DIR | No | ./uploads | Upload directory |
| CHROMA_PERSIST_DIR | No | ./data/chroma_db | ChromaDB persistence directory |
| MAX_UPLOAD_SIZE_MB | No | 20 | Max file upload size |
| CORS_ORIGINS | No | http://localhost:3000 | Allowed CORS origins |

### Frontend (.env.local)

| Variable | Default | Description |
|---|---|---|
| NEXT_PUBLIC_API_URL | http://localhost:8000/api/v1 | Backend API URL |
| NEXT_PUBLIC_APP_NAME | PrivatePulse AI | Application name |