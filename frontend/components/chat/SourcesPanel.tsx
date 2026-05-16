"use client";

import { X, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { SourceChunk } from "@/lib/types";
import { MaskedText } from "@/components/shared/MaskedText";
import { cn } from "@/lib/utils";

interface SourcesPanelProps {
  sources: SourceChunk[];
  onClose: () => void;
}

function SourceItem({ source }: { source: SourceChunk }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-elevated/50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />
        )}
        <FileText className="h-4 w-4 text-accent flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-primary truncate">
            {source.document_name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {source.page_number && (
              <span className="text-[10px] text-text-muted">Page {source.page_number}</span>
            )}
            <div className="flex-1 h-1 bg-elevated rounded-full overflow-hidden max-w-[80px]">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${Math.round(source.relevance_score * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-text-muted">
              {Math.round(source.relevance_score * 100)}%
            </span>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-3 pt-0">
          <div className="bg-elevated rounded-lg p-3">
            <MaskedText
              text={source.text}
              className="text-xs text-text-secondary leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function SourcesPanel({ sources, onClose }: SourcesPanelProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Sources</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {sources.length} chunk{sources.length !== 1 ? "s" : ""} retrieved
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-secondary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {sources.map((source) => (
          <SourceItem key={source.chunk_id} source={source} />
        ))}
      </div>
    </div>
  );
}
