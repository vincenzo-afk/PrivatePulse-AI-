"use client";

import { useState } from "react";
import { ScrollText, Download, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { useAuditLog } from "@/lib/hooks/useAuditLog";
import { useSession } from "@/lib/hooks/useSession";
import { formatDate } from "@/lib/utils";
import { EVENT_TYPE_COLORS, EVENT_BADGE_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AuditEvent } from "@/lib/types";

const EVENT_TYPES = [
  "all",
  "document.uploaded",
  "document.extracted",
  "document.chunked",
  "document.embedded",
  "document.deleted",
  "query.received",
  "retrieval.executed",
  "answer.generated",
  "demo.loaded",
];

function AuditEntry({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = useState(false);
  const colorKey = EVENT_TYPE_COLORS[event.event_type] || "text-muted";
  const badgeStyle = EVENT_BADGE_STYLES[colorKey] || EVENT_BADGE_STYLES["text-muted"];

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
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", badgeStyle)}>
              {event.event_type}
            </span>
            <span className="text-xs text-text-muted">{formatDate(event.created_at)}</span>
          </div>
          <p className="text-sm text-text-primary mt-1">{event.description}</p>
        </div>
        {event.document_id && (
          <span className="text-[10px] text-text-muted font-mono">
            {event.document_id.slice(0, 8)}...
          </span>
        )}
      </button>
      {expanded && event.metadata && (
        <div className="px-12 pb-3.5">
          <div className="bg-elevated rounded-lg p-3">
            <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap">
              {JSON.stringify(event.metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  useSession();
  const [filterType, setFilterType] = useState("all");
  const [page, setPage] = useState(0);

  const { events, total, isLoading, error, refetch } = useAuditLog({
    event_type: filterType !== "all" ? filterType : undefined,
    limit: 50,
    offset: page * 50,
  });

  const totalPages = Math.ceil(total / 50);

  const handleExport = () => {
    const csv = [
      ["Timestamp", "Event Type", "Description", "Document ID", "Metadata"].join(","),
      ...events.map((e) =>
        [
          e.created_at,
          e.event_type,
          `"${e.description.replace(/"/g, '""')}"`,
          e.document_id || "",
          e.metadata ? `"${JSON.stringify(e.metadata).replace(/"/g, '""')}"` : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ScrollText className="h-5 w-5 text-accent" />
              <h1 className="text-2xl font-bold text-text-primary">Audit Trail</h1>
            </div>
            <p className="text-sm text-text-secondary">
              Complete log of every operation performed on your documents
            </p>
          </div>
          <button
            onClick={handleExport}
            className="btn-ghost rounded-lg px-4 py-2 text-sm flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {EVENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => { setFilterType(type); setPage(0); }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
                filterType === type
                  ? "bg-accent/10 border-accent/30 text-accent"
                  : "border-border text-text-muted hover:text-text-secondary hover:border-accent/20"
              )}
            >
              {type.replace(".", " ")}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <ErrorState
            message="Failed to load audit events"
            onRetry={refetch}
          />
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Clock className="h-12 w-12 text-text-muted mb-4" />
            <h3 className="text-base font-semibold text-text-primary">No audit events yet</h3>
            <p className="text-sm text-text-secondary mt-1">
              Events will appear here as you upload documents and ask questions.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {events.map((event) => (
                <AuditEntry key={event.id} event={event} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="btn-ghost rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-xs text-text-muted">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="btn-ghost rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}

            <p className="text-center text-xs text-text-muted mt-4">
              {total} event{total !== 1 ? "s" : ""} total
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}
