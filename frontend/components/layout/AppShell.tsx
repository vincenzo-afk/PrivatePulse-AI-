"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useAppStore } from "@/lib/store";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarExpanded = useAppStore((s) => s.sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div 
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          sidebarExpanded ? "lg:ml-60" : "lg:ml-16"
        )}
      >
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-text-secondary hover:text-text-primary"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-text-primary">PrivatePulse AI</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}