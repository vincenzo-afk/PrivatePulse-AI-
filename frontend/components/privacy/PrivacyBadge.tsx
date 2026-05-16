"use client";

import { Shield, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrivacyBadgeProps {
  variant?: "default" | "compact";
  className?: string;
}

export function PrivacyBadge({
  variant = "default",
  className,
}: PrivacyBadgeProps) {
  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs text-accent",
          className
        )}
      >
        <Shield className="h-3 w-3" />
        Private
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-accent",
        className
      )}
    >
      <ShieldCheck className="h-3 w-3" />
      Privacy Protected
    </span>
  );
}
