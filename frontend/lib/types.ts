export interface Document {
  id: string;
  session_id: string;
  file_name: string;
  file_size: number;
  file_type: "pdf" | "txt" | "docx";
  status: "pending" | "processing" | "ready" | "error";
  chunk_count: number | null;
  page_count: number | null;
  uploaded_at: string;
  processed_at: string | null;
  error_message: string | null;
}

export interface DocumentStatus {
  id: string;
  status: string;
  progress: number;
  error_message?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "error";
  content: string;
  images?: string[];
  citations?: Citation[];
  sources?: SourceChunk[];
  privacy_summary?: PrivacySummary;
  created_at: string;
}

export interface Citation {
  id: string;
  document_id: string;
  document_name: string;
  page_number: number | null;
  section: string | null;
  chunk_index: number;
  relevance_score: number;
  text_preview: string;
}

export interface SourceChunk {
  chunk_id: string;
  document_id: string;
  document_name: string;
  page_number: number | null;
  section: string | null;
  text: string;
  relevance_score: number;
  chunk_index: number;
}

export interface PrivacySummary {
  chunks_retrieved: number;
  documents_accessed: string[];
  raw_files_sent: boolean;
}

export interface QueryRequest {
  session_id: string;
  question: string;
  document_ids?: string[];
  conversation_history?: { role: string; content: string }[];
}

export interface QueryResponse {
  answer: string;
  citations: Citation[];
  sources: SourceChunk[];
  model_used: string;
  tokens_used: { input: number; output: number };
  processing_time_ms: number;
  privacy_summary: PrivacySummary;
}

export interface AuditEvent {
  id: string;
  session_id: string;
  event_type: string;
  description: string;
  document_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditEventsResponse {
  events: AuditEvent[];
  total: number;
  page: number;
}

export interface Session {
  id: string;
  created_at: string;
  last_active_at: string;
  document_count: number;
  query_count: number;
}

export interface Settings {
  apiKey: string;
  model: "llama-3.2-90b-vision-preview" | "llama-3.2-11b-vision-preview";
  fontSize: "sm" | "md" | "lg";
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: "",
  model: "llama-3.2-90b-vision-preview",
  fontSize: "md",
};

export const AVAILABLE_MODELS = [
  { value: "llama-3.2-90b-vision-preview", label: "Llama 3.2 90B Vision" },
  { value: "llama-3.2-11b-vision-preview", label: "Llama 3.2 11B Vision" },
] as const;

export const FONT_SIZE_OPTIONS = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
] as const;