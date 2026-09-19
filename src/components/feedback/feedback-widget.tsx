"use client";

import { updateHistoryFeedback } from "@/lib/storage/local-storage";
import { UserFeedback } from "@/types";
import { Check, HeartHandshake } from "lucide-react";
import { useState } from "react";

interface FeedbackWidgetProps {
  historyId?: string;
  initialFeedback?: UserFeedback;
  onFeedbackSaved?: (feedback: UserFeedback) => void;
}

export function FeedbackWidget({
  historyId,
  initialFeedback,
  onFeedbackSaved,
}: FeedbackWidgetProps) {
  const [outcome, setOutcome] = useState<UserFeedback["outcome"] | null>(
    initialFeedback?.outcome || null
  );
  const [quality, setQuality] = useState<UserFeedback["recommendationQuality"] | null>(
    initialFeedback?.recommendationQuality || null
  );
  const [comment, setComment] = useState<string>(initialFeedback?.comment || "");
  const [isSaved, setIsSaved] = useState(Boolean(initialFeedback));

  const outcomes: { id: NonNullable<UserFeedback["outcome"]>; label: string; tag: string }[] = [
    { id: "excellent", label: "Flawless", tag: "10/10" },
    { id: "good", label: "Good", tag: "Solid" },
    { id: "acceptable", label: "Acceptable", tag: "Minor fix" },
    { id: "poor", label: "Suboptimal", tag: "Struggled" },
    { id: "failed", label: "Failed", tag: "Defect" },
  ];

  const qualities: {
    id: NonNullable<UserFeedback["recommendationQuality"]>;
    label: string;
    desc: string;
  }[] = [
    { id: "too_expensive", label: "Over-Provisioned", desc: "A cheaper model or lower effort would have succeeded" },
    { id: "about_right", label: "Calibrated", desc: "Optimal cost-to-reliability trade-off" },
    { id: "too_weak", label: "Under-Provisioned", desc: "Needed frontier reasoning or higher effort" },
  ];

  // Only what the user actually chose is saved: an unanswered question stays unanswered.
  const handleSelectOutcome = (selectedOutcome: NonNullable<UserFeedback["outcome"]>) => {
    setOutcome(selectedOutcome);
    save(selectedOutcome, quality ?? undefined, comment);
  };

  const handleSelectQuality = (
    selectedQuality: NonNullable<UserFeedback["recommendationQuality"]>
  ) => {
    setQuality(selectedQuality);
    save(outcome ?? undefined, selectedQuality, comment);
  };

  const handleCommentBlur = () => {
    if (outcome || quality) save(outcome ?? undefined, quality ?? undefined, comment);
  };

  const save = (
    o: UserFeedback["outcome"],
    q: UserFeedback["recommendationQuality"],
    note: string
  ) => {
    const feedbackObj: UserFeedback = {
      outcome: o,
      recommendationQuality: q,
      comment: note.trim() || undefined,
      submittedAt: new Date().toISOString(),
    };

    if (historyId) {
      updateHistoryFeedback(historyId, feedbackObj);
      window.dispatchEvent(new Event("modelpilot_history_updated"));
    }

    setIsSaved(true);
    if (onFeedbackSaved) onFeedbackSaved(feedbackObj);
  };

  return (
    <div className="rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0e14] p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-blue-500" />
          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            Task Outcome Evaluation
          </h4>
        </div>
        {isSaved && (
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
            <Check className="w-3.5 h-3.5" />
            Evaluation recorded locally
          </span>
        )}
      </div>

      {/* Step 1: Utility rating */}
      <div className="space-y-1.5">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          How reliably did this model configuration execute your task?
        </span>
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {outcomes.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectOutcome(opt.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                outcome === opt.id
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-xs"
                  : "bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/[0.06]"
              }`}
            >
              <span>{opt.label}</span>
              <span className="text-[10px] font-mono opacity-60">({opt.tag})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Configuration right-sizing */}
      <div className="space-y-1.5 pt-1">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Was the intelligence and effort level right-sized?
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
          {qualities.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectQuality(opt.id)}
              className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                quality === opt.id
                  ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 text-blue-950 dark:text-blue-100 ring-1 ring-blue-500/20"
                  : "bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-zinc-800 dark:text-zinc-200">{opt.label}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    quality === opt.id ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                />
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Optional note */}
      <div className="space-y-1.5 pt-1">
        <label htmlFor="feedback-comment" className="text-xs text-zinc-500 dark:text-zinc-400">
          Anything to add? (optional)
        </label>
        <textarea
          id="feedback-comment"
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={handleCommentBlur}
          placeholder="What worked, what did not..."
          className="w-full resize-y rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/40 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-blue-500"
        />
      </div>
    </div>
  );
}
