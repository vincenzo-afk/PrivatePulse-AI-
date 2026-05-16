"use client";

import { FileText, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileTypeIconProps {
  fileType: string;
  className?: string;
}

export function FileTypeIcon({ fileType, className }: FileTypeIconProps) {
  const typeConfig: Record<string, { icon: any; color: string }> = {
    pdf: { icon: FileText, color: "text-danger" },
    docx: { icon: FileText, color: "text-accent-secondary" },
    txt: { icon: FileCode, color: "text-text-secondary" },
  };

  const config = typeConfig[fileType.toLowerCase()] || {
    icon: FileText,
    color: "text-text-muted",
  };

  const Icon = config.icon;

  return <Icon className={cn("h-4 w-4", config.color, className)} />;
}
