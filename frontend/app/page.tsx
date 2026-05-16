"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Search,
  FileText,
  ScrollText,
  ArrowRight,
  Lock,
  Database,
  Brain,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { useAppStore } from "@/lib/store";
import { demoApi } from "@/lib/api";
import { APP_NAME } from "@/lib/constants";

export default function LandingPage() {
  const router = useRouter();
  const sessionId = useAppStore((s) => s.sessionId);
  const addDocument = useAppStore((s) => s.addDocument);

  const handleStartDemo = async () => {
    if (!sessionId) return;
    try {
      const result = await demoApi.load(sessionId, "all");
      result.documents.forEach((doc) => addDocument(doc));
      router.push("/chat");
    } catch {
      console.warn("Demo load failed, navigating to chat anyway");
      router.push("/chat");
    }
  };

  const handleUpload = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-base">
      {/* Noise overlay */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Animated grid background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,170,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,170,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <TopBar
        rightContent={
          <div className="flex items-center gap-3">
            <button onClick={handleUpload} className="btn-ghost rounded-lg px-4 py-2 text-sm">
              Upload Your Own
            </button>
            <button
              onClick={handleStartDemo}
              className="btn-primary rounded-lg px-5 py-2 text-sm"
            >
              Start Demo
            </button>
          </div>
        }
      />

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-medium mb-6">
              <ShieldCheck className="h-3.5 w-3.5" />
              Privacy-First AI Document Intelligence
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl lg:text-6xl font-bold tracking-tight text-text-primary"
          >
            Your Documents.
            <br />
            Your Questions.
            <span className="text-accent"> Zero Exposure.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto"
          >
            {APP_NAME} uses AI to answer questions about your sensitive files — medical records,
            financial statements, legal contracts — without exposing what&apos;s inside.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={handleStartDemo}
              className="btn-primary rounded-xl px-8 py-3.5 text-base inline-flex items-center gap-2 glow-accent"
            >
              <FileText className="h-5 w-5" />
              Start with Demo Documents
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={handleUpload}
              className="btn-ghost rounded-xl px-8 py-3.5 text-base inline-flex items-center gap-2"
            >
              Upload Your Own
            </button>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Database,
                title: "Private Knowledge Index",
                description:
                  "Your documents are processed locally, chunked, and indexed in a session-isolated vector store — never exposed to anyone else.",
              },
              {
                icon: Search,
                title: "Grounded Answers with Citations",
                description:
                  "Every answer is sourced from your documents with inline citations. You see exactly which excerpts informed the response.",
              },
              {
                icon: ScrollText,
                title: "Full Audit Trail",
                description:
                  "Every operation — upload, extraction, query, and answer — is logged with timestamps. Total transparency into what happened.",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                className="card-base p-6 hover:border-accent/20 transition-colors group"
              >
                <div className="rounded-lg bg-accent/10 p-3 w-fit mb-4 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Promise Section */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card-base p-8 lg:p-10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-accent/10 p-2">
                <Lock className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Our Privacy Promise</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-accent">What we do</h3>
                <ul className="space-y-2">
                  {[
                    "Documents stored locally in your session only",
                    "Only relevant text excerpts included in AI prompts",
                    "Sensitive values masked in all UI previews",
                    "Full audit trail of every access",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                      <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-danger">What we never do</h3>
                <ul className="space-y-2">
                  {[
                    "We do not train on your documents",
                    "Raw files are never sent to the AI model",
                    "We do not share your data with third parties",
                    "Documents are not stored between sessions",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                      <XCircle className="h-4 w-4 text-danger mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <ShieldCheck className="h-4 w-4 text-accent" />
            {APP_NAME}
          </div>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <Link href="/privacy" className="hover:text-text-secondary transition-colors">
              Privacy
            </Link>
            <a
              href="https://github.com/vincenzo-afk/PrivatePulse-AI-"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-secondary transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
