"use client";

import { AnalyzeButton } from "@/components/analyzer/analyze-button";
import { ContextSelector, ContextState } from "@/components/analyzer/context-selector";
import { PrioritySelector } from "@/components/analyzer/priority-selector";
import { TaskInput, TaskPreset } from "@/components/analyzer/task-input";
import { RecommendationCard } from "@/components/recommendation/recommendation-card";
import {
  getStoredModels,
  getStoredSettings,
  saveHistoryItem,
} from "@/lib/storage/local-storage";
import { HistoryItem, Recommendation, UserPriority } from "@/types";
import { AlertCircle, RotateCcw, ShieldCheck, Sparkles, Zap } from "lucide-react";
import React, { useState } from "react";

export default function Home() {
  const [taskText, setTaskText] = useState("");
  const [context, setContext] = useState<ContextState>({
    newProject: false,
    existingCodebase: true,
    largeCodebase: false,
  });
  const [priority, setPriority] = useState<UserPriority>("balanced");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeRecommendation, setActiveRecommendation] = useState<Recommendation | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!taskText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const customModels = getStoredModels();
      const settings = getStoredSettings();

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskText: taskText.trim(),
          context,
          priority,
          customModels,
          apiConfig: settings.apiConfig,
          providerEnabled: settings.providerEnabled,
          classifierMode: settings.classifierMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Task analysis failed. Please check your configuration.");
      }

      const rec: Recommendation = data.recommendation;
      const historyId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      setActiveRecommendation(rec);
      setActiveHistoryId(historyId);

      // Save to localStorage history
      const historyItem: HistoryItem = {
        id: historyId,
        timestamp: new Date().toISOString(),
        taskText: taskText.trim(),
        context,
        priority,
        recommendation: rec,
      };
      saveHistoryItem(historyItem);
      window.dispatchEvent(new Event("modelpilot_history_updated"));
    } catch (err: unknown) {
      console.error("Analysis error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Task analysis failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const handleSelectPreset = (preset: TaskPreset) => {
    setTaskText(preset.text);
    if (preset.context) {
      // A preset replaces the whole context so flags from an earlier preset cannot linger
      const largeCodebase = Boolean(preset.context.largeCodebase);
      const newProject = !largeCodebase && Boolean(preset.context.newProject);
      setContext({
        newProject,
        existingCodebase: !newProject && (largeCodebase || Boolean(preset.context.existingCodebase)),
        largeCodebase,
      });
    }
    setActiveRecommendation(null);
    setError(null);
  };

  const handleReset = () => {
    setTaskText("");
    setActiveRecommendation(null);
    setActiveHistoryId(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Product Header & Live Telemetry Strip */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Deterministic Engine
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero Provider Preference
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.08]">
            <Zap className="w-3.5 h-3.5" />
            Local Scoring Engine
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Model Recommendation & Effort Right-Sizing
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Evaluates task complexity, consequence, ambiguity, and verifiability to determine the minimum viable AI model and reasoning effort.
          </p>
        </div>
      </div>

      {/* Main Console Container */}
      <div className="rounded-2xl border border-zinc-200/90 dark:border-white/[0.08] bg-white dark:bg-[#0c0e14] p-5 sm:p-6 shadow-sm space-y-6">
        <TaskInput
          value={taskText}
          onChange={setTaskText}
          onKeyDown={handleKeyDown}
          onSelectPreset={handleSelectPreset}
          disabled={isLoading}
        />

        <ContextSelector
          value={context}
          onChange={setContext}
          disabled={isLoading}
        />

        <PrioritySelector
          value={priority}
          onChange={setPriority}
          disabled={isLoading}
        />

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={handleAnalyze}
              className="underline font-medium hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        <AnalyzeButton
          onClick={handleAnalyze}
          isLoading={isLoading}
          disabled={!taskText.trim()}
        />
      </div>

      {/* Results Section */}
      {activeRecommendation && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Recommendation Output
            </h2>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset & New Task</span>
            </button>
          </div>

          <RecommendationCard
            key={activeHistoryId ?? "active"}
            recommendation={activeRecommendation}
            historyId={activeHistoryId || undefined}
          />
        </div>
      )}
    </div>
  );
}
