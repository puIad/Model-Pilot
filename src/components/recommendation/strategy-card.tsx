"use client";

import { StrategyDetails } from "@/types";
import { ArrowRight, GitFork, Workflow } from "lucide-react";

interface StrategyCardProps {
  strategyDetails: StrategyDetails;
}

export function StrategyCard({ strategyDetails }: StrategyCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0e14] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200/80 dark:border-white/[0.06]">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <Workflow className="w-3.5 h-3.5" />
            Execution Strategy
          </span>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {strategyDetails.name}
          </h3>
        </div>

        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20 font-medium">
          {strategyDetails.headline}
        </span>
      </div>

      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {strategyDetails.description}
      </p>

      {/* Visual Workflow Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {strategyDetails.steps.map((step, idx) => (
          <div
            key={idx}
            className="rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.06] p-3.5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  {idx + 1}
                </span>
                {idx < strategyDetails.steps.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 hidden md:block" />
                )}
              </div>
              <h5 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{step.title}</h5>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                {step.description}
              </p>
            </div>

            {step.modelRole && (
              <div className="mt-3 pt-2 border-t border-zinc-200/80 dark:border-white/[0.06] text-[10px] text-blue-600 dark:text-blue-400 font-mono flex items-center gap-1">
                <GitFork className="w-3 h-3 text-blue-500 shrink-0" />
                <span className="truncate">{step.modelRole}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
