"use client";

import { useParams, useRouter } from "next/navigation";
import { Shield, ChevronDown, FileText, ArrowLeft, Upload } from "lucide-react";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChat } from "@/lib/hooks/useChat";
import { useDocuments } from "@/lib/hooks/useDocuments";
import { useSession } from "@/lib/hooks/useSession";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { DropZone } from "@/components/upload/DropZone";
import { toast } from "sonner";

export default function SessionChatPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  useSession();
  const { documents, upload, isUploading } = useDocuments();
  const {
    messages,
    sendMessage,
    suggestedQuestions,
    isGenerating,
    clearMessages,
  } = useChat();

  const activeDocumentIds = useAppStore((s) => s.activeDocumentIds);
  const setActiveDocumentIds = useAppStore((s) => s.setActiveDocumentIds);

  const [showDocSelector, setShowDocSelector] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

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

  const handleUpload = async (files: File[]) => {
    try {
      await upload(files);
      toast.success(`Uploading ${files.length} file${files.length > 1 ? "s" : ""}...`);
      setShowUpload(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Upload failed");
    }
  };

  const handleRetry = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage) {
      sendMessage(lastUserMessage.content);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-surface/80 backdrop-blur-sm">
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

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                showUpload
                  ? "bg-accent/10 text-accent border border-accent/30"
                  : "text-text-secondary hover:text-text-primary hover:bg-elevated border border-transparent"
              )}
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Upload</span>
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20">
              <Shield className="h-3 w-3 text-accent" />
              <span className="text-[11px] text-accent font-medium hidden sm:inline">Private</span>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors hidden sm:block"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {showUpload && (
          <div className="border-b border-border p-4 bg-surface/50">
            <div className="max-w-lg mx-auto">
              <DropZone onFilesSelected={handleUpload} disabled={isUploading} />
            </div>
          </div>
        )}

        <ChatWindow
          messages={messages}
          isGenerating={isGenerating}
          suggestedQuestions={suggestedQuestions}
          onSendQuestion={sendMessage}
          onRetry={handleRetry}
        />
        <ChatInput onSend={sendMessage} disabled={isGenerating} />
      </div>
    </AppShell>
  );
}