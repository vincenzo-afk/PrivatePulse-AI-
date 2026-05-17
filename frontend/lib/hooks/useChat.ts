"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useAppStore } from "../store";
import { chatApi } from "../api";
import { queryKeys } from "./useDocuments";
import type { ChatMessage } from "../types";

export interface SendMessageOptions {
  question: string;
  images?: File[];
}

export function useChat() {
  const sessionId = useAppStore((s) => s.sessionId);
  const messages = useAppStore((s) => s.messages);
  const addMessage = useAppStore((s) => s.addMessage);
  const setIsGenerating = useAppStore((s) => s.setIsGenerating);
  const openSourcePanel = useAppStore((s) => s.openSourcePanel);
  const activeDocumentIds = useAppStore((s) => s.activeDocumentIds);

  const queryMutation = useMutation({
    mutationFn: async ({ question, images }: SendMessageOptions) => {
      setIsGenerating(true);
      const conversationHistory = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const formData = new FormData();
      formData.append("session_id", sessionId!);
      formData.append("question", question);
      if (activeDocumentIds.length > 0) {
        formData.append("document_ids", JSON.stringify(activeDocumentIds));
      }
      if (conversationHistory.length > 0) {
        formData.append("conversation_history", JSON.stringify(conversationHistory));
      }
      if (images && images.length > 0) {
        images.forEach((img) => {
          formData.append("images", img);
        });
      }

      return chatApi.query(formData);
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        citations: data.citations,
        sources: data.sources,
        privacy_summary: data.privacy_summary,
        created_at: new Date().toISOString(),
      };
      addMessage(assistantMessage);

      if (data.sources && data.sources.length > 0) {
        openSourcePanel(data.sources);
      }

      setIsGenerating(false);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || "Failed to generate an answer. Please try again.";
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "error",
        content: message,
        created_at: new Date().toISOString(),
      };
      addMessage(errorMessage);
      setIsGenerating(false);
    },
  });

  const suggestedQuestionsQuery = useQuery({
    queryKey: queryKeys.suggestedQuestions(sessionId || ""),
    queryFn: () => chatApi.suggestedQuestions(sessionId!),
    enabled: !!sessionId,
    staleTime: 60000,
  });

  return {
    messages,
    sendMessage: (question: string, images?: File[]) => {
      // Add user message
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: question + (images && images.length > 0 ? ` (${images.length} image${images.length > 1 ? "s" : ""} attached)` : ""),
        created_at: new Date().toISOString(),
      };
      addMessage(userMessage);
      queryMutation.mutate({ question, images });
    },
    suggestedQuestions: suggestedQuestionsQuery.data?.questions || [],
    isGenerating: useAppStore((s) => s.isGenerating),
    clearMessages: useAppStore((s) => s.clearMessages),
  };
}
