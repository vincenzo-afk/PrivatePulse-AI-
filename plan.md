# PrivatePulse AI — Complete Agent Build Plan

> **For AI Coding Agents (Cursor, Windsurf, Aider, etc.):**
> Read this entire document before writing a single line of code. This is the canonical specification. Every section is intentional. Follow the folder structure, naming conventions, data contracts, and component hierarchy exactly. Where a choice is left open, make the professional default decision and document it inline. Do not skip any section. Do not abbreviate implementations. Build the entire project end-to-end.

---

## 0. Mission Statement

PrivatePulse AI is a **privacy-first, RAG-powered document intelligence assistant** built for the Midnight Hackathon AI Track. Users upload confidential documents (medical records, contracts, financial statements, legal files) and interrogate them through a natural-language chat interface. The system returns grounded, cited answers without exposing raw document contents unnecessarily. Privacy is the product — not an afterthought.

The final deliverable must look and feel like a **production-grade, venture-backed SaaS tool** — not a hackathon prototype. Every screen, state, error case, and interaction must be polished.

---

## 1. Tech Stack — Locked Decisions

### 1.1 Frontend
| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | Use `app/` directory only. No Pages Router. |
| Language | TypeScript (strict mode) | `"strict": true` in tsconfig. No `any` without comment. |
| Styling | Tailwind CSS v3 | Use CSS variables via `@layer base` for design tokens. |
| Components | shadcn/ui | Install components individually. No barrel import of everything. |
| Icons | Lucide React | Consistent icon set only. |
| State | Zustand | One global store. No prop drilling beyond 2 levels. |
| Fetching | TanStack Query v5 | All server state via `useQuery` / `useMutation`. |
| File Upload | react-dropzone | Drag-and-drop with type/size validation. |
| Animations | Framer Motion | Page transitions and micro-interactions. |
| Toast/Alerts | sonner | Minimal, tasteful toasts. |
| Forms | react-hook-form + zod | All forms validated with Zod schemas. |
| Fonts | Geist Sans (body) + Geist Mono (code) | Via `next/font/google`. |

### 1.2 Backend
| Concern | Choice | Notes |
|---|---|---|
| Runtime | Python 3.11+ | Use `uv` for package management. |
| Framework | FastAPI | Async throughout. Pydantic v2 models. |
| ASGI Server | Uvicorn | With `--reload` in dev. |
| PDF Parsing | PyMuPDF (`fitz`) | Fast, reliable. Fallback: `pdfplumber`. |
| DOCX Parsing | python-docx | Standard library. |
| TXT Parsing | Built-in `open()` | UTF-8 with error replacement. |
| Chunking | LangChain `RecursiveCharacterTextSplitter` | chunk_size=800, chunk_overlap=100 |
| Embeddings | `text-embedding-3-small` (OpenAI) | Or `nomic-embed-text` via Ollama as fallback. |
| Vector Store | ChromaDB (local, persistent) | No external infra needed. |
| LLM | Groq Llama 3.2 90B Vision (llama-3.2-90b-vision-preview) | Primary. Configurable via `.env`. |
| Auth | Session cookie (UUID-based) | No login required for demo. Stateless session per browser. |
| File Storage | Local `./uploads/` directory | Namespaced by session ID. |
| Metadata DB | SQLite via SQLModel | Schema-first with Alembic migrations. |
| Logging | Python `logging` + structlog | JSON-structured logs to stdout. |
| CORS | FastAPI `CORSMiddleware` | Restrict to frontend origin in production. |

### 1.3 AI / RAG Pipeline
```
Upload → Extract → Normalize → Chunk → Embed → Index (Chroma)
Query → Embed Query → Similarity Search → Rank Chunks → Build Prompt → LLM → Parse Response → Return Answer + Citations
```

### 1.4 Privacy Layer
- No raw document text is ever returned to the frontend.
- Sensitive entity masking runs on all chunk previews before display.
- Audit log records every operation with timestamps and action types.
- Minimal context is sent to the LLM — only top-K retrieved chunks, not full documents.
- All processing is local except the LLM API call (which uses retrieved chunks only, never raw files).

---

## 2. Repository Structure

Create this exact folder structure. Every file listed must be created.

