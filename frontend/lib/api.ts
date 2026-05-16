import axios from "axios";
import { API_URL } from "./constants";
import type {
  Document,
  DocumentStatus,
  QueryResponse,
  AuditEventsResponse,
  Session,
} from "./types";
import { toast } from "sonner";
import { useAppStore } from "./store";

const client = axios.create({
  baseURL: API_URL,
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const sessionId = useAppStore.getState().sessionId;
  if (sessionId) {
    config.headers["X-Session-ID"] = sessionId;
  }
  const settings = useAppStore.getState().settings;
  if (settings.apiKey) {
    config.headers["X-Groq-Api-Key"] = settings.apiKey;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 413) {
      toast.error("File too large. Please reduce file sizes.");
    } else if (error.response?.status === 429) {
      toast.error("Rate limit exceeded. Please wait a moment.");
    } else if (error.response?.status === 500) {
      toast.error("Server error. Please try again.");
    } else {
      const message = error.response?.data?.error?.message || "An unexpected error occurred";
      if (error.response?.status !== 404) {
        toast.error(message);
      }
    }
    return Promise.reject(error);
  }
);

export const documentsApi = {
  upload: async (files: File[], sessionId: string): Promise<{ documents: Document[] }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const { data } = await client.post("/documents/upload", formData, {
      params: { session_id: sessionId },
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 300000,
    });
    return data;
  },

  list: async (sessionId: string): Promise<{ documents: Document[] }> => {
    const { data } = await client.get("/documents", {
      params: { session_id: sessionId },
    });
    return data;
  },

  getStatus: async (id: string): Promise<DocumentStatus> => {
    const { data } = await client.get(`/documents/${id}/status`);
    return data;
  },

  delete: async (id: string, sessionId: string): Promise<void> => {
    await client.delete(`/documents/${id}`, {
      params: { session_id: sessionId },
    });
  },
};

export const chatApi = {
  query: async (formData: FormData): Promise<QueryResponse> => {
    const { data } = await client.post("/chat/query", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  suggestedQuestions: async (sessionId: string): Promise<{ questions: string[] }> => {
    const { data } = await client.get("/chat/suggested-questions", {
      params: { session_id: sessionId },
    });
    return data;
  },

  getSession: async (sessionId: string): Promise<{ session: Session; message_count: number }> => {
    const { data } = await client.get(`/chat/sessions/${sessionId}`);
    return data;
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await client.delete(`/chat/sessions/${sessionId}`);
  },
};

export const auditApi = {
  getEvents: async (
    sessionId: string,
    params?: {
      event_type?: string;
      limit?: number;
      offset?: number;
      from?: string;
      to?: string;
    }
  ): Promise<AuditEventsResponse> => {
    const { data } = await client.get("/audit/events", {
      params: { session_id: sessionId, ...params },
    });
    return data;
  },
};

export const healthApi = {
  check: async (): Promise<{ status: string; version: string; uptime_seconds: number; llm_provider: string; llm_model: string; vision_enabled: boolean }> => {
    const { data } = await client.get("/health");
    return data;
  },
};