import { create } from "zustand";
import type { Document, ChatMessage, SourceChunk, Settings } from "./types";
import { SESSION_STORAGE_KEY, SETTINGS_STORAGE_KEY } from "./constants";
import { DEFAULT_SETTINGS } from "./types";

interface AppStore {
  sessionId: string | null;
  setSessionId: (id: string) => void;
  initSession: () => void;
  clearSession: () => void;

  documents: Document[];
  setDocuments: (docs: Document[]) => void;
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, update: Partial<Document>) => void;
  removeDocument: (id: string) => void;

  activeDocumentIds: string[];
  setActiveDocumentIds: (ids: string[]) => void;
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;

  sourcePanelOpen: boolean;
  currentSources: SourceChunk[];
  openSourcePanel: (sources: SourceChunk[]) => void;
  closeSourcePanel: () => void;

  settings: Settings;
  setSettings: (settings: Settings) => void;
  loadSettings: () => void;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;

  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
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
  clearSession: () => {
    try { localStorage.removeItem(SESSION_STORAGE_KEY); } catch {}
    set({ sessionId: null, messages: [], documents: [] });
  },

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

  activeDocumentIds: [],
  setActiveDocumentIds: (ids) => set({ activeDocumentIds: ids }),
  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  clearMessages: () => set({ messages: [] }),
  isGenerating: false,
  setIsGenerating: (v) => set({ isGenerating: v }),

  sourcePanelOpen: false,
  currentSources: [],
  openSourcePanel: (sources) => set({ sourcePanelOpen: true, currentSources: sources }),
  closeSourcePanel: () => set({ sourcePanelOpen: false, currentSources: [] }),

  settings: DEFAULT_SETTINGS,
  setSettings: (settings: Settings) => {
    try { localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings)); } catch {}
    set({ settings });
  },
  loadSettings: () => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Settings;
        set({ settings: { ...DEFAULT_SETTINGS, ...parsed } });
      }
    } catch {}
  },
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const newSettings = { ...get().settings, [key]: value };
    try { localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings)); } catch {}
    set({ settings: newSettings });
  },

  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));