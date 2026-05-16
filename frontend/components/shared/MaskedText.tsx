"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { maskSensitiveText } from "@/lib/masking";

interface MaskedTextProps {
  text: string;
  autoMask?: boolean;
  showToggle?: boolean;
  className?: string;
}

export function MaskedText({
  text,
  autoMask = true,
  showToggle = true,
  className,
}: MaskedTextProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const masked = maskSensitiveText(text);

  if (!autoMask || !(masked !== text)) {
    return <span className={className}>{text}</span>;
  }

  const displayText = isRevealed ? text : masked;

  const handleToggle = () => {
    if (!isRevealed) {
      setShowConfirm(true);
    } else {
      setIsRevealed(false);
    }
  };

  const handleConfirmReveal = () => {
    setShowConfirm(false);
    setIsRevealed(true);
  };

  return (
    <span className="relative group">
      <span className={className}>{displayText}</span>
      {showToggle && (masked !== text) && (
        <span className="inline-flex items-center ml-1.5">
          {showConfirm ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="text-xs text-warning">Reveal sensitive data?</span>
              <button
                onClick={handleConfirmReveal}
                className="text-xs text-accent hover:underline"
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-xs text-text-muted hover:underline"
              >
                No
              </button>
            </span>
          ) : (
            <button
              onClick={handleToggle}
              className="p-0.5 rounded hover:bg-elevated text-text-muted hover:text-text-secondary transition-colors"
              title={isRevealed ? "Mask sensitive data" : "Reveal sensitive data"}
            >
              {isRevealed ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
            </button>
          )}
        </span>
      )}
    </span>
  );
}
