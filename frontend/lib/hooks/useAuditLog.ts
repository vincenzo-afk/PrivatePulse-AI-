"use client";

import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "../store";
import { auditApi } from "../api";
import { queryKeys } from "./useDocuments";
import type { AuditEvent } from "../types";

export function useAuditLog(params?: {
  event_type?: string;
  limit?: number;
  offset?: number;
}) {
  const sessionId = useAppStore((s) => s.sessionId);

  const query = useQuery({
    queryKey: [...queryKeys.auditEvents(sessionId || ""), params],
    queryFn: () => auditApi.getEvents(sessionId!, params),
    enabled: !!sessionId,
    refetchInterval: 10000,
  });

  return {
    events: query.data?.events || [],
    total: query.data?.total || 0,
    page: query.data?.page || 1,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
