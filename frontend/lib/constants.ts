export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
export const MAX_FILE_SIZE_MB = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || "20");
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "PrivatePulse AI";

export const ALLOWED_FILE_TYPES = {
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

export const ALLOWED_EXTENSIONS = ["pdf", "txt", "docx"];

export const SESSION_STORAGE_KEY = "privatepulse_session_id";
export const SETTINGS_STORAGE_KEY = "privatepulse_settings";

export const NAV_ITEMS = [
  { label: "Chat", href: "/chat", icon: "MessageSquare" },
  { label: "Audit Log", href: "/audit", icon: "ClipboardList" },
  { label: "Settings", href: "/settings", icon: "Settings" },
] as const;

export const EVENT_TYPE_COLORS: Record<string, string> = {
  "document.uploaded": "accent",
  "document.extracted": "accent",
  "document.chunked": "accent-secondary",
  "document.embedded": "accent-secondary",
  "document.deleted": "danger",
  "query.received": "warning",
  "retrieval.executed": "accent-secondary",
  "answer.generated": "accent",
};

export const EVENT_BADGE_STYLES: Record<string, string> = {
  accent: "border-accent/20 bg-accent/10 text-accent",
  "accent-secondary": "border-accent-secondary/20 bg-accent-secondary/10 text-accent-secondary",
  danger: "border-danger/20 bg-danger/10 text-danger",
  warning: "border-warning/20 bg-warning/10 text-warning",
  "text-muted": "border-text-muted/20 bg-text-muted/10 text-text-muted",
};

export const DEFAULT_SUGGESTED_QUESTIONS = [
  "Summarize my documents",
  "What are the key findings?",
  "Find all dates mentioned",
  "Compare the documents",
];