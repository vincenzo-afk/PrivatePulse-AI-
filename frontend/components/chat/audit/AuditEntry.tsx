"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AuditEvent } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { EVENT_TYPE_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AuditEntryProps {
  event: AuditEvent;
}

export function AuditEntry({ event }: AuditEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const color = EVENT_TYPE_COLORS[event.event_type] || "text-muted";

  return (
    <div className="card-base overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-elevated/50 transition-colors"
      >
        <div className="mt-0.5">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full border",
              `border-${color}/20 bg-${color}/10 text-${color}`
            )}>
              {event.event_type}
            </span>
            <span className="text-xs text-text-muted">{formatDate(event.created_at)}</span>
          </div>
          <p className="text-sm text-text-primary mt-1">{event.description}</p>
        </div>
      </button>
      {expanded && event.metadata && (
        <div className="px-12 pb-3.5">
          <div className="bg-elevated rounded-lg p-3 overflow-x-auto">
            <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap">
              {JSON.stringify(event.metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
