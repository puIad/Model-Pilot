"use client";

import { getStoredHistory } from "@/lib/storage/local-storage";

import { HistoryItem } from "@/types";

import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Coins,
  Compass,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";


export default function AnalyticsPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    // Hydrate from localStorage after mount: it does not exist during server rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(getStoredHistory());
  }, []);

  const totalTasks = history.length;
  const feedbackItems = history.filter((h) => h.feedback?.recommendationQuality);
  const tooExpensiveCount = feedbackItems.filter(
    (h) => h.feedback?.recommendationQuality === "too_expensive"
  ).length;
  const tooWeakCount = feedbackItems.filter(
    (h) => h.feedback?.recommendationQuality === "too_weak"
  ).length;
  const aboutRightCount = feedbackItems.filter(
    (h) => h.feedback?.recommendationQuality === "about_right"
  ).length;

  // Compute model frequency
  const modelCounts: Record<string, number> = {};
  const effortCounts: Record<string, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    VERY_HIGH: 0,
  };
  const typeCounts: Record<string, number> = {};

  history.forEach((h) => {
    const m = h.recommendation.modelName;
    modelCounts[m] = (modelCounts[m] || 0) + 1;

    const eff = h.recommendation.effort;
    effortCounts[eff] = (effortCounts[eff] || 0) + 1;

    const t = h.recommendation.taskProfile.taskType;
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  // Observations generation per Plan.md Section 22
  const observations: string[] = [];
  if (totalTasks >= 3) {
    if (aboutRightCount > 0 && aboutRightCount >= feedbackItems.length * 0.7) {
      observations.push(
        `Over ${Math.round((aboutRightCount / feedbackItems.length) * 100)}% of your rated recommendations were marked 'About Right', suggesting strong alignment with your project standards.`
      );
    }
    if (tooExpensiveCount > tooWeakCount && tooExpensiveCount > 1) {
      observations.push(
        "You frequently find recommendations slightly too expensive. Consider selecting 'Lowest Cost' priority on routine coding tasks to bias toward budget tiers."
      );
    }
    if (effortCounts["LOW"] + effortCounts["MEDIUM"] >= totalTasks * 0.6) {
      observations.push(
        "The majority of your tasks are handled cleanly with Low to Medium effort, preserving token budgets for critical architectural milestones."
      );
    }
    if (typeCounts["architecture"] || typeCounts["security"]) {
      observations.push(
        "Architecture & security tasks consistently receive elevated reasoning tiers, protecting against high-blast-radius failures."
      );
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
              Personal Optimization & Usage
            </h1>
            <p className="text-xs text-zinc-400">
              Analytics synthesized strictly from your local analysis history
            </p>
          </div>
        </div>
      </div>

      {totalTasks === 0 ? (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto text-zinc-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">No Analytics Available Yet</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Once you analyze tasks and log feedback on recommendations, ModelPilot will surface cost trends, model tier distribution, and configuration observations here.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Go to Analyzer</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Tasks Analyzed
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-zinc-100">
                {totalTasks}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">Total evaluated</span>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                About Right
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
                {aboutRightCount}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">Accurate sizing</span>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                Too Expensive
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">
                {tooExpensiveCount}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">Over-provisioned</span>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Too Weak
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-400">
                {tooWeakCount}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">Under-provisioned</span>
            </div>
          </div>

          {/* Observations Box per Plan.md Section 22 */}
          <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
              <Lightbulb className="w-4 h-4 text-blue-400" />
              <span>Pattern Observations</span>
            </div>

            {observations.length > 0 ? (
              <ul className="space-y-2 text-xs sm:text-sm text-zinc-200">
                {observations.map((obs, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-zinc-400">
                Record feedback on at least 3 tasks to unlock personalized optimization insights and recommendations for your workflow.
              </p>
            )}
          </div>

          {/* Breakdown Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Effort Levels */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Effort Distribution
              </h3>

              <div className="space-y-2 pt-1">
                {(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"] as const).map((lvl) => {
                  const count = effortCounts[lvl] || 0;
                  const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                  return (
                    <div key={lvl} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-zinc-300">{lvl}</span>
                        <span className="text-zinc-400 font-mono">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommended Models */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Recommended Models
              </h3>

              <div className="space-y-2 pt-1">
                {Object.entries(modelCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([name, count]) => {
                    const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                    return (
                      <div key={name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-200 truncate">{name}</span>
                          <span className="text-zinc-400 font-mono">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
