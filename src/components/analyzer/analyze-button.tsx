"use client";

import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface AnalyzeButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

const LOADING_STEPS = [
  "Profiling task complexity & consequence...",
  "Evaluating Layer B requirements gate...",
  "Scoring model candidate utility...",
  "Calibrating minimum reasoning effort...",
];

export function AnalyzeButton({ onClick, isLoading, disabled }: AnalyzeButtonProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 400);

    return () => {
      clearInterval(interval);
      setStepIndex(0);
    };
  }, [isLoading]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
      <div className="text-xs text-zinc-500 dark:text-zinc-400 order-2 sm:order-1 font-mono">
        {isLoading ? (
          <span className="flex items-center gap-2 text-blue-500 dark:text-blue-400 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {LOADING_STEPS[stepIndex]}
          </span>
        ) : (
          <span>Deterministic recommendation • 100% reproducible</span>
        )}
      </div>

      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={onClick}
        className={`w-full sm:w-auto px-5 py-2.5 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer order-1 sm:order-2 ${
          disabled || isLoading
            ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed border border-zinc-300 dark:border-zinc-700/60"
            : "bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 shadow-xs border border-zinc-900 dark:border-white active:scale-[0.99]"
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-current" />
            <span>Analyzing Requirements...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-600" />
            <span>Recommend Model & Effort</span>
            <ArrowRight className="w-4 h-4 opacity-70" />
          </>
        )}
      </button>
    </div>
  );
}
