import { create } from "zustand";
import type { Document, ChatMessage, SourceChunk } from "./types";
import { SESSION_STORAGE_KEY } from "./constants";

interface AppStore {
  // Session
  sessionId: string | null;
  setSessionId: (id: string) => void;
  initSession: () => void;

  // Documents
  documents: Document[];
  setDocuments: (docs: Document[]) => void;
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, update: Partial<Document>) => void;
  removeDocument: (id: string) => void;

  // Chat
  activeDocumentIds: string[];
  setActiveDocumentIds: (ids: string[]) => void;
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;

  // Sources panel
  sourcePanelOpen: boolean;
  currentSources: SourceChunk[];
  openSourcePanel: (sources: SourceChunk[]) => void;
  closeSourcePanel: () => void;

  // UI
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Session
  sessionId: null,
  setSessionId: (id: string) => {
    try { localStorage.setItem(SESSION_STORAGE_KEY, id); } catch {}
    set({ sessionId: id });
  },
  initSession: () => {
    let id: string | null = null;
    try { id = localStorage.getItem(SESSION_STORAGE_KEY); } catch {}
    if (!id) {
      id = crypto.randomUUID();
      try { localStorage.setItem(SESSION_STORAGE_KEY, id); } catch {}
    }
    set({ sessionId: id });
  },

  // Documents
  documents: [],
  setDocuments: (docs) => set({ documents: docs }),
  addDocument: (doc) => set((state) => ({ documents: [...state.documents, doc] })),
  updateDocument: (id, update) =>
    set((state) => ({
      documents: state.documents.map((d) => (d.id === id ? { ...d, ...update } : d)),
    })),
  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
    })),

  // Chat
  activeDocumentIds: [],
  setActiveDocumentIds: (ids) => set({ activeDocumentIds: ids }),
  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  clearMessages: () => set({ messages: [] }),
  isGenerating: false,
  setIsGenerating: (v) => set({ isGenerating: v }),

  // Sources panel
  sourcePanelOpen: false,
  currentSources: [],
  openSourcePanel: (sources) => set({ sourcePanelOpen: true, currentSources: sources }),
  closeSourcePanel: () => set({ sourcePanelOpen: false, currentSources: [] }),

  // UI
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
