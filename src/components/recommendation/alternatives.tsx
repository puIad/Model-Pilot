"use client";

import { AlternativeOption } from "@/types";
import { ArrowDownRight, ArrowUpRight, DollarSign, ShieldAlert } from "lucide-react";

interface AlternativesProps {
  cheaper?: AlternativeOption;
  reliability?: AlternativeOption;
}

export function Alternatives({ cheaper, reliability }: AlternativesProps) {
  if (!cheaper && !reliability) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Cheaper Option */}
      {cheaper ? (
        <div className="rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0e14] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5" />
                Cheaper Alternative
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Cost: {cheaper.relativeCost}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{cheaper.modelName}</h4>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                {cheaper.effort} Effort
              </span>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed">
              {cheaper.explanation}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-200/80 dark:border-white/[0.06] text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-500" />
            <span>Optimal if requirements are thoroughly constrained or risk is negligible.</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200/50 dark:border-white/[0.04] bg-zinc-50 dark:bg-zinc-900/20 p-4 flex items-center justify-center text-xs text-zinc-400 font-mono">
          Already at lowest cost configuration
        </div>
      )}

      {/* Reliability Option */}
      {reliability ? (
        <div className="rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0e14] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Higher Reliability Alternative
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Cost: {reliability.relativeCost}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{reliability.modelName}</h4>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                {reliability.effort} Effort
              </span>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed">
              {reliability.explanation}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-200/80 dark:border-white/[0.06] text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-blue-500" />
            <span>Recommended if failure recovery or debugging time exceeds model cost.</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200/50 dark:border-white/[0.04] bg-zinc-50 dark:bg-zinc-900/20 p-4 flex items-center justify-center text-xs text-zinc-400 font-mono">
          Already at maximum reasoning configuration
        </div>
      )}
    </div>
  );
}
