"use client";

import { CheckCircle2, XCircle } from "lucide-react";

interface ChecklistItem {
  text: string;
  done: boolean;
}

export function PrivacyChecklist() {
  const items: ChecklistItem[] = [
    { text: "Documents stored locally in your session only", done: true },
    { text: "Raw files are never sent to the AI model", done: true },
    { text: "Only relevant text excerpts are included in AI prompts", done: true },
    { text: "Sensitive values are masked in the UI", done: true },
    { text: "Full audit trail of every access", done: true },
    { text: "Session data deleted on browser close", done: true },
    { text: "We do not train on your documents", done: false },
    { text: "We do not store documents between sessions", done: false },
    { text: "We do not share your data with third parties", done: false },
  ];

  const doneItems = items.filter((i) => i.done);
  const notDoneItems = items.filter((i) => !i.done);

  return (
    <div className="grid sm:grid-cols-2 gap-6">
      <div>
        <h3 className="text-sm font-semibold text-accent mb-3">What we do</h3>
        <ul className="space-y-3">
          {doneItems.map((item) => (
            <li key={item.text} className="flex items-start gap-2 text-sm text-text-secondary">
              <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
              {item.text}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-danger mb-3">What we never do</h3>
        <ul className="space-y-3">
          {notDoneItems.map((item) => (
            <li key={item.text} className="flex items-start gap-2 text-sm text-text-secondary">
              <XCircle className="h-4 w-4 text-danger mt-0.5 flex-shrink-0" />
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