```
privatepulse/
├── README.md
├── .env.example
├── .gitignore
├── docker-compose.yml           # Optional: for easy local run
│
├── frontend/                    # Next.js app
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── postcss.config.js
│   ├── components.json          # shadcn config
│   │
│   ├── app/
│   │   ├── layout.tsx           # Root layout: font, global providers, Toaster
│   │   ├── globals.css          # Design tokens, Tailwind base
│   │   ├── page.tsx             # Landing page (/)
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Document management hub (/dashboard)
│   │   ├── chat/
│   │   │   ├── page.tsx         # Chat interface (/chat)
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx     # Specific session (/chat/[sessionId])
│   │   ├── privacy/
│   │   │   └── page.tsx         # Privacy explanation (/privacy)
│   │   └── audit/
│   │       └── page.tsx         # Audit trail (/audit)
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn generated components (do not edit manually)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx      # Left nav sidebar
│   │   │   ├── TopBar.tsx       # Top navigation bar
│   │   │   └── AppShell.tsx     # Wraps sidebar + main + right panel
│   │   ├── upload/
│   │   │   ├── DropZone.tsx     # Drag-and-drop upload area
│   │   │   ├── UploadProgress.tsx
│   │   │   └── FileTypeIcon.tsx
│   │   ├── documents/
│   │   │   ├── DocumentList.tsx
│   │   │   ├── DocumentCard.tsx
│   │   │   ├── DocumentStatus.tsx  # Processing badge (pending/processing/ready/error)
│   │   │   └── EmptyDocuments.tsx
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx   # Message list + scroll container
│   │   │   ├── ChatInput.tsx    # Textarea + send button + suggestions
│   │   │   ├── MessageBubble.tsx  # User and assistant message rendering
│   │   │   ├── CitationChip.tsx   # Inline source citation badge
│   │   │   ├── SourcesPanel.tsx   # Right drawer showing retrieved chunks
│   │   │   ├── SuggestedQuestions.tsx  # Clickable prompt suggestions
│   │   │   └── TypingIndicator.tsx
│   │   ├── privacy/
│   │   │   ├── PrivacyBadge.tsx    # Trust indicator shown in chat header
│   │   │   ├── PrivacyDashboard.tsx
│   │   │   ├── DataFlowDiagram.tsx  # Visual showing: local → LLM → response
│   │   │   └── PrivacyChecklist.tsx
│   │   ├── audit/
│   │   │   ├── AuditLog.tsx
│   │   │   ├── AuditEntry.tsx
│   │   │   └── AuditFilters.tsx
│   │   └── shared/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorState.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── MaskedText.tsx   # Renders text with sensitive values redacted
│   │
│   ├── lib/
│   │   ├── api.ts               # Axios instance + typed API client
│   │   ├── store.ts             # Zustand global store
│   │   ├── types.ts             # All shared TypeScript types
│   │   ├── constants.ts         # API_URL, file limits, accepted types
│   │   ├── utils.ts             # cn(), formatDate(), formatFileSize()
│   │   ├── hooks/
│   │   │   ├── useDocuments.ts
│   │   │   ├── useChat.ts
│   │   │   ├── useAuditLog.ts
│   │   │   └── useSession.ts
│   │   └── masking.ts           # Client-side sensitive text masking
│   │
│   └── public/
│       ├── demo/                # Preloaded demo documents (PDF, TXT, DOCX)
│       │   ├── medical-report-sample.pdf
│       │   ├── financial-statement-sample.pdf
│       │   └── contract-sample.pdf
│       └── images/
│           └── logo.svg
│
├── backend/                     # FastAPI app
│   ├── pyproject.toml           # uv project file
│   ├── main.py                  # FastAPI app entry point
│   ├── config.py                # Settings via pydantic-settings
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── documents.py     # Upload, list, delete, status
│   │   │   ├── chat.py          # Query endpoint, session management
│   │   │   ├── audit.py         # Audit log retrieval
│   │   │   ├── demo.py          # Load demo documents endpoint
│   │   │   └── health.py        # Health check
│   │   └── middleware.py        # Session injection, request logging
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── extraction.py        # PDF/DOCX/TXT text extraction
│   │   ├── chunking.py          # Text splitting logic
│   │   ├── embedding.py         # Embedding model client + batch embed
│   │   ├── indexing.py          # Chroma collection management
│   │   ├── retrieval.py         # Similarity search + re-ranking
│   │   ├── generation.py        # LLM prompt construction + answer parsing
│   │   ├── masking.py           # Sensitive entity detection + redaction
│   │   └── audit.py             # Audit event creation + storage
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── database.py          # SQLModel engine + session factory
│   │   ├── document.py          # Document, DocumentChunk ORM models
│   │   ├── session.py           # UserSession ORM model
│   │   └── audit.py             # AuditEvent ORM model
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── document.py          # Pydantic request/response schemas
│   │   ├── chat.py              # QueryRequest, QueryResponse, Citation
│   │   └── audit.py             # AuditEventSchema
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── exceptions.py        # Custom exception classes
│   │   ├── logging.py           # structlog configuration
│   │   └── security.py          # Session token generation + validation
│   │
│   ├── data/
│   │   ├── demo_documents/      # Source demo files for backend seeding
│   │   └── chroma_db/           # ChromaDB persistent storage (gitignored)
│   │
│   └── uploads/                 # Runtime upload storage (gitignored)
│
└── docs/
    ├── architecture.md          # System design narrative
    ├── privacy-model.md         # Privacy guarantees documentation
    ├── api-reference.md         # API endpoint documentation
    └── setup.md                 # Local setup and run instructions
```

---

## 3. Design System

### 3.1 Visual Identity
- **Theme:** Dark, trust-inspiring, futuristic-minimal. Think: encrypted terminal meets premium fintech dashboard.
- **Primary palette:**
  - Background: `#0A0B0F` (near-black)
  - Surface: `#111318` (card background)
  - Border: `#1E2028` (subtle separator)
  - Accent: `#00D4AA` (teal-green — signals safety, trust, privacy)
  - Accent secondary: `#6366F1` (indigo — AI/intelligence)
  - Danger: `#EF4444`
  - Warning: `#F59E0B`
  - Text primary: `#F0F2F5`
  - Text secondary: `#8B919E`
  - Text muted: `#4B5160`

- **Typography:**
  - Display: Geist Sans, weight 700–900, tracking tight
  - Body: Geist Sans, weight 400–500
  - Code/Mono: Geist Mono, weight 400

- **Border radius:** `rounded-xl` for cards, `rounded-lg` for inputs, `rounded-full` for badges/chips.

- **Shadows:** Subtle glow on accent elements using `box-shadow: 0 0 20px rgba(0, 212, 170, 0.15)`.

### 3.2 CSS Design Tokens (globals.css)
```css
@layer base {
  :root {
    --bg-base: 10 11 15;
    --bg-surface: 17 19 24;
    --bg-elevated: 22 25 32;
    --border: 30 32 40;
    --accent: 0 212 170;
    --accent-secondary: 99 102 241;
    --text-primary: 240 242 245;
    --text-secondary: 139 145 158;
    --text-muted: 75 81 96;
    --danger: 239 68 68;
    --warning: 245 158 11;
  }
}
```

### 3.3 Component Standards
- All cards: `bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] rounded-xl`
- All primary buttons: `bg-[rgb(var(--accent))] text-black font-semibold hover:opacity-90 transition-opacity`
- All ghost buttons: `border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:border-[rgb(var(--accent))/30]`
- Focus rings: `focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))]/50`
- Loading states: Animated skeleton with `animate-pulse bg-[rgb(var(--bg-elevated))]`

---

## 4. Page-by-Page Specification

### 4.1 Landing Page (`/`)

**Purpose:** First impression. Communicate value, privacy promise, and get user into demo immediately.

