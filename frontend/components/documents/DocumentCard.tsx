"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, MessageSquare, AlertCircle } from "lucide-react";
import type { Document } from "@/lib/types";
import { formatDate, formatFileSize } from "@/lib/utils";
import { DocumentStatus } from "./DocumentStatus";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface DocumentCardProps {
  document: Document;
  onDelete: (id: string) => void;
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <div className="card-base p-4 hover:border-accent/20 transition-all duration-200 group">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="rounded-lg bg-accent/10 p-2 flex-shrink-0 mt-0.5">
              <FileText className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-text-primary truncate">
                {document.file_name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-text-muted uppercase">{document.file_type}</span>
                <span className="text-xs text-text-muted">·</span>
                <span className="text-xs text-text-muted">{formatFileSize(document.file_size)}</span>
                {document.chunk_count && (
                  <>
                    <span className="text-xs text-text-muted">·</span>
                    <span className="text-xs text-text-muted">{document.chunk_count} chunks</span>
                  </>
                )}
              </div>
              <div className="mt-2">
                <DocumentStatus status={document.status} errorMessage={document.error_message} />
              </div>
              <p className="text-xs text-text-muted mt-1">{formatDate(document.uploaded_at)}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {document.status === "ready" && (
              <button
                onClick={() => router.push(`/chat`)}
                className="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-all"
                title="Ask questions"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {document.error_message && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-danger/10 border border-danger/20">
            <AlertCircle className="h-3.5 w-3.5 text-danger flex-shrink-0 mt-0.5" />
            <p className="text-xs text-danger">{document.error_message}</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Document"
        message={`Are you sure you want to delete "${document.file_name}"? This will permanently remove the document and all its indexed chunks.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          onDelete(document.id);
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
