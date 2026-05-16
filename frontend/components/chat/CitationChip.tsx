"use client";

import { FileText } from "lucide-react";
import type { Citation } from "@/lib/types";

interface CitationChipProps {
  citation: Citation;
}

export function CitationChip({ citation }: CitationChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs text-accent hover:bg-accent/15 transition-colors cursor-default">
      <FileText className="h-3 w-3" />
      <span className="font-medium">{citation.document_name}</span>
      {citation.page_number && (
        <span className="text-text-muted">p.{citation.page_number}</span>
      )}
      <span className="text-text-muted">
        {Math.round(citation.relevance_score * 100)}%
      </span>
    </span>
  );
}