**Layout:**
```
[TopBar: Logo + Nav links + "Start Demo" CTA]
[Hero Section]
  - Headline: "Your Documents. Your Questions. Zero Exposure."
  - Subheadline: "PrivatePulse uses AI to answer questions about your sensitive files — without exposing what's inside."
  - Two CTAs: "Start with Demo Documents" (primary) | "Upload Your Own" (ghost)
  - Animated privacy shield or data-flow visual
[Feature Grid — 3 columns]
  - Private Knowledge Index
  - Grounded Answers with Citations
  - Full Audit Trail
[Privacy Promise Section]
  - "What we never do" checklist
  - Inspired by Midnight's confidential computing vision
[Footer: GitHub | Privacy | Docs]
```

**Interactions:**
- "Start with Demo Documents" → calls `POST /api/demo/load` → redirects to `/chat`
- "Upload Your Own" → redirects to `/dashboard`
- Subtle animated background: grid with moving particles or noise gradient

**States:** Static page. No loading states needed.

---

### 4.2 Dashboard (`/dashboard`)

**Purpose:** Document management hub. Upload, view status, manage documents.

**Layout:**
```
[AppShell]
  [Sidebar: nav links active on Dashboard]
  [Main Content]
    [Page Header: "Your Documents" + upload button]
    [DropZone: large drag-and-drop area]
    [Document Grid: DocumentCard × N]
    [Empty State when no documents]
  [No right panel on dashboard]
```

**DropZone behavior:**
- Accepts: `.pdf`, `.txt`, `.docx`
- Max file size: 20MB per file
- Multiple files: yes (up to 10 at once)
- Shows file preview with name, size, type icon before upload
- Progress bar during upload
- Error states: wrong type, too large, server error

**DocumentCard shows:**
- File name
- File type icon (PDF/TXT/DOCX)
- File size
- Upload date (relative: "2 minutes ago")
- Chunk count (once processed)
- Status badge: `pending` (gray) | `processing` (amber, animated) | `ready` (green) | `error` (red)
- Actions: "Ask Questions" button → navigates to `/chat` | Delete icon (with confirm dialog)

**Document status polling:**
- If any document is in `pending` or `processing` state, poll `GET /api/documents/{id}/status` every 3 seconds.
- Stop polling when all documents reach `ready` or `error`.

---

### 4.3 Chat Page (`/chat` and `/chat/[sessionId]`)

**Purpose:** Core product experience. Ask questions, get grounded answers.

**Layout:**
```
[AppShell]
  [Sidebar: nav links, document list mini-view]
  [Main Content: Chat]
    [ChatHeader: session name + document scope + PrivacyBadge]
    [ChatWindow: message list, auto-scroll to bottom]
    [SuggestedQuestions: only when chat is empty]
    [ChatInput: multiline textarea + send button]
  [Right Panel: SourcesPanel (slides in when answer has citations)]
```

**Message types:**
1. **User message:** Right-aligned, teal accent bubble, avatar initial.
2. **Assistant message:** Left-aligned, surface card, includes:
   - Answer text with inline `[1]`, `[2]` citation markers
   - Citation chips row: `[Source: contract.pdf, page 3]`
   - Privacy indicator: small lock icon + "Answer grounded in your documents"
   - Copy button (copies answer text)
3. **System message:** Centered, muted text (e.g., "Documents loaded. Ready to answer questions.")
4. **Error message:** Red border, error icon, retry button.
5. **Typing indicator:** Three animated dots while waiting for response.

**SourcesPanel (right drawer):**
- Opens automatically when an answer is received.
- Lists each retrieved source chunk with:
  - Document name + page/section reference
  - Relevance score bar (visual only, normalized 0-100%)
  - Chunk preview text (with sensitive values masked)
  - Expand/collapse toggle for full chunk text

**SuggestedQuestions (empty state):**
- Show 4–6 clickable question chips relevant to uploaded documents.
- Examples: "What is the total amount due?", "Summarize the key risks.", "When does this contract expire?", "What are the payment terms?"
- Clicking a chip populates ChatInput and submits.

**ChatInput:**
- Multiline textarea (grows up to 6 lines, then scrolls)
- Keyboard: `Enter` sends, `Shift+Enter` adds newline
- Character limit: 1000 chars with counter shown near limit
- Disabled with spinner while response is loading
- Placeholder: "Ask anything about your documents..."

**Document Scope Selector:**
- Dropdown in ChatHeader to select which uploaded documents to query ("All documents" or specific subset).

---

### 4.4 Privacy Page (`/privacy`)

**Purpose:** Build trust. Explain exactly what happens to the user's data.

**Sections:**

1. **Privacy Promise Header**
   - "Your data stays yours" with shield icon
   - Summary: "PrivatePulse processes your documents locally and sends only retrieved context to the AI model — never your full files."

2. **Data Flow Diagram (DataFlowDiagram component)**
   - Visual step-by-step: Upload → Local Processing → Chunk Index → Query → AI Model → Response
   - Each step labeled with what happens and what does NOT happen
   - Highlight: "Only these chunks go to AI ↑" annotation

3. **Privacy Checklist**
   - ✅ Documents stored locally in your session only
   - ✅ Raw files are never sent to the AI model
   - ✅ Only relevant text excerpts are included in AI prompts
   - ✅ Sensitive values (SSN, account numbers, phone numbers) are masked in the UI
   - ✅ Full audit trail of every access
   - ✅ Session data deleted on browser close (configurable)
   - ❌ We do not train on your documents
   - ❌ We do not store documents between sessions
   - ❌ We do not share your data with third parties

4. **Midnight Alignment Section**
   - Explain how the architecture is inspired by Midnight's confidential computing vision
   - Frame: "In a full Midnight deployment, document processing would run inside confidential smart contracts, ensuring even the application operator cannot see your data."

5. **Technical Details (expandable)**
   - Embedding model used
   - LLM API used (Groq Llama 3.2 90B Vision)
   - What is included in each API call
   - How session isolation works

---

### 4.5 Audit Page (`/audit`)

**Purpose:** Transparency. Show a complete log of every action taken.

