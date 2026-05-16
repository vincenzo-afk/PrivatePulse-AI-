# PrivatePulse AI - Architecture

## System Overview

PrivatePulse AI is a privacy-first, RAG-powered document intelligence application. It consists of a Next.js frontend and a FastAPI backend, with ChromaDB as the vector store and SQLite for metadata.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Landing  │ │Dashboard │ │   Chat   │ │  Audit Trail   │  │
│  │   Page   │ │  Page    │ │   Page   │ │    Page        │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Zustand Store + TanStack Query              │   │
│  └──────────────────────────────────────────────────────┘   │
│                    │ HTTP (Axios)                            │
├────────────────────┼────────────────────────────────────────┤
│                    ▼                                        │
│              FastAPI Backend                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    API Routes                          │   │
│  │  /documents  /chat  /audit  /demo  /health            │   │
│  └──────────────────────────────────────────────────────┘   │
│                    │                                         │
│  ┌─────────────────┼──────────────────────────────────┐     │
│  │                 ▼                                  │     │
│  │          Service Layer                              │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │     │
│  │  │Extraction│ │ Chunking │ │   Embedding       │   │     │
│  │  │(PyMuPDF) │ │(LangChain)│ │  (OpenAI)         │   │     │
│  │  │+ Vision  │ │          │ │                   │   │     │
│  │  │ OCR(Groq)│ │          │ │                   │   │     │
│  │  └──────────┘ └──────────┘ └──────────────────┘   │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │     │
│  │  │ Indexing │ │Retrieval │ │   Generation      │   │     │
│  │  │(ChromaDB)│ │(Vector)  │ │  (Groq API)        │   │     │
│  │  └──────────┘ └──────────┘ └──────────────────┘   │     │
│  └────────────────────────────────────────────────────┘     │
│                    │                                         │
│  ┌─────────────────┼──────────────────────────────────┐     │
│  │                 ▼                                  │     │
│  │          Data Layer                                 │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │     │
│  │  │  SQLite  │ │ ChromaDB │ │  File System      │   │     │
│  │  │(Metadata)│ │(Vectors) │ │  (Uploads)         │   │     │
│  │  └──────────┘ └──────────┘ └──────────────────┘   │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Document Processing Pipeline

1. **Upload**: File received via multipart/form-data
2. **Validation**: Type (PDF/DOCX/TXT) and size check
3. **Extraction**: Text extracted using PyMuPDF (PDF), python-docx (DOCX), or built-in (TXT). Scanned PDFs fall back to **Groq vision OCR**.
4. **Chunking**: LangChain RecursiveCharacterTextSplitter (chunk_size=800, overlap=100)
5. **Embedding**: OpenAI text-embedding-3-small (1536 dimensions)
6. **Indexing**: Stored in ChromaDB (session-isolated collection)
7. **Completion**: Status updated to "ready"

### Query Flow

1. **Query Received**: User's question logged to audit
2. **Embedding**: Question embedded with same model
3. **Retrieval**: Vector similarity search in ChromaDB
4. **Filtering**: Results below 0.30 relevance threshold filtered
5. **Augmentation**: Top-K chunks formatted into prompt
6. **Generation**: Groq API (Llama 3.2 90B Vision) generates grounded answer
7. **Masking**: Sensitive entities in source previews masked
8. **Response**: Answer + citations + sources returned

### Vision Query Flow (with images)

1. User attaches images via ChatInput
2. Images are base64-encoded and sent as data URLs
3. Groq vision model processes text + images together
4. Model can read charts, interpret graphs, and perform OCR on images

## Security & Privacy

- **Session Isolation**: Each browser session gets its own Chroma collection
- **Minimum Context**: Only top-5 chunks sent to LLM, never full documents
- **Entity Masking**: SSN, credit cards, emails, etc. masked in UI
- **Audit Trail**: Every operation logged with timestamp
- **No Training**: Documents never used for model training
- **Vision Data**: Images are sent to Groq API only when explicitly attached by the user
