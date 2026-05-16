"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-12 text-center",
        className
      )}
    >
      <div className="rounded-full bg-elevated p-4">
        <Icon className="h-8 w-8 text-text-muted" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        <p className="mt-1 text-sm text-text-secondary max-w-sm">{description}</p>
      </div>
      {action && (
        <button onClick={action.onClick} className="btn-primary rounded-lg px-5 py-2.5 text-sm">
          {action.label}
        </button>
      )}
    </div>
  );
}