**Layout:**
```
[Header: "Audit Trail" + description + export button]
[Filters: event type | date range | document filter]
[Audit Log: chronological list of AuditEntry components]
[Pagination or infinite scroll]
```

**AuditEntry shows:**
- Timestamp (exact + relative)
- Event type badge (UPLOAD | EXTRACT | CHUNK | EMBED | QUERY | ANSWER | DELETE)
- Description (human-readable)
- Document name (if applicable)
- Session ID (truncated)
- Expandable: technical details (chunk count, token count, model used)

**Event types to log:**
- `document.uploaded` — file name, size, type
- `document.extracted` — page count, character count
- `document.chunked` — chunk count produced
- `document.embedded` — embedding model, vector count
- `document.deleted` — file name
- `query.received` — question text (truncated to 100 chars)
- `retrieval.executed` — top-K chunks retrieved, similarity scores
- `answer.generated` — model used, token count, source count
- `demo.loaded` — demo document set name

---

## 5. API Specification

All endpoints prefixed `/api/v1/`. All responses are JSON. All errors follow:
```json
{ "error": { "code": "DOCUMENT_NOT_FOUND", "message": "Human-readable message", "detail": {} } }
```

### 5.1 Health
```
GET /api/v1/health
→ 200 { "status": "ok", "version": "1.0.0", "uptime_seconds": 3600 }
```

### 5.2 Documents
```
POST   /api/v1/documents/upload
  Body: multipart/form-data { files: File[] }
  Response: { documents: DocumentSchema[] }
  Errors: 400 INVALID_FILE_TYPE, 400 FILE_TOO_LARGE, 500 EXTRACTION_FAILED

GET    /api/v1/documents
  Query: ?session_id=xxx
  Response: { documents: DocumentSchema[] }

GET    /api/v1/documents/{document_id}
  Response: { document: DocumentSchema }
  Errors: 404 DOCUMENT_NOT_FOUND

GET    /api/v1/documents/{document_id}/status
  Response: { id: string, status: "pending"|"processing"|"ready"|"error", progress: number, error_message?: string }

DELETE /api/v1/documents/{document_id}
  Response: { success: true }
  Errors: 404 DOCUMENT_NOT_FOUND
```

**DocumentSchema:**
```typescript
{
  id: string
  session_id: string
  file_name: string
  file_size: number         // bytes
  file_type: "pdf" | "txt" | "docx"
  status: "pending" | "processing" | "ready" | "error"
  chunk_count: number | null
  page_count: number | null
  uploaded_at: string       // ISO 8601
  processed_at: string | null
  error_message: string | null
}
```

### 5.3 Chat
```
POST /api/v1/chat/query
  Body: {
    session_id: string,
    question: string,           // max 1000 chars
    document_ids?: string[],    // null = query all session documents
    conversation_history?: Message[]  // last N turns for context
  }
  Response: {
    answer: string,
    citations: Citation[],
    sources: SourceChunk[],
    model_used: string,
    tokens_used: { input: number, output: number },
    processing_time_ms: number,
    privacy_summary: {
      chunks_retrieved: number,
      documents_accessed: string[],
      raw_files_sent: false
    }
  }

GET /api/v1/chat/sessions/{session_id}
  Response: { session: SessionSchema, message_count: number }

GET /api/v1/chat/suggested-questions
  Query: ?session_id=xxx
  Response: { questions: string[] }
```

**Citation:**
```typescript
{
  id: string
  document_id: string
  document_name: string
  page_number: number | null
  section: string | null
  chunk_index: number
  relevance_score: number     // 0.0 – 1.0
  text_preview: string        // first 200 chars, sensitive values masked
}
```

### 5.4 Demo
```
POST /api/v1/demo/load
  Body: { session_id: string, demo_set?: "medical" | "financial" | "legal" | "all" }
  Response: { documents: DocumentSchema[], message: string }
```

### 5.5 Audit
```
GET /api/v1/audit/events
  Query: ?session_id=xxx&event_type=xxx&limit=50&offset=0&from=ISO&to=ISO
  Response: { events: AuditEventSchema[], total: number, page: number }
```

---

## 6. Backend Service Implementation

### 6.1 `services/extraction.py`
```python
"""
Text extraction service. Handles PDF, DOCX, and TXT.
Returns ExtractedDocument with full text, page mapping, and metadata.
"""

class ExtractedDocument:
    text: str
    pages: list[PageContent]      # [{ page_num, text, char_offset }]
    page_count: int
    char_count: int
    metadata: dict

def extract(file_path: Path, file_type: str) -> ExtractedDocument:
    """
    Routes to correct extractor. Raises ExtractionError on failure.
    For PDFs: use PyMuPDF. Extract text page by page. Preserve page numbers.
    For DOCX: use python-docx. Extract paragraphs and tables. Map to sections.
    For TXT: read as UTF-8 with error='replace'. Treat as single page.
    """
```

**Edge cases to handle:**
- Scanned PDFs with no extractable text → return `ExtractionError` with message "This PDF appears to be scanned. Text extraction requires OCR which is not enabled."
- Password-protected PDFs → catch exception, return specific error.
- Empty files → return `ExtractionError`.
- Files with only whitespace → return `ExtractionError`.

### 6.2 `services/chunking.py`
```python
"""
Text chunking service. Splits extracted text into overlapping chunks.
Uses LangChain RecursiveCharacterTextSplitter as primary splitter.
Preserves source page mapping on each chunk.
"""

class DocumentChunk:
    chunk_id: str           # uuid4
    document_id: str
    text: str
    char_start: int
    char_end: int
    page_number: int | None
    section: str | None
    chunk_index: int        # sequential 0-based index within document

CHUNK_SIZE = 800
CHUNK_OVERLAP = 100
SEPARATORS = ["\n\n", "\n", ". ", " ", ""]  # Hierarchy for splitting

def chunk_document(extracted: ExtractedDocument, document_id: str) -> list[DocumentChunk]:
    """
    Splits extracted text. Maps each chunk back to page_number using char_offset.
    Returns list of DocumentChunk objects ready for embedding.
    """
```

