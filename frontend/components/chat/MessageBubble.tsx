"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Bot, Copy, Check, AlertTriangle, RefreshCw } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { CitationChip } from "./CitationChip";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: () => void;
  onSourcesClick?: () => void;
}

function parseMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: JSX.Element[] = [];
  let inCodeBlock = false;
  let codeContent = "";
  let codeLanguage = "";
  let listItems: string[] = [];

  lines.forEach((line, i) => {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="bg-elevated rounded-lg p-4 my-2 overflow-x-auto">
            <code className="text-sm text-text-secondary font-mono">{codeContent}</code>
          </pre>
        );
        codeContent = "";
        inCodeBlock = false;
      } else {
        if (listItems.length > 0) {
          elements.push(
            <ul key={`list-${i}`} className="my-2 space-y-1">
              {listItems.map((item, idx) => (
                <li key={idx} className="text-text-secondary flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
          listItems = [];
        }
        codeLanguage = line.slice(3);
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeContent += line + "\n";
      return;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      listItems.push(line.slice(2));
      return;
    }

    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${i}`} className="my-2 space-y-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-text-secondary flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }

    if (line.trim() === "") return;

    let formattedLine = line;
    formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    formattedLine = formattedLine.replace(/\*(.*?)\*/g, "<em>$1</em>");
    formattedLine = formattedLine.replace(/`([^`]+)`/g, '<code class="bg-elevated px-1.5 py-0.5 rounded text-xs font-mono text-accent">$1</code>');

    elements.push(
      <p
        key={i}
        className="text-text-secondary leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formattedLine }}
      />
    );
  });

  if (listItems.length > 0) {
    elements.push(
      <ul key="list-end" className="my-2 space-y-1">
        {listItems.map((item, idx) => (
          <li key={idx} className="text-text-secondary flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  return elements;
}

export function MessageBubble({ message, onRetry, onSourcesClick }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [displayedText, setDisplayedText] = useState(message.content);
  const [showSources, setShowSources] = useState(false);

  useEffect(() => {
    setDisplayedText(message.content);
  }, [message.content]);

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="rounded-full bg-accent/15 p-2 flex-shrink-0 h-fit self-start mt-1">
          <Bot className="h-4 w-4 text-accent" />
        </div>
      )}

      <div className={cn("max-w-[85%] sm:max-w-[75%] space-y-2", isUser && "order-first")}>
        {!isUser && (
          <div className="pl-3 border-l-2 border-accent rounded-r-lg">
            <div className="text-sm space-y-2">
              {parseMarkdown(message.content)}
            </div>
          </div>
        )}

        {isUser && (
          <div className="bg-elevated rounded-2xl px-4 py-3 rounded-br-md">
            <p className="text-sm text-text-primary whitespace-pre-wrap">{message.content}</p>
          </div>
        )}

        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {message.citations.map((citation, idx) => (
              <button
                key={citation.id}
                onClick={onSourcesClick}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs text-accent hover:bg-accent/15 transition-colors"
              >
                <sup className="font-medium">[{idx + 1}]</sup>
                <span className="text-text-muted">{citation.document_name}</span>
              </button>
            ))}
          </div>
        )}

        <div className={cn("flex items-center gap-3", isUser ? "justify-end" : "justify-start")}>
          {!isUser && message.sources && message.sources.length > 0 && (
            <button
              onClick={() => setShowSources(!showSources)}
              className="text-xs text-text-muted hover:text-accent transition-colors"
            >
              {showSources ? "Hide sources" : "Show sources"}
            </button>
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

      {isUser && (
        <div className="rounded-full bg-accent p-2 flex-shrink-0 h-fit self-start mt-1">
          <User className="h-4 w-4 text-black" />
        </div>
      )}
    </motion.div>
  );
}