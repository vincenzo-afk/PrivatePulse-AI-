"use client";

import { useState } from "react";
import { User, Bot, Copy, Check, AlertTriangle, Lock, RefreshCw, Image } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { CitationChip } from "./CitationChip";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: () => void;
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.warn("Clipboard write failed");
    }
  };

  if (message.role === "system") {
    return (
      <div className="flex justify-center py-3">
        <span className="text-xs text-text-muted bg-surface px-4 py-2 rounded-full border border-border">
          {message.content}
        </span>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="flex justify-center py-3">
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-danger/30 bg-danger/5 max-w-lg">
          <AlertTriangle className="h-4 w-4 text-danger flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-danger">{message.content}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 text-xs text-accent mt-2 hover:underline"
              >
                <RefreshCw className="h-3 w-3" />
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3 px-4 py-3", isUser ? "justify-end" : "justify-start")}>
      {/* Avatar */}
      {!isUser && (
        <div className="rounded-full bg-accent/15 p-2 flex-shrink-0 h-fit">
          <Bot className="h-4 w-4 text-accent" />
        </div>
      )}

      {/* Message content */}
      <div className={cn("max-w-[80%] space-y-2", isUser && "order-first")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-accent/15 text-text-primary rounded-br-md"
              : "card-base rounded-bl-md"
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {message.citations.map((citation) => (
              <CitationChip key={citation.id} citation={citation} />
            ))}
          </div>
        )}

        {/* Footer actions */}
        <div className={cn("flex items-center gap-3 px-1", isUser && "justify-end")}>
          {!isUser && message.privacy_summary && (
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <Lock className="h-3 w-3 text-accent" />
              <span>Grounded in your documents</span>
            </div>
          )}
          <button
            onClick={handleCopy}
            className="text-text-muted hover:text-text-secondary transition-colors"
            title="Copy response"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="rounded-full bg-accent p-2 flex-shrink-0 h-fit">
          <User className="h-4 w-4 text-black" />
        </div>
      )}
    </div>
  );
}