### 6.3 `services/embedding.py`
```python
"""
Embedding service. Converts text to vector representations.
Primary: OpenAI text-embedding-3-small (1536 dims).
Fallback: sentence-transformers all-MiniLM-L6-v2 (384 dims, local).
Batch size: 100 chunks per API call.
"""

async def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Returns list of embedding vectors in the same order as input texts.
    Handles rate limiting with exponential backoff (max 3 retries).
    Logs embedding cost and time.
    """

async def embed_query(query: str) -> list[float]:
    """Single query embedding. Uses same model as document embedding."""
```

### 6.4 `services/indexing.py`
```python
"""
ChromaDB vector store management.
One collection per session_id.
Collection name format: "session_{session_id}"
Stores: embedding vectors + metadata (document_id, chunk_id, page_num, text)
"""

def get_or_create_collection(session_id: str) -> chromadb.Collection:
    """Returns existing or creates new Chroma collection for session."""

def add_chunks(session_id: str, chunks: list[DocumentChunk], embeddings: list[list[float]]) -> None:
    """Upserts chunks into the session collection with metadata."""

def delete_document_chunks(session_id: str, document_id: str) -> None:
    """Removes all chunks for a given document from the session collection."""
```

### 6.5 `services/retrieval.py`
```python
"""
Similarity retrieval service.
Embeds the query, searches Chroma, returns ranked chunks.
"""

class RetrievedChunk:
    chunk_id: str
    document_id: str
    document_name: str
    text: str
    page_number: int | None
    relevance_score: float      # cosine similarity, 0.0–1.0
    chunk_index: int

TOP_K = 5
MIN_RELEVANCE_SCORE = 0.30     # Filter out irrelevant chunks

async def retrieve(session_id: str, query: str, document_ids: list[str] | None) -> list[RetrievedChunk]:
    """
    1. Embed query.
    2. Search Chroma collection (optionally filtered by document_ids).
    3. Filter results below MIN_RELEVANCE_SCORE.
    4. Return up to TOP_K ranked results.
    """
```

### 6.6 `services/generation.py`
```python
"""
LLM answer generation service.
Builds structured RAG prompt and calls Groq API.
Parses response to extract answer and citation markers.
"""

SYSTEM_PROMPT = """
You are PrivatePulse, a private document intelligence assistant.
You answer questions ONLY based on the provided document excerpts.
Rules:
- If the documents do not contain enough information to answer confidently, say: "I couldn't find enough information in your documents to answer this question."
- Always cite your sources using [1], [2], etc. corresponding to the provided excerpts.
- Keep answers concise, accurate, and professional.
- Never fabricate information. Never guess.
- Never refer to yourself as an AI model from any specific company.
"""

async def generate_answer(
    question: str,
    chunks: list[RetrievedChunk],
    conversation_history: list[Message]
) -> GeneratedAnswer:
    """
    Builds prompt: system prompt + chunk context + conversation history + question.
    Calls Groq API (OpenAI-compatible).
    Parses response to extract answer text and citation references.
    Returns GeneratedAnswer with text, citations, and token usage.
    """
```

**Prompt format:**
```
[SYSTEM]: {SYSTEM_PROMPT}

[DOCUMENT EXCERPTS]:
[1] Source: {document_name}, Page {page_num}
{chunk_text}

[2] Source: {document_name}, Page {page_num}
{chunk_text}

... (up to TOP_K)

[CONVERSATION HISTORY]:
User: ...
Assistant: ...

[QUESTION]: {question}

Answer:
```

### 6.7 `services/masking.py`
```python
"""
Sensitive entity detection and masking.
Applies to chunk previews shown in the UI (not to LLM prompt - LLM gets raw text for accuracy).
"""

PATTERNS = {
    "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
    "credit_card": r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b",
    "phone": r"\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b",
    "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
    "account_number": r"\b(account|acct|a/c)[\s#:]*\d{6,16}\b",
    "routing_number": r"\brouting[\s#:]*\d{9}\b",
    "dob": r"\b(DOB|Date of Birth|Born)[\s:]*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
}

MASK_CHAR = "█"

def mask_text(text: str, entity_types: list[str] | None = None) -> MaskedText:
    """
    Applies regex patterns to find and replace sensitive values.
    Returns original text with matches replaced by MASK_CHAR × len(match).
    Also returns list of MaskedEntity with type, position, and char count.
    """
```

### 6.8 `services/audit.py`
```python
"""
Audit logging service.
Records every significant operation with full context.
Writes to SQLite via SQLModel.
"""

class AuditEventType(str, Enum):
    DOCUMENT_UPLOADED = "document.uploaded"
    DOCUMENT_EXTRACTED = "document.extracted"
    DOCUMENT_CHUNKED = "document.chunked"
    DOCUMENT_EMBEDDED = "document.embedded"
    DOCUMENT_DELETED = "document.deleted"
    QUERY_RECEIVED = "query.received"
    RETRIEVAL_EXECUTED = "retrieval.executed"
    ANSWER_GENERATED = "answer.generated"
    DEMO_LOADED = "demo.loaded"

async def log_event(
    session_id: str,
    event_type: AuditEventType,
    description: str,
    document_id: str | None = None,
    metadata: dict | None = None
) -> AuditEvent:
    """Creates and persists an AuditEvent record."""
```

---

## 7. Database Schema

### 7.1 Documents Table
```sql
CREATE TABLE document (
    id TEXT PRIMARY KEY,              -- UUID
    session_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,          -- absolute path on disk
    file_size INTEGER NOT NULL,       -- bytes
    file_type TEXT NOT NULL,          -- "pdf" | "txt" | "docx"
    status TEXT NOT NULL DEFAULT 'pending',
    chunk_count INTEGER,
    page_count INTEGER,
    char_count INTEGER,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    error_message TEXT
);
```

