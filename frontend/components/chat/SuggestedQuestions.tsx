"use client";

import { Sparkles } from "lucide-react";

interface SuggestedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
}

export function SuggestedQuestions({ questions, onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        <span className="text-xs font-medium text-text-muted">Suggested questions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, i) => (
          <button
            key={i}
            onClick={() => onSelect(question)}
            className="text-xs px-3.5 py-2 rounded-full border border-border bg-surface
                       text-text-secondary hover:text-accent hover:border-accent/30
                       hover:bg-accent/5 transition-all duration-200 text-left"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
