# PrivatePulse AI - API Reference

All endpoints are prefixed with `/api/v1/`. All responses are JSON.

## Error Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "detail": {}
  }
}
```

## Endpoints

### Health Check

```
GET /api/v1/health
```

Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime_seconds": 3600
}
```

### Documents

#### Upload Documents
```
POST /api/v1/documents/upload
```
- Body: `multipart/form-data` with field `files` (array of files)
- Query: `session_id` (string)
- Errors: 400 (invalid type/size), 500 (extraction failed)

#### List Documents
```
GET /api/v1/documents
```
- Query: `session_id` (string)

#### Get Document
```
GET /api/v1/documents/{document_id}
```

#### Get Document Status
```
GET /api/v1/documents/{document_id}/status
```

#### Delete Document
```
DELETE /api/v1/documents/{document_id}
```
- Query: `session_id` (string)

### Chat

#### Query
```
POST /api/v1/chat/query
```
Body:
```json
{
  "session_id": "uuid",
  "question": "string (max 1000 chars)",
  "document_ids": ["uuid1", "uuid2"],
  "conversation_history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

#### Get Session
```
GET /api/v1/chat/sessions/{session_id}
```

#### Suggested Questions
```
GET /api/v1/chat/suggested-questions
```
- Query: `session_id` (string)

### Demo

#### Load Demo Documents
```
POST /api/v1/demo/load
```
Body:
```json
{
  "session_id": "uuid",
  "demo_set": "all | medical | financial | legal"
}
```

### Audit

#### Get Audit Events
```
GET /api/v1/audit/events
```
- Query: `session_id`, `event_type`, `limit`, `offset`, `from`, `to`