### 7.2 Document Chunks Table
```sql
CREATE TABLE document_chunk (
    id TEXT PRIMARY KEY,              -- UUID
    document_id TEXT NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    text TEXT NOT NULL,
    char_start INTEGER NOT NULL,
    char_end INTEGER NOT NULL,
    page_number INTEGER,
    section TEXT,
    chunk_index INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 7.3 User Sessions Table
```sql
CREATE TABLE user_session (
    id TEXT PRIMARY KEY,              -- UUID
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    document_count INTEGER NOT NULL DEFAULT 0,
    query_count INTEGER NOT NULL DEFAULT 0
);
```

### 7.4 Audit Events Table
```sql
CREATE TABLE audit_event (
    id TEXT PRIMARY KEY,              -- UUID
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    document_id TEXT,
    metadata TEXT,                    -- JSON blob
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_session ON audit_event(session_id, created_at DESC);
CREATE INDEX idx_audit_type ON audit_event(event_type);
```

---

## 8. State Management (Frontend)

### 8.1 Zustand Store (`lib/store.ts`)
```typescript
interface AppStore {
  // Session
  sessionId: string | null
  setSessionId: (id: string) => void
  initSession: () => void              // loads or creates session ID from localStorage

  // Documents
  documents: Document[]
  setDocuments: (docs: Document[]) => void
  addDocument: (doc: Document) => void
  updateDocument: (id: string, update: Partial<Document>) => void
  removeDocument: (id: string) => void

  // Chat
  activeDocumentIds: string[]          // which docs to query (empty = all)
  setActiveDocumentIds: (ids: string[]) => void
  messages: ChatMessage[]
  addMessage: (msg: ChatMessage) => void
  clearMessages: () => void
  isGenerating: boolean
  setIsGenerating: (v: boolean) => void

  // Sources panel
  sourcePanelOpen: boolean
  currentSources: SourceChunk[]
  openSourcePanel: (sources: SourceChunk[]) => void
  closeSourcePanel: () => void

  // UI
  sidebarOpen: boolean
  toggleSidebar: () => void
}
```

### 8.2 React Query Keys
```typescript
export const queryKeys = {
  documents: (sessionId: string) => ['documents', sessionId] as const,
  documentStatus: (docId: string) => ['document', docId, 'status'] as const,
  auditEvents: (sessionId: string) => ['audit', sessionId] as const,
  suggestedQuestions: (sessionId: string) => ['suggested-questions', sessionId] as const,
}
```

---

## 9. Frontend API Client (`lib/api.ts`)

```typescript
import axios from 'axios'

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach session ID to every request
client.interceptors.request.use((config) => {
  const sessionId = useAppStore.getState().sessionId
  if (sessionId) config.headers['X-Session-ID'] = sessionId
  return config
})

// Standard error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error?.message || 'An unexpected error occurred'
    toast.error(message)
    return Promise.reject(error)
  }
)

