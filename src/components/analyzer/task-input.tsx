"use client";

import { Sparkles, Terminal } from "lucide-react";
import React from "react";

export interface TaskPreset {
  title: string;
  category: string;
  text: string;
  context?: {
    newProject?: boolean;
    existingCodebase?: boolean;
    largeCodebase?: boolean;
  };
}

export const TEST_PRESETS: TaskPreset[] = [
  {
    title: "Typo in landing page",
    category: "Quick Edit",
    text: "Fix a typo and update button copy across landing page components.",
    context: { existingCodebase: true, largeCodebase: false },
  },
  {
    title: "Pure slugify unit tests",
    category: "Verifiable",
    text: "Write comprehensive unit tests with edge cases for a pure string slugify helper.",
    context: { existingCodebase: true, largeCodebase: false },
  },
  {
    title: "Zustand state migration",
    category: "Refactoring",
    text: "Migrate 25 Redux slices to Zustand stores with TypeScript type safety across our client app.",
    context: { existingCodebase: true, largeCodebase: true },
  },
  {
    title: "Multi-tenant RLS architecture",
    category: "Mission Critical",
    text: "Redesign our PostgreSQL database schemas to support row-level security multi-tenancy without breaking existing tenant data.",
    context: { existingCodebase: true, largeCodebase: true },
  },
  {
    title: "WebSocket race condition",
    category: "Concurrency",
    text: "Investigate and resolve an intermittent race condition where concurrent order settlement webhooks double-process balances.",
    context: { existingCodebase: true, largeCodebase: false },
  },
  {
    title: "Auth JWT key rotation audit",
    category: "Security",
    text: "Conduct a comprehensive security audit of our JWT authentication and automated public key rotation pipeline to eliminate privilege escalation paths.",
    context: { existingCodebase: true, largeCodebase: true },
  },
];

interface TaskInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSelectPreset: (preset: TaskPreset) => void;
  disabled?: boolean;
}

export function TaskInput({
  value,
  onChange,
  onKeyDown,
  onSelectPreset,
  disabled,
}: TaskInputProps) {
  const estimatedTokens = Math.ceil((value.trim().length || 0) / 4);

  return (
    <div className="space-y-3">
      {/* Console Frame */}
      <div className="rounded-xl border border-zinc-200/90 dark:border-white/[0.08] bg-white dark:bg-[#0c0e14] shadow-xs focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/20 transition-colors overflow-hidden">
        {/* Top Control Strip */}
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-200/80 dark:border-white/[0.06] bg-zinc-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <Terminal className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>Task Prompt & Requirements</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            <span>{value.length} chars</span>
            <span>•</span>
            <span>~{estimatedTokens} tokens</span>
            <span className="hidden sm:inline-block">
              <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-200/80 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-white/[0.1]">
                Ctrl/⌘ + Enter
              </kbd>
            </span>
          </div>
        </div>

        {/* Textarea Area */}
        <textarea
          id="task-input"
          rows={5}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Describe your engineering task in detail (e.g., 'Refactor our PostgreSQL connection pool to handle graceful failover with zero dropped queries during database cluster upgrades')..."
          className="w-full resize-y bg-transparent px-4 py-3.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-hidden leading-relaxed"
        />
      </div>

      {/* Preset Tasks Strip */}
      <div className="pt-0.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            Benchmark Task Presets
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">Select to test recommendation</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TEST_PRESETS.map((preset) => (
            <button
              key={preset.title}
              type="button"
              onClick={() => onSelectPreset(preset)}
              disabled={disabled}
              className="text-xs px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200/80 dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.12] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/70" />
              <span>{preset.title}</span>
              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                ({preset.category})
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
