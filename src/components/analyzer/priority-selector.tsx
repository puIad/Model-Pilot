"use client";

import { UserPriority } from "@/types";
import { Coins, Gauge, Scale, ShieldCheck } from "lucide-react";

interface PrioritySelectorProps {
  value: UserPriority;
  onChange: (priority: UserPriority) => void;
  disabled?: boolean;
}

export function PrioritySelector({ value, onChange, disabled }: PrioritySelectorProps) {
  const priorities: {
    id: UserPriority;
    label: string;
    description: string;
    icon: typeof Scale;
    badge: string;
  }[] = [
    {
      id: "balanced",
      label: "Balanced",
      description: "Standard developer trade-off: reliable delivery at reasonable cost",
      icon: Scale,
      badge: "Standard",
    },
    {
      id: "lowest_cost",
      label: "Lowest Cost",
      description: "Aggressively minimizes token spend; upgrades only when required",
      icon: Coins,
      badge: "Budget",
    },
    {
      id: "highest_reliability",
      label: "High Reliability",
      description: "Maximizes reasoning depth; eliminates risk for mission-critical code",
      icon: ShieldCheck,
      badge: "Zero Defect",
    },
    {
      id: "lowest_latency",
      label: "Low Latency",
      description: "Prioritizes swift throughput and minimal thinking overhead",
      icon: Gauge,
      badge: "Fastest",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Optimization Objective
        </label>
        <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
          Utility function weighting
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {priorities.map((item) => {
          const Icon = item.icon;
          const isSelected = value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(item.id)}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer disabled:opacity-50 relative flex flex-col justify-between ${
                isSelected
                  ? "bg-zinc-100 dark:bg-white/[0.07] border-zinc-400 dark:border-white/[0.25] text-zinc-900 dark:text-zinc-100 ring-1 ring-zinc-300 dark:ring-white/[0.15]"
                  : "bg-white dark:bg-[#0e1117] border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/[0.04] hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-white/[0.15]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium flex items-center gap-1.5 text-zinc-900 dark:text-zinc-200">
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isSelected ? "text-blue-500 dark:text-blue-400" : "text-zinc-400"
                      }`}
                    />
                    {item.label}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-zinc-200/80 dark:border-white/[0.06] flex items-center justify-between text-[10px]">
                <span
                  className={`font-mono uppercase font-medium ${
                    isSelected ? "text-blue-600 dark:text-blue-400" : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {item.badge}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
