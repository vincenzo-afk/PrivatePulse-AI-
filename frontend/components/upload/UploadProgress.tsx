"use client";

import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadProgressProps {
  fileName: string;
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
  errorMessage?: string;
}

export function UploadProgress({
  fileName,
  progress,
  status,
  errorMessage,
}: UploadProgressProps) {
  const statusConfig = {
    uploading: { icon: Loader2, color: "text-accent", animate: true },
    processing: { icon: Loader2, color: "text-warning", animate: true },
    complete: { icon: CheckCircle2, color: "text-accent", animate: false },
    error: { icon: AlertCircle, color: "text-danger", animate: false },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-elevated border border-border">
      <Icon
        className={cn("h-4 w-4 flex-shrink-0", config.color, config.animate && "animate-spin")}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{fileName}</p>
        {status === "error" && errorMessage && (
          <p className="text-xs text-danger mt-0.5">{errorMessage}</p>
        )}
        <div className="mt-1.5 h-1.5 bg-base rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              status === "error" ? "bg-danger" : "bg-accent"
            )}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-text-muted">{Math.round(progress * 100)}%</span>
    </div>
  );
}
