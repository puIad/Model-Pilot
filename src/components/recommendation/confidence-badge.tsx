"use client";

import { CheckCircle2, HelpCircle, ShieldAlert } from "lucide-react";

interface ConfidenceBadgeProps {
  confidence: "high" | "medium" | "low";
  score: number;
}

export function ConfidenceBadge({ confidence, score }: ConfidenceBadgeProps) {
  const config = {
    high: {
      label: "High Certainty",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-500",
      icon: CheckCircle2,
      desc: "Requirements are explicit with minimal ambiguity; classification is decisive.",
    },
    medium: {
      label: "Medium Certainty",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      dot: "bg-amber-500",
      icon: HelpCircle,
      desc: "Slight ambiguity in scope or boundary conditions; recommended config is safe.",
    },
    low: {
      label: "Low Certainty",
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      dot: "bg-rose-500",
      icon: ShieldAlert,
      desc: "Sparse or ambiguous prompt; consider adding more specific requirements.",
    },
  }[confidence];

  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border font-mono ${config.color}`}
      title={config.desc}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
      <span className="opacity-75 tabular-nums">({score}%)</span>
    </div>
  );
}