export const api = {
  documents: {
    upload: (files: File[]) => { /* FormData upload */ },
    list: (sessionId: string) => client.get<{ documents: Document[] }>('/documents'),
    getStatus: (id: string) => client.get<DocumentStatus>(`/documents/${id}/status`),
    delete: (id: string) => client.delete(`/documents/${id}`),
  },
  chat: {
    query: (payload: QueryRequest) => client.post<QueryResponse>('/chat/query', payload),
    suggestedQuestions: () => client.get<{ questions: string[] }>('/chat/suggested-questions'),
  },
  demo: {
    load: (set?: string) => client.post<{ documents: Document[] }>('/demo/load', { demo_set: set }),
  },
  audit: {
    getEvents: (params: AuditQueryParams) => client.get<AuditEventsResponse>('/audit/events', { params }),
  },
}
```

---

## 10. Sensitive Data Masking (Frontend)

### `lib/masking.ts`
```typescript
const PATTERNS: Record<string, RegExp> = {
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  phone: /\b(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  accountNumber: /\b(account|acct)[\s#:]*\d{6,16}\b/gi,
}

export function maskSensitiveText(text: string): string {
  let masked = text
  for (const pattern of Object.values(PATTERNS)) {
    masked = masked.replace(pattern, (match) => '█'.repeat(match.length))
  }
  return masked
}
```

### `components/shared/MaskedText.tsx`
```tsx
// Renders text with toggle: shows masked version by default,
// user can click "Reveal" to see original (with confirmation warning).
// Props: text (original), autoMask (default true), showToggle (default true)
```

---

## 11. Demo Document Set

Create three sample documents that showcase different use cases. Store in both `frontend/public/demo/` and `backend/data/demo_documents/`.

### Document 1: `medical-report-sample.pdf`
Content: A synthetic medical report for "Alex Johnson" containing:
- Patient demographics (with maskable SSN and DOB)
- Diagnosis: Type 2 Diabetes
- Medication list with dosages
- Lab results table (HbA1c, blood glucose, cholesterol)
- Doctor's notes and recommendations
- Follow-up appointment dates

Demo questions this should answer:
- "What medications is the patient taking?"
- "What are the key lab results?"
- "When is the next follow-up appointment?"
- "Summarize the doctor's recommendations."

### Document 2: `financial-statement-sample.pdf`
Content: A synthetic quarterly financial statement containing:
- Revenue, expenses, profit breakdown
- Balance sheet summary
- Account numbers (maskable)
- Cash flow analysis
- Q3 vs Q4 comparison table
- Auditor notes

Demo questions:
- "What was the total revenue this quarter?"
- "What are the main expense categories?"
- "Is the company profitable?"
- "What does the auditor say?"

### Document 3: `contract-sample.pdf`
Content: A synthetic service agreement containing:
- Parties involved (company names, contact emails — maskable)
- Service description
- Payment terms (amount, schedule, late fees)
- Termination clause
- Confidentiality clause
- Governing law

Demo questions:
- "What are the payment terms?"
- "How can this contract be terminated?"
- "What is the confidentiality clause?"
- "What law governs this agreement?"

---

## 12. Ingestion Pipeline (Full Flow)

This is the complete async pipeline that runs when a document is uploaded. Implement as a background task using FastAPI `BackgroundTasks`.

```python
async def process_document(document_id: str, file_path: Path, session_id: str):
    """
    Full ingestion pipeline. Updates document status at each step.
    Logs audit events throughout.
    """
    try:
        # Step 1: Update status to processing
        await update_document_status(document_id, "processing")

        # Step 2: Extract text
        await log_event(session_id, AuditEventType.DOCUMENT_EXTRACTED, ...)
        extracted = await extraction.extract(file_path, file_type)

        # Step 3: Chunk
        await log_event(session_id, AuditEventType.DOCUMENT_CHUNKED, ...)
        chunks = chunking.chunk_document(extracted, document_id)

        # Step 4: Save chunks to SQLite
        await save_chunks_to_db(chunks)

        # Step 5: Generate embeddings (in batches)
        await log_event(session_id, AuditEventType.DOCUMENT_EMBEDDED, ...)
        embeddings = await embedding.embed_texts([c.text for c in chunks])

        # Step 6: Index in Chroma
        indexing.add_chunks(session_id, chunks, embeddings)

        # Step 7: Update status to ready
        await update_document_status(document_id, "ready",
            chunk_count=len(chunks),
            page_count=extracted.page_count,
            processed_at=datetime.utcnow()
        )

    except ExtractionError as e:
        await update_document_status(document_id, "error", error_message=str(e))
        await log_event(session_id, AuditEventType.DOCUMENT_UPLOADED,
                       f"Extraction failed: {e}", document_id=document_id)
    except Exception as e:
        logger.exception(f"Unexpected error processing document {document_id}")
        await update_document_status(document_id, "error",
                                    error_message="An unexpected error occurred during processing.")
```

---

## 13. RAG Query Flow (Full Flow)

```python
async def handle_query(request: QueryRequest) -> QueryResponse:
    start_time = time.time()

    # Step 1: Log query received
    await audit.log_event(request.session_id, AuditEventType.QUERY_RECEIVED,
                         f"Query: {request.question[:100]}...")

    # Step 2: Retrieve relevant chunks
    retrieved_chunks = await retrieval.retrieve(
        session_id=request.session_id,
        query=request.question,
        document_ids=request.document_ids
    )

    # Step 3: Log retrieval
    await audit.log_event(request.session_id, AuditEventType.RETRIEVAL_EXECUTED,
                         f"Retrieved {len(retrieved_chunks)} chunks",
                         metadata={"scores": [c.relevance_score for c in retrieved_chunks]})

    # Step 4: Handle no-context case
    if not retrieved_chunks:
        return QueryResponse(
            answer="I couldn't find any relevant information in your documents to answer this question.",
            citations=[],
            sources=[],
            ...
        )

    # Step 5: Generate answer
    generated = await generation.generate_answer(
        question=request.question,
        chunks=retrieved_chunks,
        conversation_history=request.conversation_history or []
    )

    # Step 6: Log answer generated
    await audit.log_event(request.session_id, AuditEventType.ANSWER_GENERATED,
                         f"Answer generated using {len(retrieved_chunks)} sources",
                         metadata={"tokens": generated.tokens_used, "model": generated.model_used})

    # Step 7: Build citations with masked previews
    citations = [
        Citation(
            id=chunk.chunk_id,
            document_id=chunk.document_id,
            document_name=chunk.document_name,
            page_number=chunk.page_number,
            relevance_score=chunk.relevance_score,
            text_preview=masking.mask_text(chunk.text[:200])  # mask for UI
        )
        for chunk in retrieved_chunks
    ]

    return QueryResponse(
        answer=generated.text,
        citations=citations,
        sources=[build_source_chunk(c) for c in retrieved_chunks],
        model_used=generated.model_used,
        tokens_used=generated.tokens_used,
        processing_time_ms=int((time.time() - start_time) * 1000),
        privacy_summary={
            "chunks_retrieved": len(retrieved_chunks),
            "documents_accessed": list({c.document_name for c in retrieved_chunks}),
            "raw_files_sent": False
        }
    )
```

---

## 14. Session Management

### How sessions work:
1. On first visit, frontend generates a UUID and stores it in `localStorage` as `privatepulse_session_id`.
2. This session ID is sent as `X-Session-ID` header on every API request.
3. Backend creates a `UserSession` record on first use.
4. All documents, chunks, vectors, and audit events are namespaced to this session ID.
5. Chroma collection is named `session_{session_id}`.
6. When a user refreshes, they get their same session back via localStorage.
7. "Clear Session" button in settings wipes localStorage key and clears documents.

### Session isolation guarantees:
- Query A: Can only retrieve chunks from session A's Chroma collection.
- List Documents: Filters by `session_id` in SQL query.
- Audit Log: Filters by `session_id`.
- Two sessions cannot see each other's data.

---

## 15. Error Handling Standards

### Frontend errors:
| Scenario | Behavior |
|---|---|
| Upload wrong file type | Inline error on DropZone, red border, descriptive message |
| Upload fails (server error) | Toast error + document card shows `error` status |
| Query with no documents | Inline warning: "Upload documents first to ask questions." |
| Query fails | Error bubble in chat with retry button |
| API unreachable | Toast + global error banner at top of page |
| Document processing fails | Document card shows error status + error message tooltip |

### Backend errors:
- All exceptions caught at route level with try/except.
- Structured error response with `code`, `message`, `detail`.
- Never expose raw stack traces to frontend.
- Log full stack trace server-side.
- Return 500 for unexpected errors, 400 for validation, 404 for not found, 413 for file too large.

---

## 16. Environment Variables

### Frontend (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_MAX_FILE_SIZE_MB=20
NEXT_PUBLIC_APP_NAME=PrivatePulse AI
```

### Backend (`.env`):
```
# Required
GROQ_API_KEY=gsk_...
GROQ_LLM_MODEL=llama-3.2-90b-vision-preview
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
OPENAI_API_KEY=sk-...          # For embeddings (text-embedding-3-small)

# Optional overrides
DATABASE_URL=sqlite:///./privatepulse.db
UPLOAD_DIR=./uploads
CHROMA_PERSIST_DIR=./data/chroma_db
MAX_UPLOAD_SIZE_MB=20
ALLOWED_EXTENSIONS=pdf,txt,docx
TOP_K_RETRIEVAL=5
CHUNK_SIZE=800
CHUNK_OVERLAP=100
EMBEDDING_MODEL=text-embedding-3-small
GROQ_MAX_TOKENS=4096
GROQ_TEMPERATURE=0.3
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000
```

---

## 17. Local Setup Instructions

### Prerequisites:
- Node.js 20+
- Python 3.11+
- `uv` (install: `curl -LsSf https://astral.sh/uv/install.sh | sh`)

### Setup:
```bash
# 1. Clone and enter project
git clone <repo>
cd privatepulse

# 2. Backend setup
cd backend
uv sync
cp ../.env.example .env
# Edit .env and add your API keys

# 3. Initialize database
uv run python -c "from models.database import create_tables; create_tables()"

# 4. Start backend
uv run uvicorn main:app --reload --port 8000

# 5. Frontend setup (new terminal)
cd ../frontend
npm install
cp .env.example .env.local
npm run dev

# App runs at http://localhost:3000
# API docs at http://localhost:8000/docs
```

---

## 18. Build Order for AI Agent

**Follow this order exactly. Do not jump ahead. Complete each step fully before moving to the next.**

```
Step 1:  Scaffold folder structure (all directories and empty files)
Step 2:  Set up backend: main.py, config.py, database models, migrations
Step 3:  Implement extraction service (PDF, DOCX, TXT)
Step 4:  Implement chunking service
Step 5:  Implement embedding service
Step 6:  Implement indexing service (ChromaDB)
Step 7:  Implement document upload API route + background task pipeline
Step 8:  Implement retrieval service
Step 9:  Implement generation service (Groq API integration)
Step 10: Implement chat query API route
Step 11: Implement audit service + audit API route
Step 12: Implement demo load API route + create demo document files
Step 13: Set up Next.js frontend: layout, globals.css, design tokens
Step 14: Build Sidebar and AppShell layout components
Step 15: Build Landing Page (/)
Step 16: Build DropZone and document upload UI components
Step 17: Build Dashboard page (/dashboard) with document list and status polling
Step 18: Build ChatInput, MessageBubble, ChatWindow components
Step 19: Build Chat page (/chat) wired to API
Step 20: Build SourcesPanel and CitationChip components
Step 21: Build SuggestedQuestions component
Step 22: Build Privacy page (/privacy) with DataFlowDiagram
Step 23: Build Audit page (/audit)
Step 24: Implement MaskedText component and masking library
Step 25: Implement Zustand store and TanStack Query hooks
Step 26: Wire session management (localStorage + X-Session-ID header)
Step 27: Add error states, empty states, loading skeletons everywhere
Step 28: Polish: animations, transitions, hover states, responsive layout
Step 29: Test full demo flow end-to-end
Step 30: Write README.md and docs/ files
```

---

## 19. Demo Flow Script (for Judges)

The app must support this exact demo path without any failures:

```
1. Open http://localhost:3000
2. See landing page with privacy promise
3. Click "Start with Demo Documents"
4. Watch documents appear in sidebar with processing status
5. Status updates to "Ready" for all 3 demo documents
6. Navigate to Chat
7. See suggested questions appear
8. Click: "What medications is the patient taking?"
9. See answer appear with [1] [2] citation markers
10. See SourcesPanel slide open with masked chunk previews
11. Ask: "What are the payment terms in the contract?"
12. See correct answer from contract document
13. Navigate to /privacy
14. Show DataFlowDiagram and privacy checklist
15. Navigate to /audit
16. Show all events logged: document.loaded, query.received, retrieval.executed, answer.generated
```

---

## 20. Quality Checklist

Before submitting, verify every item:

### Functionality
- [ ] File upload works for PDF, DOCX, TXT
- [ ] Wrong file type shows error (not crash)
- [ ] File too large shows error
- [ ] Document processing status updates in real time
- [ ] Questions return grounded answers
- [ ] Citations appear and are clickable
- [ ] Source panel opens with masked previews
- [ ] Demo documents load without uploading
- [ ] Audit log records all events
- [ ] Privacy page loads and is informative

### UI Quality
- [ ] No broken layouts at 1280×800 viewport
- [ ] Loading states shown for all async operations
- [ ] Empty states shown when no documents or messages
- [ ] Error states shown and actionable
- [ ] No console errors in browser
- [ ] Typography is consistent and readable
- [ ] Colors follow design tokens — no hardcoded hex values in components
- [ ] Animations are smooth (60fps)
- [ ] All interactive elements have hover states

### Code Quality
- [ ] No TypeScript errors (`npm run build` passes)
- [ ] No Python type errors (`uv run mypy .` passes)
- [ ] All API routes have try/except with structured error responses
- [ ] No hardcoded API keys in code
- [ ] Environment variables documented in `.env.example`
- [ ] Folder structure matches specification

### Privacy Story
- [ ] Raw document content never appears in UI
- [ ] Sensitive values masked in source previews
- [ ] Privacy page clearly explains data handling
- [ ] Audit log shows complete operation history
- [ ] Privacy badge visible in chat interface

---

## 21. Submission Notes

**Project name:** PrivatePulse AI
**Track:** Midnight Hackathon — AI Track
**Category:** Privacy-Preserving AI Document Intelligence

**Elevator pitch (use this for submission description):**
> PrivatePulse AI lets you interrogate your most sensitive documents — medical records, financial statements, legal contracts — using natural language AI, without ever exposing the raw contents of those files. Inspired by Midnight's confidential computing vision, the system processes your documents locally, sends only the minimum necessary context to the AI model, masks sensitive entities in all UI previews, and maintains a full audit trail of every access. The result is a production-grade, privacy-first document intelligence tool that makes AI genuinely safe to use with your most private data.

**Key technical differentiators:**
1. Session-isolated vector indexes (no cross-contamination)
2. Sensitive entity masking on all chunk previews
3. Minimum-context RAG (only top-K chunks sent to LLM, never full files)
4. Full audit trail with structured event logging
5. Privacy-first architecture narrative aligned with Midnight's vision

---

*End of plan. Build the entire project. Do not abbreviate.*
