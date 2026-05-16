"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowUp, ChevronDown } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { SourcesPanel } from "./SourcesPanel";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { DEFAULT_SUGGESTED_QUESTIONS } from "@/lib/constants";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showSources, setShowSources] = useState(false);
  
  const sourcePanelOpen = useAppStore((s) => s.sourcePanelOpen);
  const currentSources = useAppStore((s) => s.currentSources);
  const closeSourcePanel = useAppStore((s) => s.closeSourcePanel);

  const isEmpty = messages.length === 0;
  const displaySuggestions = isEmpty ? (suggestedQuestions.length > 0 ? suggestedQuestions : DEFAULT_SUGGESTED_QUESTIONS) : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 200);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative flex-1 flex overflow-hidden">
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-3xl mx-auto px-4 py-6 min-h-full flex flex-col">
          <AnimatePresence>
            {isEmpty ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="flex-1 flex flex-col items-center justify-center py-20"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="relative mb-8"
                >
                  <div className="rounded-2xl bg-accent/10 p-6">
                    <Sparkles className="h-12 w-12 text-accent" />
                  </div>
                  <motion.div
                    className="absolute -inset-4 bg-accent/5 rounded-2xl -z-10"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="text-3xl font-semibold text-text-primary mb-3 text-center"
                >
                  What can I help you with today?
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="text-text-secondary text-center mb-8"
                >
                  Ask questions about your uploaded documents
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <SuggestedQuestions
                    questions={displaySuggestions}
                    onSelect={onSendQuestion}
                  />
                </motion.div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MessageBubble
                      message={message}
                      onRetry={onRetry}
                      onSourcesClick={() => {
                        if (message.sources && message.sources.length > 0) {
                          useAppStore.getState().openSourcePanel(message.sources);
                        }
                      }}
                    />
                  </motion.div>
                ))}
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <TypingIndicator />
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 lg:right-8 p-2 rounded-full bg-surface border border-border shadow-lg hover:border-accent/50 transition-colors"
        >
          <ArrowUp className="h-4 w-4 text-text-secondary" />
        </button>
      )}

      <AnimatePresence>
        {sourcePanelOpen && currentSources.length > 0 && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-surface border-l border-border z-50"
          >
            <SourcesPanel sources={currentSources} onClose={closeSourcePanel} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}