"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "../store";

export function useSession() {
  const sessionId = useAppStore((s) => s.sessionId);
  const initSession = useAppStore((s) => s.initSession);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!sessionId && !initializedRef.current) {
      initializedRef.current = true;
      initSession();
    }
  }, [sessionId, initSession]);

  return { sessionId };
}
