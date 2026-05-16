# PrivatePulse AI - Privacy Model

## Privacy Guarantees

### 1. Local Processing
All document processing (extraction, chunking, indexing) happens on your local machine. Raw files are never transmitted to any external service except for the minimal AI context retrieval.

### 2. Minimum-Context RAG
When you ask a question:
- Only the most relevant text excerpts (top-5 chunks) are sent to the AI model
- Never full documents
- Never raw file contents
- Never metadata beyond what's needed

### 3. Session Isolation
- Each browser session gets a unique ID stored in localStorage
- All data (documents, vectors, audit logs) is namespaced to this session
- ChromaDB collections are named `session_{session_id}`
- Two sessions cannot access each other's data

### 4. Entity Masking
Sensitive information is automatically detected and masked in the UI:
- Social Security Numbers
- Credit Card Numbers
- Phone Numbers
- Email Addresses
- Bank Account Numbers
- Dates of Birth

Masking is applied to:
- Source previews in the Sources Panel
- Citation text previews
- Any UI that displays document excerpts

**Note**: The LLM receives unmasked text for accuracy. Masking is a UI-only protection.

### 5. Audit Trail
Every operation is logged with:
- Timestamp (ISO 8601)
- Action type
- Human-readable description
- Document affected (if applicable)
- Technical metadata

Event types tracked:
- Upload, extraction, chunking, embedding, deletion
- Query receipt, retrieval execution, answer generation
- Demo document loading

### 6. Data Retention
- Documents persist for the duration of your browser session
- Session data is stored in localStorage
- "Clear Session" removes all local data
- Server-side data is isolated to anonymous session IDs

## What Goes to the AI

When you ask a question, the following is sent to **Groq** (via `llama-3.2-90b-vision-preview`):

```
1. System prompt (fixed, no user data)
2. Top-5 retrieved chunks (~4,000 characters total)
3. Conversation history (last 6 messages)
4. Your question
5. [Optional] Uploaded images for vision queries
```

The following is NEVER sent:
- ❌ Raw document files
- ❌ Full document text
- ❌ Document metadata beyond file name
- ❌ Session information
- ❌ Any data from other sessions

### Vision Data Note
When you attach images to a query, those images are sent to Groq's API for vision processing. Images are:
- Only sent when explicitly attached by you
- Limited to 5 per request (Groq API limit)
- Not used for model training
- Used only to answer your immediate query

## Model Providers

- **LLM Generation**: Groq (Llama 3.2 90B Vision) via `api.groq.com`
- **Embeddings**: OpenAI (text-embedding-3-small) via `api.openai.com`

## Midnight Confidential Computing Alignment

In a production deployment with Midnight, this architecture would be enhanced with:
- Document processing inside confidential smart contracts
- Encrypted vector storage
- Zero-knowledge proof verification of processing
- Even the application operator would be unable to view your data
