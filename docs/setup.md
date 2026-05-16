# PrivatePulse AI - Setup Guide

## Prerequisites

- Node.js 20+
- Python 3.11+
- `uv` package manager (install: `curl -LsSf https://astral.sh/uv/install.sh | sh`)

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
# Edit .env and add your API keys:
# - GROQ_API_KEY (for Llama 3.2 90B Vision)
# - OPENAI_API_KEY (for embeddings)
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

## Environment Variables

### Backend (.env)

| Variable | Required | Default | Description |
|---|---|---|---|
| GROQ_API_KEY | Yes | - | Groq API key for Llama 3.2 90B Vision |
| OPENAI_API_KEY | Yes | - | OpenAI API key for embeddings |
| GROQ_LLM_MODEL | No | llama-3.2-90b-vision-preview | Groq model ID |
| GROQ_API_URL | No | https://api.groq.com/openai/v1/chat/completions | Groq API endpoint |
| GROQ_MAX_TOKENS | No | 4096 | Max generation tokens |
| GROQ_TEMPERATURE | No | 0.3 | Generation temperature |
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

## Demo Flow

1. Open http://localhost:3000
2. Click "Start with Demo Documents" to load sample documents
3. Navigate to Chat and ask questions about the documents
4. View sources in the right panel
5. Check the Audit Trail to see all logged operations
6. **Try Vision**: Attach images to your chat queries for multimodal understanding
