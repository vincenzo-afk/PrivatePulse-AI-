"use client";

import { X, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const variantStyles = {
    default: "bg-accent text-black hover:opacity-90",
    danger: "bg-danger text-white hover:bg-danger/90",
    warning: "bg-warning text-black hover:opacity-90",
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !loading && onOpenChange(false)} />
      <div className="relative card-base p-6 max-w-md w-full mx-4 animate-slide-up">
        <button
          onClick={() => !loading && onOpenChange(false)}
          className="absolute top-4 right-4 text-text-muted hover:text-text-secondary"
          disabled={loading}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          {variant === "danger" && (
            <div className="rounded-full bg-danger/10 p-2 flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            <p className="mt-2 text-sm text-text-secondary">{description}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => !loading && onOpenChange(false)}
            className="btn-ghost rounded-lg px-4 py-2 text-sm"
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2",
              variantStyles[variant],
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}