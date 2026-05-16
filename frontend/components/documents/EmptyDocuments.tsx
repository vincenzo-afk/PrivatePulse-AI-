"use client";

import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

interface EmptyDocumentsProps {
  onUploadClick: () => void;
}

export function EmptyDocuments({ onUploadClick }: EmptyDocumentsProps) {
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
