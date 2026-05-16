"use client";

import { useRouter } from "next/navigation";
import { Upload, FileText, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DropZone } from "@/components/upload/DropZone";
import { DocumentList } from "@/components/documents/DocumentList";
import { useDocuments } from "@/lib/hooks/useDocuments";
import { useSession } from "@/lib/hooks/useSession";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  useSession();
  const { documents, isLoading, upload, delete: deleteDoc, isUploading } = useDocuments();

  const handleUpload = async (files: File[]) => {
    try {
      await upload(files);
      toast.success(`Uploading ${files.length} file${files.length > 1 ? "s" : ""}...`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Upload failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(id);
      toast.success("Document deleted");
    } catch {
      toast.error("Failed to delete document");
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Your Documents</h1>
            <p className="text-sm text-text-secondary mt-1">
              Upload and manage your documents for AI-powered queries
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted card-base px-3 py-2">
            <FileText className="h-3.5 w-3.5" />
            <span>{documents.length} document{documents.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Upload zone */}
        <div className="card-base p-6 mb-8">
          <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Upload className="h-4 w-4 text-accent" />
            Upload Documents
          </h2>
          <DropZone onFilesSelected={handleUpload} disabled={isUploading} />
          {isUploading && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing documents...
            </div>
          )}
        </div>

        {/* Document list */}
        <div>
          <h2 className="text-sm font-semibold text-text-primary mb-4">All Documents</h2>
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            onDelete={handleDelete}
            onUploadClick={() => document.getElementById("upload-section")?.scrollIntoView()}
          />
        </div>
      </div>
    </AppShell>
  );
}
