import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrivatePulse AI",
  description:
    "Privacy-first RAG-powered document intelligence assistant. Ask questions about your sensitive documents without exposing what's inside.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-base text-text-primary font-sans">
        <Providers>{children}</Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgb(var(--bg-surface))",
              color: "rgb(var(--text-primary))",
              border: "1px solid rgb(var(--border))",
            },
          }}
        />
      </body>
    </html>
  );
}
