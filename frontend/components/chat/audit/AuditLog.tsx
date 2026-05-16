"use client";

import { Clock, Loader2 } from "lucide-react";
import type { AuditEvent } from "@/lib/types";
import { AuditEntry } from "./AuditEntry";
import { ErrorState } from "@/components/shared/ErrorState";

interface AuditLogProps {
  events: AuditEvent[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

export function AuditLog({ events, total, isLoading, error, onRetry }: AuditLogProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load audit events" onRetry={onRetry} />;
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Clock className="h-12 w-12 text-text-muted mb-4" />
        <h3 className="text-base font-semibold text-text-primary">No audit events yet</h3>
        <p className="text-sm text-text-secondary mt-1">
          Events will appear here as you upload documents and ask questions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <AuditEntry key={event.id} event={event} />
      ))}
    </div>
  );
}
