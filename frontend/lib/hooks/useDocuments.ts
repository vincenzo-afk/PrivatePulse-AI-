"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAppStore } from "../store";
import { documentsApi } from "../api";

export const queryKeys = {
  documents: (sessionId: string) => ["documents", sessionId] as const,
  documentStatus: (docId: string) => ["document", docId, "status"] as const,
  suggestedQuestions: (sessionId: string) => ["suggested-questions", sessionId] as const,
  auditEvents: (sessionId: string) => ["audit", sessionId] as const,
};

export function useDocuments() {
  const sessionId = useAppStore((s) => s.sessionId);
  const setDocuments = useAppStore((s) => s.setDocuments);
  const addDocument = useAppStore((s) => s.addDocument);
  const removeDocument = useAppStore((s) => s.removeDocument);

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.documents(sessionId || ""),
    queryFn: () => documentsApi.list(sessionId!),
    enabled: !!sessionId,
    refetchInterval: false,
  });

  // Keep store in sync via useEffect (not during render)
  const prevDocIdsRef = useRef<string>("");
  useEffect(() => {
    if (query.data?.documents) {
      const newIdsSorted = query.data.documents.map((d) => d.id).sort().join(",");
      if (prevDocIdsRef.current !== newIdsSorted) {
        prevDocIdsRef.current = newIdsSorted;
        setDocuments(query.data.documents);
      }
    }
  }, [query.data, setDocuments]);

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => documentsApi.upload(files, sessionId!),
    onSuccess: (data) => {
      data.documents.forEach((doc) => addDocument(doc));
      queryClient.invalidateQueries({ queryKey: queryKeys.documents(sessionId!) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id, sessionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents(sessionId!) });
    },
  });

  return {
    documents: query.data?.documents || [],
    isLoading: query.isLoading,
    error: query.error,
    upload: async (files: File[]) => {
      const result = await uploadMutation.mutateAsync(files);
      return result;
    },
    delete: async (id: string) => {
      await deleteMutation.mutateAsync(id);
      removeDocument(id);
    },
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch: query.refetch,
  };
}

export function useDocumentStatus(docId: string, enabled: boolean = false) {
  return useQuery({
    queryKey: queryKeys.documentStatus(docId),
    queryFn: () => documentsApi.getStatus(docId),
    enabled,
    refetchInterval: enabled ? 3000 : false,
  });
}
