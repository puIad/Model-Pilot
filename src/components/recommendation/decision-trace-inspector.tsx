"use client";

import {
  DecisionTrace,
  EligibleModel,
  EliminatedModel,
  TaskProfile,
  TaskRequirements,
} from "@/types";

interface ClassifierInfo {
  source?: "jev" | "llm" | "fallback";
  confidence?: number;
}

import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
  Layers,
  ListFilter,
  ShieldCheck,
  Table,
} from "lucide-react";
import React, { useState } from "react";

interface DecisionTraceInspectorProps {
  taskRequirements?: TaskRequirements;
  eliminatedModels?: EliminatedModel[];
  eligibleModels?: EligibleModel[];
  decisionTrace?: DecisionTrace;
  taskProfile: TaskProfile;
  taskScore: number;
  classifier?: ClassifierInfo;
}

export function DecisionTraceInspector({
  taskRequirements,
  eliminatedModels,
  eligibleModels,
  decisionTrace,
  taskProfile,
  taskScore,
  classifier,
}: DecisionTraceInspectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"gate" | "candidates" | "profile">("gate");

  const eliminatedCount = eliminatedModels?.length || 0;
  const eligibleCount = eligibleModels?.length || 0;

  return (
    <div className="rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0e14] overflow-hidden">
      {/* Header Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <ListFilter className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Decision Trace & Requirements Gate
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                Layer B & C
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {eliminatedCount} models eliminated by hard requirements • {eligibleCount} eligible candidates evaluated
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
          <span>{isOpen ? "Hide Inspector" : "Inspect Logic"}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="border-t border-zinc-200/80 dark:border-white/[0.08] p-4 sm:p-5 space-y-4">
          {/* Inspector Tabs */}
          <div className="flex items-center gap-1.5 border-b border-zinc-200/80 dark:border-white/[0.08] pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("gate")}
              className={`px-3 py-1.2 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "gate"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-300 dark:border-zinc-700"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Hard Requirements Gate ({eliminatedCount} eliminated)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("candidates")}
              className={`px-3 py-1.2 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "candidates"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-300 dark:border-zinc-700"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Candidate Utility Matrix ({eligibleCount} ranked)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`px-3 py-1.2 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "profile"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-300 dark:border-zinc-700"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Layer A Diagnostics</span>
            </button>
          </div>

          {/* TAB 1: HARD REQUIREMENTS GATE */}
          {activeTab === "gate" && (
            <div className="space-y-4 text-xs">
              {/* Abstract Requirements Summary */}
              {taskRequirements && (
                <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                      Layer B Abstract Requirement Floors
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500">
                      Minimum Viable Intelligence: {taskRequirements.minimumViableIntelligence}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
                      <span className="text-zinc-400 block text-[10px]">Reasoning Req</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        {taskRequirements.reasoning}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
                      <span className="text-zinc-400 block text-[10px]">Coding Req</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        {taskRequirements.coding}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
                      <span className="text-zinc-400 block text-[10px]">Architecture Req</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        {taskRequirements.architecture}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
                      <span className="text-zinc-400 block text-[10px]">Minimum Effort</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {taskRequirements.minimumEffort}
                      </span>
                    </div>
                  </div>

                  {taskRequirements.rationale && taskRequirements.rationale.length > 0 && (
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-400">
                        Gate Rationale
                      </span>
                      <ul className="space-y-0.5 text-zinc-600 dark:text-zinc-400 text-[11px]">
                        {taskRequirements.rationale.map((r, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="text-blue-500">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Eliminated Models Table */}
              <div>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mb-2">
                  Eliminated Models (Failed Hard Requirements)
                </span>

                {eliminatedModels && eliminatedModels.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-mono text-[10px] uppercase border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                          <th className="py-2 px-3">Model</th>
                          <th className="py-2 px-3">Provider</th>
                          <th className="py-2 px-3">Failed Gate Condition</th>
                          <th className="py-2 px-3">Values</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {eliminatedModels.map((m, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                            <td className="py-2 px-3 font-medium text-zinc-800 dark:text-zinc-200">
                              {m.modelName}
                            </td>
                            <td className="py-2 px-3 text-zinc-500">{m.provider}</td>
                            <td className="py-2 px-3 text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>{m.reason}</span>
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-zinc-500">
                              {m.requiredValue !== undefined && m.modelValue !== undefined ? (
                                <span>
                                  Req: {m.requiredValue} vs Cap: {m.modelValue}
                                </span>
                              ) : (
                                "Requirement ceiling failed"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-900/40 text-zinc-500 text-xs text-center border border-zinc-200 dark:border-zinc-800">
                    No models were eliminated by the hard requirements gate.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CANDIDATE UTILITY MATRIX */}
          {activeTab === "candidates" && (
            <div className="space-y-3 text-xs">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                Eligible Candidate Models (Ranked by Priority Utility)
              </span>

              {eligibleModels && eligibleModels.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-mono text-[10px] uppercase border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="py-2 px-3">Rank</th>
                        <th className="py-2 px-3">Candidate</th>
                        <th className="py-2 px-3">Effort</th>
                        <th className="py-2 px-3">Match Quality</th>
                        <th className="py-2 px-3">Cost Index</th>
                        <th className="py-2 px-3">Speed</th>
                        <th className="py-2 px-3">Assessment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {eligibleModels.map((cand, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 ${
                            idx === 0 ? "bg-blue-50/50 dark:bg-blue-950/20 font-medium" : ""
                          }`}
                        >
                          <td className="py-2 px-3 font-mono font-bold text-zinc-500">
                            {idx === 0 ? (
                              <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                #1 WINNER
                              </span>
                            ) : (
                              `#${idx + 1}`
                            )}
                          </td>
                          <td className="py-2 px-3 text-zinc-800 dark:text-zinc-200">
                            {cand.modelName}
                          </td>
                          <td className="py-2 px-3 font-mono text-zinc-700 dark:text-zinc-300">
                            {cand.effort}
                          </td>
                          <td className="py-2 px-3 font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
                            {cand.matchQuality}
                          </td>
                          <td className="py-2 px-3 font-mono tabular-nums text-zinc-500">
                            {cand.costIndex.toFixed(1)}
                          </td>
                          <td className="py-2 px-3 font-mono tabular-nums text-zinc-500">
                            {cand.speedRating}/10
                          </td>
                          <td className="py-2 px-3 text-zinc-500 max-w-xs truncate" title={cand.reason}>
                            {cand.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-900/40 text-zinc-500 text-xs text-center border border-zinc-200 dark:border-zinc-800">
                  No candidate models evaluated.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LAYER A DIAGNOSTICS */}
          {activeTab === "profile" && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Deterministic Task Dimensions
                </span>
                <span className="font-mono text-zinc-500">
                  Total Task Score: <strong className="text-zinc-800 dark:text-zinc-200">{taskScore}</strong> / 100
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Complexity", val: taskProfile.complexity },
                  { label: "Consequence (Risk)", val: taskProfile.consequence },
                  { label: "Ambiguity", val: taskProfile.ambiguity },
                  { label: "Scope", val: taskProfile.scope },
                  { label: "Context Demand", val: taskProfile.contextDemand },
                  { label: "Novelty", val: taskProfile.novelty },
                  { label: "Tool Demand", val: taskProfile.toolDemand },
                  { label: "Verifiability", val: taskProfile.verifiability },
                ].map((dim) => (
                  <div
                    key={dim.label}
                    className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between"
                  >
                    <span className="text-zinc-500">{dim.label}</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {dim.val} / 10
                    </span>
                  </div>
                ))}
              </div>

              {classifier?.source === "jev" && classifier.confidence !== undefined && (
                <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-500">
                    Jev Classifier Confidence
                    <span className="block text-[10px] text-zinc-400">
                      Min over consequence, ambiguity, complexity, task type
                    </span>
                  </span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {Math.round(classifier.confidence * 100)}%
                  </span>
                </div>
              )}

              {decisionTrace?.certaintyExplanation && (
                <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-[11px] text-blue-900 dark:text-blue-300">
                  <strong>Certainty Context:</strong> {decisionTrace.certaintyExplanation}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
