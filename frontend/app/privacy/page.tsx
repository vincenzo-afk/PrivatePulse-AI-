"use client";

import { Shield, Lock, CheckCircle2, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DataFlowDiagram } from "@/components/privacy/DataFlowDiagram";
import { PrivacyChecklist } from "@/components/privacy/PrivacyChecklist";

export default function PrivacyPage() {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-lg bg-accent/10 p-2">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Privacy</h1>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
            PrivatePulse AI processes your documents locally and sends only retrieved context to
            the AI model — never your full files. Your data stays yours, always.
          </p>
        </div>

        {/* Data Flow Diagram */}
        <DataFlowDiagram />

        {/* Privacy Checklist */}
        <div className="card-base p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">Privacy Checklist</h2>
          </div>
          <PrivacyChecklist />
        </div>

        {/* Midnight Alignment */}
        <div className="card-base p-6 border-accent/20">
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            Alignment with Midnight&apos;s Confidential Computing Vision
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Our architecture is inspired by Midnight&apos;s vision for confidential computing.
            In a full Midnight deployment, document processing would run inside confidential smart
            contracts, ensuring even the application operator cannot see your data.
            This means zero-trust privacy where your sensitive documents remain encrypted and
            verifiably private throughout the entire pipeline — from upload to AI-powered analysis.
          </p>
        </div>

        {/* Technical Details */}
        <div className="card-base overflow-hidden">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full flex items-center justify-between px-6 py-4 text-left"
          >
            <span className="text-sm font-semibold text-text-primary">Technical Details</span>
            {showTechnicalDetails ? (
              <ChevronDown className="h-4 w-4 text-text-muted" />
            ) : (
              <ChevronRight className="h-4 w-4 text-text-muted" />
            )}
          </button>
          {showTechnicalDetails && (
            <div className="px-6 pb-4 space-y-4">
              <div className="grid gap-4 text-sm">
                {[
                  { label: "Embedding Model", value: "text-embedding-3-small (OpenAI) — 1536 dimensions" },
                  { label: "LLM API", value: "Groq Llama 3.2 90B Vision (llama-3.2-90b-vision-preview)" },
                  { label: "Vector Store", value: "ChromaDB — persistent, session-isolated" },
                  { label: "Session Isolation", value: "Each session gets its own Chroma collection. No cross-session access." },
                  { label: "Data Storage", value: "SQLite for metadata + ChromaDB for vectors + local filesystem for uploads" },
                  { label: "What goes to the LLM", value: "Only top-5 retrieved chunks (~4000 chars max). Never full documents." },
                ].map((detail) => (
                  <div key={detail.label} className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-text-muted">{detail.label}</span>
                    <span className="text-xs text-text-secondary">{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
