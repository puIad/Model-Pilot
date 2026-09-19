"use client";

import { TaskProfile as TaskProfileType } from "@/types";
import { ChevronDown, ChevronUp, Cpu, Database, GitBranch, Shield } from "lucide-react";
import { useState } from "react";

interface TaskProfileProps {
  profile: TaskProfileType;
  score: number;
}

export function TaskProfile({ profile, score }: TaskProfileProps) {
  const [showAllDimensions, setShowAllDimensions] = useState(false);

  const primaryDimensions = [
    { label: "Complexity", val: profile.complexity, color: "bg-blue-500" },
    { label: "Ambiguity", val: profile.ambiguity, color: "bg-amber-500" },
    { label: "Risk / Consequence", val: profile.consequence, color: "bg-rose-500" },
    { label: "Scope", val: profile.scope, color: "bg-indigo-500" },
  ];

  const secondaryDimensions = [
    { label: "Novelty", val: profile.novelty, color: "bg-purple-500" },
    { label: "Context Demand", val: profile.contextDemand, color: "bg-cyan-500" },
    { label: "Tool Demand", val: profile.toolDemand, color: "bg-emerald-500" },
    { label: "Verifiability", val: profile.verifiability, color: "bg-teal-500" },
  ];

  const renderBar = (val: number, colorClass: string) => {
    const percentage = Math.round((val / 10) * 100);
    return (
      <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden flex">
        <div
          className={`h-full ${colorClass} rounded-full`}
          style={{ width: `${Math.max(5, percentage)}%` }}
        />
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0e14] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200/80 dark:border-white/[0.06]">
        <div>
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 uppercase font-mono tracking-wider">
            <Cpu className="w-3.5 h-3.5 text-blue-500" />
            Task Diagnostic Dimensions
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{profile.summary}</p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-zinc-400">Score:</span>
          <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold text-zinc-800 dark:text-zinc-200">
            {score}/100
          </span>
        </div>
      </div>

      {/* Critical Modifiers Tags */}
      <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
        {profile.securitySensitive && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Shield className="w-3 h-3" />
            Security Sensitive
          </span>
        )}
        {profile.architectureChanging && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Database className="w-3 h-3" />
            Architecture Changing
          </span>
        )}
        {profile.largeCodebase && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <GitBranch className="w-3 h-3" />
            Large Monorepo
          </span>
        )}
        {profile.existingCodebase && !profile.largeCodebase && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <GitBranch className="w-3 h-3" />
            Existing Codebase
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 capitalize">
          Type: {profile.taskType}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-1">
        {primaryDimensions.map((dim) => (
          <div key={dim.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">{dim.label}</span>
              <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200 tabular-nums">{dim.val}/10</span>
            </div>
            {renderBar(dim.val, dim.color)}
          </div>
        ))}

        {showAllDimensions &&
          secondaryDimensions.map((dim) => (
            <div key={dim.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">{dim.label}</span>
                <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200 tabular-nums">{dim.val}/10</span>
              </div>
              {renderBar(dim.val, dim.color)}
            </div>
          ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setShowAllDimensions(!showAllDimensions)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
        >
          {showAllDimensions ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show fewer dimensions</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>View all 8 dimensions (Novelty, Context, Tools, Verifiability)</span>
            </>
          )}
        </button>
      </div>

      {/* Reasoning points */}
      {profile.reasoning && profile.reasoning.length > 0 && (
        <div className="pt-2 border-t border-zinc-200/80 dark:border-white/[0.06] space-y-1.5">
          <span className="text-[10px] uppercase font-mono font-bold text-zinc-500">
            Diagnostic Observations
          </span>
          <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            {profile.reasoning.map((r, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
