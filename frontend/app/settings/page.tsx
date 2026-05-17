"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings as SettingsIcon, Key, Cpu, Type, Info, AlertTriangle, Copy, Check, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAppStore } from "@/lib/store";
import { useSession } from "@/lib/hooks/useSession";
import { chatApi } from "@/lib/api";
import { AVAILABLE_MODELS, FONT_SIZE_OPTIONS } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  useSession();
  const { settings, setSettings, loadSettings, clearSession, sessionId, updateSetting } = useAppStore();
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedSessionId, setCopiedSessionId] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleClearSession = async () => {
    setIsClearing(true);
    try {
      if (sessionId) {
        try {
          await chatApi.deleteSession(sessionId);
        } catch {}
      }
    } catch {}
    
    clearSession();
    router.push("/");
    setIsClearing(false);
    setShowClearConfirm(false);
  };

  const handleCopySessionId = async () => {
    if (sessionId) {
      await navigator.clipboard.writeText(sessionId);
      setCopiedSessionId(true);
      setTimeout(() => setCopiedSessionId(false), 2000);
    }
  };

  const handleSaveApiKey = (value: string) => {
    updateSetting("apiKey", value);
  };

  const handleModelChange = (value: string) => {
    updateSetting("model", value as "llama-3.3-70b-versatile" | "llama-3.1-8b-instant");
  };

  const handleFontSizeChange = (value: string) => {
    updateSetting("fontSize", value as "sm" | "md" | "lg");
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="h-5 w-5 text-accent" />
            <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          </div>
          <p className="text-sm text-text-secondary">
            Configure your chat experience and session preferences
          </p>
        </div>

        <div className="space-y-6">
          <section className="card-base p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-4 w-4 text-accent" />
              <h2 className="text-lg font-semibold text-text-primary">Session Management</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-muted mb-1.5 block">
                  Current Session ID
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-secondary font-mono truncate">
                    {sessionId || "No session"}
                  </code>
                  <button
                    onClick={handleCopySessionId}
                    className={cn(
                      "p-2 rounded-lg border border-border hover:border-accent/30 transition-colors",
                      copiedSessionId && "border-accent/30 text-accent"
                    )}
                  >
                    {copiedSessionId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-2 text-danger text-sm hover:opacity-80 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Session
                </button>
              </div>
            </div>
          </section>

          <section className="card-base p-6">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="h-4 w-4 text-accent" />
              <h2 className="text-lg font-semibold text-text-primary">API Configuration</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-muted mb-1.5 block">
                  Groq API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={settings.apiKey}
                    onChange={(e) => handleSaveApiKey(e.target.value)}
                    placeholder="Enter your Groq API key..."
                    className="input-base w-full pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  >
                    {showApiKey ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-warning">
                  <AlertTriangle className="h-3 w-3" />
                  <span>API key is stored locally in your browser</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-text-muted mb-1.5 block">
                  Model
                </label>
                <select
                  value={settings.model}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="input-base w-full text-sm"
                >
                  {AVAILABLE_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="card-base p-6">
            <div className="flex items-center gap-2 mb-4">
              <Type className="h-4 w-4 text-accent" />
              <h2 className="text-lg font-semibold text-text-primary">Appearance</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-muted mb-1.5 block">
                  Font Size
                </label>
                <div className="flex gap-2">
                  {FONT_SIZE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFontSizeChange(option.value)}
                      className={cn(
                        "flex-1 py-2 px-4 rounded-lg border text-sm transition-colors",
                        settings.fontSize === option.value
                          ? "bg-accent/10 border-accent/30 text-accent"
                          : "border-border text-text-secondary hover:border-accent/20"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="card-base p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-4 w-4 text-accent" />
              <h2 className="text-lg font-semibold text-text-primary">About</h2>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Version</span>
                <span className="text-text-secondary">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Build</span>
                <span className="text-text-secondary">2026.05</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Clear Session"
        description="This will delete your session, all documents, and chat history. This action cannot be undone."
        confirmLabel="Clear Session"
        onConfirm={handleClearSession}
        variant="danger"
        loading={isClearing}
      />
    </AppShell>
  );
}