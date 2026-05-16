"use client";

import { cn } from "@/lib/utils";

interface DocumentStatusProps {
  status: string;
  errorMessage?: string | null;
}

export function DocumentStatus({ status, errorMessage }: DocumentStatusProps) {
  const config: Record<string, { label: string; className: string; dot: string }> = {
    pending: {
      label: "Pending",
      className: "badge-pending",
      dot: "bg-text-muted",
    },
    processing: {
      label: "Processing",
      className: "badge-processing",
      dot: "bg-warning",
    },
    ready: {
      label: "Ready",
      className: "badge-ready",
      dot: "bg-accent",
    },
    error: {
      label: "Error",
      className: "badge-error",
      dot: "bg-danger",
    },
  };

  const current = config[status] || config.pending;

  return (
    <span className={cn("inline-flex items-center gap-1.5", current.className)} title={errorMessage || undefined}>
      <span className={cn("h-1.5 w-1.5 rounded-full", current.dot)} />
      {current.label}
    </span>
  );
}
