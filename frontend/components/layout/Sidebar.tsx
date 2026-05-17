"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  ClipboardList,
  Settings,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, APP_NAME } from "@/lib/constants";
import { useAppStore } from "@/lib/store";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  MessageSquare,
  ClipboardList,
  Settings,
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full border-r border-border bg-surface flex flex-col transition-all duration-300",
          "w-16 lg:w-16",
          sidebarOpen && "w-60",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <Link href="/chat" className="flex items-center gap-2.5">
            <div className="rounded-lg bg-accent/15 p-1.5 flex-shrink-0">
              <ShieldCheck className="h-5 w-5 text-accent" />
            </div>
            {sidebarOpen && (
              <span className="font-semibold text-text-primary text-sm">
                {APP_NAME}
              </span>
            )}
          </Link>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-secondary lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent/10 text-accent border-r-2 border-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-elevated border-r-2 border-transparent"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block px-4 py-4 border-t border-border">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center gap-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            {sidebarOpen ? (
              <>
                <ChevronLeft className="h-3.5 w-3.5" />
                Collapse
              </>
            ) : (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
          {sidebarOpen && (
            <div className="text-center mt-2">
              <p className="text-xs text-text-muted">&copy; 2026 {APP_NAME}</p>
              <p className="text-xs text-text-muted">Confidential Computing</p>
            </div>
          )}
        </div>

        <div className="lg:hidden px-4 py-4 border-t border-border">
          <div className="text-center">
            <p className="text-xs text-text-muted">&copy; 2026 {APP_NAME}</p>
            <p className="text-xs text-text-muted">Confidential Computing</p>
          </div>
        </div>
      </aside>
    </>
  );
}