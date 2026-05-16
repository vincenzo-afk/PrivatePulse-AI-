"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, ImagePlus, X } from "lucide-react";
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

  const maxChars = 2000;
  const charsLeft = maxChars - value.length;
  const isNearLimit = charsLeft < 100;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 6 * 24);
      textarea.style.height = `${newHeight}px`;
    }
  }, [value]);

  useEffect(() => {
    const newUrls = attachedImages.map((img) => URL.createObjectURL(img));
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls(newUrls);
    return () => {
      newUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachedImages]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (attachedImages.length + files.length > 5) {
        setAttachedImages((prev) => prev.slice(0, 5));
        return;
      }
      setAttachedImages((prev) => [...prev, ...files].slice(0, 5));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [attachedImages.length]);

  const removeImage = useCallback((index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if ((!trimmed && attachedImages.length === 0) || disabled || isGenerating) return;

    onSend(trimmed, attachedImages.length > 0 ? attachedImages : undefined);
    setValue("");
    setAttachedImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, attachedImages, disabled, isGenerating, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasContent = value.trim().length > 0 || attachedImages.length > 0;

  return (
    <div className="border-t border-border bg-surface p-4">
      <div className="max-w-3xl mx-auto">
        <div 
          className={cn(
            "bg-surface border border-border rounded-xl transition-all",
            "focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/30"
          )}
        >
          <div className="flex items-end gap-2 p-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              disabled={disabled || isGenerating}
              className={cn(
                "flex-shrink-0 p-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-elevated transition-colors",
                (disabled || isGenerating) && "opacity-50 cursor-not-allowed"
              )}
              title="Attach images (max 5)"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />

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
              className="flex-1 resize-none bg-transparent text-text-primary placeholder:text-text-muted outline-none text-sm min-h-[24px] max-h-[144px]"
            />

            <button
              onClick={handleSubmit}
              disabled={!hasContent || disabled || isGenerating}
              className={cn(
                "flex-shrink-0 flex items-center justify-center rounded-xl p-2.5 transition-all duration-200",
                hasContent && !disabled && !isGenerating
                  ? "bg-accent text-black hover:opacity-90"
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

          {attachedImages.length > 0 && (
            <div className="flex items-center gap-2 px-3 pb-3 flex-wrap">
              {attachedImages.map((img, i) => (
                <div key={`${img.name}-${i}`} className="relative group">
                  <img
                    src={previewUrls[i]}
                    alt={`Attachment ${i + 1}`}
                    className="w-12 h-12 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 bg-danger text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>Enter to send</span>
            <span className="text-border">•</span>
            <span>Shift + Enter for new line</span>
          </div>
          {isNearLimit && value.length > 0 && (
            <span className="text-xs text-warning">{charsLeft} chars left</span>
          )}
        </div>
      </div>
    </div>
  );
}