"use client";

import { useState, useRef, useEffect, KeyboardEvent, useCallback } from "react";
import { Send, Sparkles, Loader2, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string, images?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
  isGenerating?: boolean;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Ask anything about your documents...",
  isGenerating = false,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [attachedImages, setAttachedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxChars = 1000;
  const charsLeft = maxChars - value.length;
  const isNearLimit = charsLeft < 50;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 6 * 24);
      textarea.style.height = `${newHeight}px`;
    }
  }, [value]);

  // Generate preview URLs when images change, cleanup old ones
  useEffect(() => {
    const newUrls = attachedImages.map((img) => URL.createObjectURL(img));
    // Revoke previous URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls(newUrls);
    // Cleanup on unmount
    return () => {
      newUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachedImages]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (attachedImages.length + files.length > 5) {
        // Max 5 images per Groq vision limit
        setAttachedImages((prev) => prev.slice(0, 5));
        return;
      }
      setAttachedImages((prev) => [...prev, ...files].slice(0, 5));
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [attachedImages.length]);

  const removeImage = useCallback((index: number) => {
    setAttachedImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      return newImages;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if ((!trimmed && attachedImages.length === 0) || disabled || isGenerating) return;

    onSend(trimmed, attachedImages.length > 0 ? attachedImages : undefined);
    setValue("");
    setAttachedImages([]);
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, attachedImages, disabled, isGenerating, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasContent = value.trim().length > 0 || attachedImages.length > 0;

  return (
    <div className="border-t border-border bg-surface/95 backdrop-blur-sm px-4 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                if (e.target.value.length <= maxChars) {
                  setValue(e.target.value);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isGenerating}
              rows={1}
              className={cn(
                "w-full resize-none rounded-xl border bg-elevated px-4 py-3 pr-12 text-sm text-text-primary placeholder:text-text-muted",
                "border-border focus:border-accent/50 focus:ring-1 focus:ring-accent/30",
                "transition-all duration-200 outline-none",
                (disabled || isGenerating) && "opacity-50 cursor-not-allowed"
              )}
            />
            {isNearLimit && value.length > 0 && (
              <span className="absolute right-3 bottom-3 text-xs text-warning">
                {charsLeft}
              </span>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!hasContent || disabled || isGenerating}
            className={cn(
              "flex items-center justify-center rounded-xl p-3 transition-all duration-200 flex-shrink-0",
              hasContent && !disabled && !isGenerating
                ? "bg-accent text-black hover:opacity-90 glow-accent"
                : "bg-elevated text-text-muted cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Image attachment previews */}
        {attachedImages.length > 0 && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {attachedImages.map((img, i) => (
              <div key={`${img.name}-${i}`} className="relative group">
                <img
                  src={previewUrls[i]}
                  alt={`Attachment ${i + 1}`}
                  className="w-14 h-14 object-cover rounded-lg border border-border"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 bg-danger text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
                <span className="absolute bottom-0.5 right-1 text-[10px] bg-black/60 text-white px-1 rounded">
                  {img.name.split(".").pop()?.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Controls row */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {/* Image attach button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              disabled={disabled || isGenerating}
              className={cn(
                "flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors",
                (disabled || isGenerating) && "opacity-50 cursor-not-allowed"
              )}
              title="Attach images (max 5)"
            >
              <ImagePlus className="h-4 w-4" />
              <span className="hidden sm:inline">Image</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />

            {attachedImages.length > 0 && (
              <span className="text-xs text-text-muted">
                {attachedImages.length}/5 images
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-text-muted" />
            <p className="text-xs text-text-muted">
              Press <kbd className="px-1 py-0.5 rounded bg-elevated border border-border text-text-secondary font-mono text-[10px]">Enter</kbd> to send
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
