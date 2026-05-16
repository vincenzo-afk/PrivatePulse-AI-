"use client";

import { cn } from "@/lib/utils";

interface AuditFiltersProps {
  eventTypes: string[];
  selectedType: string;
  onTypeChange: (type: string) => void;
}

export function AuditFilters({
  eventTypes,
  selectedType,
  onTypeChange,
}: AuditFiltersProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {eventTypes.map((type) => (
        <button
          key={type}
          onClick={() => onTypeChange(type)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
            selectedType === type
              ? "bg-accent/10 border-accent/30 text-accent"
              : "border-border text-text-muted hover:text-text-secondary hover:border-accent/20"
          )}
        >
          {type === "all" ? "All Events" : type.replace(".", " ")}
        </button>
      ))}
    </div>
  );
}
