"use client";

import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  suggestedQuestions: string[];
  onSendQuestion: (question: string) => void;
  onRetry?: () => void;
}

export function ChatWindow({
  messages,
  isGenerating,
  suggestedQuestions,
  onSendQuestion,
  onRetry,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 overflow-y-auto">
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-full px-4 py-20">
          <div className="rounded-full bg-accent/10 p-4 mb-6">
            <MessageSquare className="h-8 w-8 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Ask anything about your documents
          </h2>
          <p className="text-sm text-text-secondary text-center max-w-md mb-8">
            Your questions will be answered using only the information in your uploaded documents.
            Every answer includes citations so you can verify the source.
          </p>

          {suggestedQuestions.length > 0 && (
            <SuggestedQuestions
              questions={suggestedQuestions}
              onSelect={onSendQuestion}
            />
          )}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto py-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onRetry={onRetry}
            />
          ))}
          {isGenerating && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
