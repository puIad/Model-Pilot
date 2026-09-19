"use client";

import { FolderGit2, HardDrive, PlusCircle } from "lucide-react";

export interface ContextState {
  newProject: boolean;
  existingCodebase: boolean;
  largeCodebase: boolean;
}

interface ContextSelectorProps {
  value: ContextState;
  onChange: (value: ContextState) => void;
  disabled?: boolean;
}

export function ContextSelector({ value, onChange, disabled }: ContextSelectorProps) {
  const toggleNewProject = () => {
    onChange({
      newProject: !value.newProject,
      existingCodebase: value.newProject ? value.existingCodebase : false,
      largeCodebase: value.newProject ? value.largeCodebase : false,
    });
  };

  const toggleExistingCodebase = () => {
    const nextExisting = !value.existingCodebase;
    onChange({
      newProject: nextExisting ? false : value.newProject,
      existingCodebase: nextExisting,
      largeCodebase: nextExisting ? value.largeCodebase : false,
    });
  };

  const toggleLargeCodebase = () => {
    const nextLarge = !value.largeCodebase;
    onChange({
      newProject: false,
      existingCodebase: nextLarge ? true : value.existingCodebase,
      largeCodebase: nextLarge,
    });
  };

  const options = [
    {
      id: "newProject",
      label: "Greenfield Project",
      description: "Clean codebase with zero legacy constraints or external patterns",
      active: value.newProject,
      icon: PlusCircle,
      onClick: toggleNewProject,
    },
    {
      id: "existingCodebase",
      label: "Existing Codebase",
      description: "Must conform to established style, architectural patterns, and tests",
      active: value.existingCodebase && !value.largeCodebase,
      icon: FolderGit2,
      onClick: toggleExistingCodebase,
    },
    {
      id: "largeCodebase",
      label: "Large Monorepo",
      description: "Deep dependency tree, multiple packages, or high context demand",
      active: value.largeCodebase,
      icon: HardDrive,
      onClick: toggleLargeCodebase,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Codebase Context
        </label>
        <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
          Context window & reasoning floor
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={opt.onClick}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer disabled:opacity-50 flex flex-col justify-between ${
                opt.active
                  ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-500/80 text-blue-950 dark:text-blue-100 ring-1 ring-blue-500/20"
                  : "bg-white dark:bg-[#0e1117] border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.04] hover:border-zinc-300 dark:hover:border-white/[0.15]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium flex items-center gap-1.5">
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      opt.active ? "text-blue-600 dark:text-blue-400" : "text-zinc-400"
                    }`}
                  />
                  {opt.label}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    opt.active
                      ? "bg-blue-500 ring-2 ring-blue-500/30"
                      : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                />
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                {opt.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
