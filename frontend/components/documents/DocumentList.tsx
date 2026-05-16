"use client";

import { useEffect, useRef } from "react";
import { FileText, Inbox } from "lucide-react";
import type { Document } from "@/lib/types";
import { DocumentCard } from "./DocumentCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useDocumentStatus } from "@/lib/hooks/useDocuments";

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onUploadClick: () => void;
}

export function DocumentList({ documents, isLoading, onDelete, onUploadClick }: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No documents yet"
        description="Upload PDF, DOCX, or TXT files to start asking questions about your documents."
        action={{
          label: "Upload Documents",
          onClick: onUploadClick,
        }}
      />
    );
  }

  return (
    <div className="grid gap-4">
      {documents.map((doc) => (
        <DocumentCardWithPolling
          key={doc.id}
          document={doc}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function DocumentCardWithPolling({
  document,
  onDelete,
}: {
  document: Document;
  onDelete: (id: string) => void;
}) {
  const shouldPoll = document.status === "pending" || document.status === "processing";
  const { data: statusData } = useDocumentStatus(document.id, shouldPoll);

  return <DocumentCard document={document} onDelete={onDelete} />;
}
