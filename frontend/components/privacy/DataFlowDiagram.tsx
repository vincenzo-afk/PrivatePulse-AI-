"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlowStep {
  label: string;
  description: string;
  isHighlighted?: boolean;
}

const colorMap: Record<string, { circle: string; text: string }> = {
  accent: {
    circle: "border-accent text-accent bg-accent/5",
    text: "text-text-primary",
  },
  "accent-secondary": {
    circle: "border-accent-secondary text-accent-secondary bg-accent-secondary/5",
    text: "text-text-primary",
  },
  warning: {
    circle: "border-warning text-warning bg-warning/10",
    text: "text-warning",
  },
};

export function DataFlowDiagram() {
  const steps: FlowStep[] = [
    { label: "Upload", description: "File stored in your session only" },
    { label: "Extract", description: "Text extracted locally" },
    { label: "Chunk", description: "Split into segments" },
    { label: "Vector Index", description: "Embedded + indexed locally" },
    { label: "Query", description: "Find relevant chunks only", isHighlighted: true },
    { label: "AI Model", description: "Context → Answer" },
    { label: "Response", description: "Masked, cited answer" },
  ];

  const getStepStyle = (step: FlowStep, index: number) => {
    if (step.isHighlighted) return colorMap.warning;
    if (index < 4) return colorMap.accent;
    return colorMap["accent-secondary"];
  };

  return (
    <div className="card-base p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-4">How Your Data Flows</h3>
      <div className="flex flex-col gap-3">
        {steps.map((step, i) => {
          const style = getStepStyle(step, i);
          return (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2", style.circle)}>
                  {i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-0.5 h-6 bg-border" />
                )}
              </div>
              <div className="flex-1 pb-3">
                <p className={cn("text-sm font-semibold", style.text)}>
                  {step.label}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 px-4 py-3 rounded-lg bg-warning/10 border border-warning/20">
        <p className="text-xs text-warning font-medium flex items-center gap-2">
          <ArrowRight className="h-3.5 w-3.5" />
          Only these chunks go to the AI model — never your raw files
        </p>
      </div>
    </div>
  );
}
