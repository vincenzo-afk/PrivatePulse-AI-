"use client";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="rounded-full bg-elevated p-2">
        <div className="h-3 w-3 rounded-full bg-accent/50" />
      </div>
      <div className="card-base px-4 py-3 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="h-2 w-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="h-2 w-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
