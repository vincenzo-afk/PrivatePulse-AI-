"use client";

import { useParams, useRouter } from "next/navigation";
import { Shield, ChevronDown, FileText, ArrowLeft } from "lucide-react";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { SourcesPanel } from "@/components/chat/SourcesPanel";
import { useChat } from "@/lib/hooks/useChat";
import { useDocuments } from "@/lib/hooks/useDocuments";
import { useSession } from "@/lib/hooks/useSession";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function SessionChatPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  useSession();
  const { documents } = useDocuments();
  const {
    messages,
    sendMessage,
    suggestedQuestions,
    isGenerating,
    clearMessages,
  } = useChat();

  const sourcePanelOpen = useAppStore((s) => s.sourcePanelOpen);
  const currentSources = useAppStore((s) => s.currentSources);
  const closeSourcePanel = useAppStore((s) => s.closeSourcePanel);
  const activeDocumentIds = useAppStore((s) => s.activeDocumentIds);
  const setActiveDocumentIds = useAppStore((s) => s.setActiveDocumentIds);

  const [showDocSelector, setShowDocSelector] = useState(false);

  const readyDocs = documents.filter((d) => d.status === "ready");

  const selectedDocLabel = useMemo(() => {
    if (activeDocumentIds.length === 0 || activeDocumentIds.length === readyDocs.length) {
      return "All documents";
    }
    if (activeDocumentIds.length === 1) {
      const doc = readyDocs.find((d) => d.id === activeDocumentIds[0]);
      return doc?.file_name || "1 document";
    }
    return `${activeDocumentIds.length} documents`;
  }, [activeDocumentIds, readyDocs]);

  const handleRetry = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage) {
      sendMessage(lastUserMessage.content);
    }
  };

  return (
    <AppShell
      rightPanel={
        sourcePanelOpen && currentSources.length > 0 ? (
          <SourcesPanel sources={currentSources} onClose={closeSourcePanel} />
        ) : undefined
      }
    >
      <div className="flex flex-col h-full">
        {/* Chat header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/chat")}
              className="text-text-muted hover:text-text-secondary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-sm font-semibold text-text-primary">Chat Session</h1>
            {readyDocs.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowDocSelector(!showDocSelector)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-elevated border border-border text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  <FileText className="h-3 w-3" />
                  {selectedDocLabel}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {showDocSelector && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDocSelector(false)}
                    />
                    <div className="absolute top-full left-0 mt-1 z-20 card-base p-2 min-w-[200px] shadow-lg">
                      <button
                        onClick={() => {
                          setActiveDocumentIds([]);
                          setShowDocSelector(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors",
                          activeDocumentIds.length === 0
                            ? "bg-accent/10 text-accent"
                            : "text-text-secondary hover:text-text-primary hover:bg-elevated"
                        )}
                      >
                        All documents
                      </button>
                      {readyDocs.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => {
                            const isActive = activeDocumentIds.includes(doc.id);
                            if (isActive) {
                              setActiveDocumentIds(activeDocumentIds.filter((id) => id !== doc.id));
                            } else {
                              setActiveDocumentIds([...activeDocumentIds, doc.id]);
                            }
                            setShowDocSelector(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors",
                            activeDocumentIds.includes(doc.id)
                              ? "bg-accent/10 text-accent"
                              : "text-text-secondary hover:text-text-primary hover:bg-elevated"
                          )}
                        >
                          {doc.file_name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20">
              <Shield className="h-3 w-3 text-accent" />
              <span className="text-[11px] text-accent font-medium">Private</span>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                Clear chat
              </button>
            )}
          </div>
        </div>

        {/* Chat content */}
        {readyDocs.length > 0 ? (
          <>
            <ChatWindow
              messages={messages}
              isGenerating={isGenerating}
              suggestedQuestions={suggestedQuestions}
              onSendQuestion={sendMessage}
              onRetry={handleRetry}
            />
            <ChatInput onSend={sendMessage} disabled={isGenerating} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <FileText className="h-12 w-12 text-text-muted" />
            <div className="text-center">
              <h3 className="text-base font-semibold text-text-primary">No documents ready</h3>
              <p className="text-sm text-text-secondary mt-1">
                Upload documents first to start asking questions.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="btn-primary rounded-lg px-5 py-2.5 text-sm"
            >
              Upload Documents
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
