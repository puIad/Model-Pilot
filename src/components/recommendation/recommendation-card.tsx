"use client";

import { FeedbackWidget } from "@/components/feedback/feedback-widget";

import { getStoredModels } from "@/lib/storage/local-storage";

import { ModelPricing, Recommendation, UserFeedback } from "@/types";

import {
  AlertCircle,
  Check,
  ClipboardCopy,
  Coins,
  Cpu,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { Alternatives } from "./alternatives";

import { ConfidenceBadge } from "./confidence-badge";

import { DecisionTraceInspector } from "./decision-trace-inspector";

import { StrategyCard } from "./strategy-card";


interface RecommendationCardProps {
  recommendation: Recommendation;
  historyId?: string;
  initialFeedback?: UserFeedback;
  onFeedbackSaved?: (feedback: UserFeedback) => void;
}

/** CLI invocation for known agent CLIs; other providers get the bare model id. */
function cliFlagFor(provider: string, modelId: string): string {
  const p = provider.toLowerCase();
  if (p.includes("anthropic")) return `claude --model ${modelId}`;
  if (p.includes("google")) return `gemini --model ${modelId}`;
  if (p.includes("openai")) return `codex --model ${modelId}`;
  return modelId;
}

export function RecommendationCard({
  recommendation,
  historyId,
  initialFeedback,
  onFeedbackSaved,
}: RecommendationCardProps) {
  const [copiedType, setCopiedType] = useState<"text" | "cli" | null>(null);

  // Price and context come from the catalog used for this analysis. Older history items were saved
  // without them, so look the model up in the current catalog. Show "n/a" rather than guess.
  const pricing: ModelPricing | undefined =
    recommendation.modelPricing ??
    getStoredModels().find((m) => m.id === recommendation.modelId);
  const contextLabel = pricing?.contextWindow
    ? pricing.contextWindow >= 1_000_000
      ? `${(pricing.contextWindow / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
      : `${Math.round(pricing.contextWindow / 1000)}k`
    : "n/a";
  const savingsPct = recommendation.costBaseline?.savingsPercent ?? 0;
  const baselineName = recommendation.costBaseline?.modelName;

  const copyToClipboard = async () => {
    const text = `Recommended Model: ${recommendation.modelName} (${recommendation.provider})
Effort: ${recommendation.effort}
Confidence: ${recommendation.confidence.toUpperCase()} (${recommendation.confidenceScore}%)
Strategy: ${recommendation.strategyDetails.headline}

Reasoning:
${recommendation.reason}

Recommended Workflow:
${recommendation.strategyDetails.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.description}`).join("\n")}
${recommendation.cheaperAlternative ? `\nCheaper Alternative: ${recommendation.cheaperAlternative.modelName} (${recommendation.cheaperAlternative.effort}) - ${recommendation.cheaperAlternative.explanation}` : ""}
${recommendation.reliabilityAlternative ? `\nHigher Reliability: ${recommendation.reliabilityAlternative.modelName} (${recommendation.reliabilityAlternative.effort}) - ${recommendation.reliabilityAlternative.explanation}` : ""}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedType("text");
      setTimeout(() => setCopiedType(null), 2000);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  };

  const copyCliFlag = async () => {
    const flag = cliFlagFor(recommendation.provider, recommendation.modelId);

    try {
      await navigator.clipboard.writeText(flag);
      setCopiedType("cli");
      setTimeout(() => setCopiedType(null), 2000);
    } catch (e) {
      console.error("Failed to copy CLI flag", e);
    }
  };

  const effortLevels = ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"] as const;

  return (
    <div className="space-y-6">
      {/* Primary Hero Recommendation Instrument */}
      <div className="rounded-xl border border-zinc-200/80 dark:border-white/[0.1] bg-white dark:bg-[#0c0e14] shadow-sm overflow-hidden">
        {/* Instrument Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Optimal Configuration
            </span>
            <span className="text-xs font-mono text-zinc-500">
              Tier: <strong className="uppercase text-zinc-700 dark:text-zinc-300">{recommendation.tier}</strong>
            </span>
            {recommendation.classifierSource && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  recommendation.classifierSource === "jev"
                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                    : recommendation.classifierSource === "llm"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                }`}
                title={
                  recommendation.classifierSource === "jev" && recommendation.classifierConfidence !== undefined
                    ? `Jev classifier confidence: ${Math.round(recommendation.classifierConfidence * 100)}%`
                    : recommendation.classifierNote
                }
              >
                {recommendation.classifierSource === "jev"
                  ? "Classified by Jev"
                  : recommendation.classifierSource === "llm"
                  ? "Classified by LLM"
                  : "Keyword classifier"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ConfidenceBadge
              confidence={recommendation.confidence}
              score={recommendation.confidenceScore}
            />

            <button
              type="button"
              onClick={copyCliFlag}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] transition-colors cursor-pointer"
              title="Copy CLI invocation flag"
            >
              <Terminal className="w-3 h-3 text-zinc-400" />
              <span>{copiedType === "cli" ? "Copied!" : "CLI Flag"}</span>
            </button>

            <button
              type="button"
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] transition-colors cursor-pointer"
            >
              {copiedType === "text" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <ClipboardCopy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Core Model & Telemetry Readout */}
        <div className="p-5 sm:p-6 space-y-6">
          {recommendation.classifierSource === "jev" &&
            recommendation.classifierConfidence !== undefined &&
            recommendation.classifierConfidence < 0.7 &&
            recommendation.taskProfile.consequence >= 7 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Low classifier confidence ({Math.round(recommendation.classifierConfidence * 100)}%) on a
                  high-consequence task: consider adding detail to the task description. The reliability
                  alternative has been promoted above.
                </span>
              </div>
            )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
                <span>{recommendation.provider}</span>
                <span>•</span>
                <span>Context Window: {contextLabel}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {recommendation.modelName}
              </h2>
            </div>

            {/* Reasoning Effort Segmented Gauge */}
            <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/[0.08] space-y-1.5 min-w-[240px]">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">Reasoning Effort</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{recommendation.effort}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 pt-0.5">
                {effortLevels.map((lvl) => {
                  const isActive = recommendation.effort === lvl;
                  return (
                    <div
                      key={lvl}
                      className={`h-2 rounded-xs transition-colors ${
                        isActive
                          ? "bg-blue-500"
                          : "bg-zinc-200 dark:bg-zinc-800"
                      }`}
                      title={`Effort level: ${lvl}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] font-mono text-zinc-400 dark:text-zinc-500">
                <span>LOW</span>
                <span>MED</span>
                <span>HIGH</span>
                <span>V.HIGH</span>
              </div>
            </div>
          </div>

          {/* Economics & Diagnostic Readout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.06] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                  Token Pricing
                </span>
                <span className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {pricing
                    ? `$${pricing.inputPricePerMillion.toFixed(2)} / $${pricing.outputPricePerMillion.toFixed(2)}`
                    : "n/a"}
                </span>
                <span className="text-[10px] text-zinc-400 block">per 1M in / out tokens</span>
              </div>
              <Coins className="w-4 h-4 text-zinc-400" />
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.06] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                  Cost Efficiency
                </span>
                <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {savingsPct > 0 ? `~${savingsPct}% Savings` : "Top-priced option"}
                </span>
                <span className="text-[10px] text-zinc-400 block">
                  {baselineName ? `list price vs ${baselineName}` : "no price baseline saved"}
                </span>
              </div>
              <Zap className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.06] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                  Task Score
                </span>
                <span className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {recommendation.taskScore} <span className="text-xs font-normal text-zinc-400">/ 100</span>
                </span>
                <span className="text-[10px] text-zinc-400 block">Deterministic rating</span>
              </div>
              <Cpu className="w-4 h-4 text-zinc-400" />
            </div>
          </div>

          {/* Rationale Callout */}
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/[0.06] space-y-1.5">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Scoring Engine Rationale
            </span>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {recommendation.reason}
            </p>
          </div>
        </div>
      </div>

      {/* Decision Trace & Requirements Gate Inspector */}
      <DecisionTraceInspector
        taskRequirements={recommendation.taskRequirements}
        eliminatedModels={recommendation.eliminatedModels}
        eligibleModels={recommendation.eligibleModels}
        decisionTrace={recommendation.decisionTrace}
        taskProfile={recommendation.taskProfile}
        taskScore={recommendation.taskScore}
        classifier={{
          source: recommendation.classifierSource,
          confidence: recommendation.classifierConfidence,
        }}
      />

      {/* Execution Strategy Pipeline */}
      <StrategyCard strategyDetails={recommendation.strategyDetails} />

      {/* Alternative Recommendations */}
      <Alternatives
        cheaper={recommendation.cheaperAlternative}
        reliability={recommendation.reliabilityAlternative}
      />

      {/* Local Feedback Widget */}
      <FeedbackWidget
        historyId={historyId}
        initialFeedback={initialFeedback}
        onFeedbackSaved={onFeedbackSaved}
      />
    </div>
  );
}
