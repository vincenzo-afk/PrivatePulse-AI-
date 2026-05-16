"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, MessageSquare, ArrowRight } from "lucide-react";
import { SESSION_STORAGE_KEY } from "@/lib/constants";

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionId) {
      router.replace("/chat");
    }
  }, [router]);

  const handleStartChat = () => {
    const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionId) {
      router.push("/chat");
    } else {
      const newId = crypto.randomUUID();
      localStorage.setItem(SESSION_STORAGE_KEY, newId);
      router.push("/chat");
    }
  };

  if (!mounted) {
    return null;
  }

  const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (sessionId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,170,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,170,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-accent/15 p-1.5">
            <ShieldCheck className="h-5 w-5 text-accent" />
          </div>
          <span className="font-semibold text-text-primary text-sm">PrivatePulse AI</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-lg"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-medium mb-6">
            <ShieldCheck className="h-3.5 w-3.5" />
            AI-Powered Document Intelligence
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-text-primary mb-4">
            Your Documents.
            <br />
            Your AI Assistant.
          </h1>

          <p className="text-lg text-text-secondary mb-10">
            Ask questions about your sensitive documents and get instant, accurate answers with full privacy protection.
          </p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onClick={handleStartChat}
            className="btn-primary rounded-xl px-8 py-3.5 text-base inline-flex items-center gap-2 glow-accent"
          >
            <MessageSquare className="h-5 w-5" />
            Start Chat
            <ArrowRight className="h-5 w-5" />
          </motion.button>
        </motion.div>
      </main>

      <footer className="relative z-10 px-6 py-4 text-center">
        <p className="text-xs text-text-muted">
          Secure document processing
        </p>
      </footer>
    </div>
  );
}