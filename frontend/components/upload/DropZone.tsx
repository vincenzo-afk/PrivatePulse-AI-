"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, AlertCircle, FileText } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { MAX_FILE_SIZE_BYTES, ALLOWED_EXTENSIONS } from "@/lib/constants";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function DropZone({ onFilesSelected, disabled }: DropZoneProps) {
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Array<{ file: File; id: string }>>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === "file-too-large") {
          setError(`File too large. Max size: ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`);
        } else if (rejection.errors[0]?.code === "file-invalid-type") {
          setError(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
        } else {
          setError(rejection.errors[0]?.message || "Invalid file");
        }
        return;
      }

      if (acceptedFiles.length === 0) return;

      const newPreviews = acceptedFiles.map((file) => ({
        file,
        id: `${file.name}-${Date.now()}`,
      }));

      setPreviews((prev) => [...prev, ...newPreviews]);
    },
    []
  );

  const removePreview = (id: string) => {
    setPreviews((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpload = () => {
    if (previews.length > 0) {
      onFilesSelected(previews.map((p) => p.file));
      setPreviews([]); // Reset previews after upload
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: MAX_FILE_SIZE_BYTES,
    maxFiles: 10,
    disabled,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-accent bg-accent/5 glow-accent"
            : "border-border hover:border-accent/50 hover:bg-accent/5",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "rounded-full p-3 transition-colors",
              isDragActive ? "bg-accent/20" : "bg-elevated"
            )}
          >
            <Upload
              className={cn(
                "h-6 w-6 transition-colors",
                isDragActive ? "text-accent" : "text-text-muted"
              )}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-xs text-text-muted mt-1">
              PDF, DOCX, or TXT — up to {MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB each
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto hover:opacity-70">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* File previews */}
      {previews.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-muted">
            {previews.length} file{previews.length > 1 ? "s" : ""} selected
          </p>
          {previews.map((preview) => (
            <div
              key={preview.id}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-elevated border border-border"
            >
              <FileText className="h-4 w-4 text-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{preview.file.name}</p>
                <p className="text-xs text-text-muted">{formatFileSize(preview.file.size)}</p>
              </div>
              <button
                onClick={() => removePreview(preview.id)}
                className="text-text-muted hover:text-danger transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <button
            onClick={handleUpload}
            disabled={disabled}
            className="btn-primary rounded-lg px-5 py-2.5 text-sm w-full mt-2"
          >
            Upload {previews.length > 1 ? `${previews.length} files` : "file"}
          </button>
        </div>
      )}
    </div>
  );
}
