"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";

function SessionInitializer({ children }: { children: React.ReactNode }) {
  const initSession = useAppStore((s) => s.initSession);
  const loadSettings = useAppStore((s) => s.loadSettings);

  useEffect(() => {
    initSession();
    loadSettings();
  }, [initSession, loadSettings]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionInitializer>{children}</SessionInitializer>
    </QueryClientProvider>
  );
}