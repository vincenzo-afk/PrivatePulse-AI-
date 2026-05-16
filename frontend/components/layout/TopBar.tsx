"use client";

import Link from "next/link";
import { ShieldCheck, Menu } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

interface TopBarProps {
  onMenuClick?: () => void;
  showMenu?: boolean;
  rightContent?: React.ReactNode;
}

export function TopBar({ onMenuClick, showMenu = false, rightContent }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {showMenu && (
          <button
            onClick={onMenuClick}
            className="text-text-secondary hover:text-text-primary lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <Link href="/" className="flex items-center gap-2">
          <div className="rounded-lg bg-accent/15 p-1.5">
            <ShieldCheck className="h-5 w-5 text-accent" />
          </div>
          <span className="font-semibold text-text-primary text-sm">{APP_NAME}</span>
        </Link>
      </div>
      {rightContent && <div className="flex items-center gap-3">{rightContent}</div>}
    </header>
  );
}
