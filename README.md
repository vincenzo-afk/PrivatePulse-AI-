# PrivatePulse AI 🔒

**Privacy-first, RAG-powered document intelligence for the Midnight Hackathon.**

PrivatePulse AI lets you interrogate your most sensitive documents — medical records, financial statements, legal contracts — using natural language AI, without ever exposing the raw contents of those files.

## Features

- 🔐 **Privacy-First Architecture** — Documents processed locally, only minimum context sent to AI
- 📄 **Multi-Format Support** — PDF, DOCX, and TXT files
- 🧠 **RAG-Powered Answers** — Grounded responses with inline citations
- 🖼️ **Vision Capabilities** — Upload images for multimodal queries; scanned PDF OCR fallback
- 🎯 **Session Isolation** — Each browser session has its own isolated data
- 👁️ **Entity Masking** — SSNs, credit cards, emails masked in UI previews
- 📋 **Full Audit Trail** — Every operation logged with timestamps
- 🚀 **Demo Documents** — Pre-loaded medical, financial, and legal samples

## Tech Stack

**Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, TanStack Query
**Backend:** FastAPI, Python 3.11+, ChromaDB, SQLite, LangChain
**AI:** Groq Llama 3.2 90B Vision, OpenAI Embeddings

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- `uv` package manager

### Setup

```bash
# Backend
cd backend
uv sync
cp ../.env.example .env
# Edit .env and add GROQ_API_KEY and OPENAI_API_KEY
uv run uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 and click "Start with Demo Documents" to begin.

## Architecture

```
Upload → Extract → Chunk → Embed → Index (ChromaDB)
  ↓
Query → Embed → Retrieve → Augment → Generate (Groq Llama 3.2 90B Vision) → Response
  ↓
Optional: Image uploads → Groq vision model for multimodal understanding
  ↓
Scanned PDFs → Auto-OCR via Groq vision fallback
```

## Vision Features

- **Scanned PDF OCR**: When text extraction fails, PDF pages are auto-converted to images and processed via the Groq vision model
- **Image-based Queries**: Users can upload images alongside text questions (e.g., "What does this chart show?")
- **Chart/Graph Understanding**: The vision model can read and interpret charts, graphs, and diagrams in documents
- **5 Images Per Request**: Max 5 images per query (Groq API limit)

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| GROQ_API_KEY | Yes | - | Groq API key for Llama 3.2 90B Vision |
| OPENAI_API_KEY | Yes | - | OpenAI API key for embeddings |
| GROQ_LLM_MODEL | No | llama-3.2-90b-vision-preview | Groq model ID |
| GROQ_API_URL | No | https://api.groq.com/openai/v1/chat/completions | Groq API endpoint |
| GROQ_MAX_TOKENS | No | 4096 | Max tokens for generation |
| GROQ_TEMPERATURE | No | 0.3 | Generation temperature |
| DATABASE_URL | No | sqlite:///./privatepulse.db | SQLite database path |

## License

MIT
