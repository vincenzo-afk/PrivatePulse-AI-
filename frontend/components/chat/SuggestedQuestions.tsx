"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SuggestedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
  className?: string;
}

export function SuggestedQuestions({ questions, onSelect, className }: SuggestedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className={cn("w-full max-w-xl", className)}>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {questions.map((question, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            onClick={() => onSelect(question)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200",
              "border-border text-text-secondary hover:text-text-primary",
              "hover:bg-elevated hover:border-accent/50"
            )}
          >
            {question}
          </motion.button>
        ))}
      </div>
    </div>
  );
}