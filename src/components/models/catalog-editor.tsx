"use client";

import { applyLiveUpdates, LivePriceUpdate } from "@/lib/models/sync";
import {
  getStoredModels,
  resetStoredModels,
  saveStoredModels,
} from "@/lib/storage/local-storage";
import { EffortLevel, Model, ModelTier } from "@/types";
import {
  Check,
  Edit2,
  Globe,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const CAPABILITY_KEYS = [
  "coding",
  "architecture",
  "debugging",
  "research",
  "reasoning",
  "agentic",
] as const;

const EFFORT_ORDER: EffortLevel[] = ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"];

function newBlankModel(): Model {
  return {
    id: "",
    provider: "Custom",
    displayName: "New model",
    tier: "standard",
    strengths: [],
    capabilities: { coding: 7, architecture: 7, debugging: 7, research: 7, reasoning: 7, agentic: 7 },
    inputPricePerMillion: 1,
    outputPricePerMillion: 5,
    supportedEfforts: ["LOW", "MEDIUM", "HIGH"],
    contextWindow: 200000,
    speedRating: 7,
    enabled: true,
  };
}

/** Empty or invalid input keeps the old value; 0 is a valid number. */
function numberOr(value: unknown, fallback: number): number {
  if (value === "" || value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const inputClass =
  "w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500";

export function CatalogEditor() {
  const [models, setModels] = useState<Model[]>([]);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [isNewModel, setIsNewModel] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Model>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isPullingLive, setIsPullingLive] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"all" | "gemini" | "claude" | "live">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hydrate from localStorage after mount: it does not exist during server rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModels(getStoredModels());
  }, []);

  const isEditing = editingModelId !== null;
  useEffect(() => {
    if (isEditing) {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isEditing]);

  const triggerSaved = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const persist = (updated: Model[]) => {
    setModels(updated);
    saveStoredModels(updated);
    triggerSaved();
  };

  const handleToggleEnabled = (id: string) => {
    persist(models.map((m) => (m.id === id ? { ...m, enabled: m.enabled === false } : m)));
  };

  const handleStartEdit = (model: Model) => {
    setIsNewModel(false);
    setFormError(null);
    setEditingModelId(model.id);
    setEditForm({ ...model, capabilities: { ...model.capabilities } });
  };

  const handleStartAdd = () => {
    const blank = newBlankModel();
    setIsNewModel(true);
    setFormError(null);
    setEditingModelId(blank.id);
    setEditForm(blank);
  };

  const handleCancelEdit = () => {
    setEditingModelId(null);
    setIsNewModel(false);
    setFormError(null);
    setEditForm({});
  };

  const handleDelete = (model: Model) => {
    if (models.length <= 1) {
      setSyncNotice("The catalog needs at least one model.");
      setTimeout(() => setSyncNotice(null), 3000);
      return;
    }
    if (!confirm(`Delete "${model.displayName}" from the catalog?`)) return;
    persist(models.filter((m) => m.id !== model.id));
    if (editingModelId === model.id) handleCancelEdit();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingModelId === null) return;

    const displayName = (editForm.displayName ?? "").trim();
    if (!displayName) {
      setFormError("Display name is required.");
      return;
    }

    const existing = isNewModel ? undefined : models.find((m) => m.id === editingModelId);
    const base = existing ?? newBlankModel();

    const id = isNewModel ? (editForm.id ?? "").trim() : editingModelId;
    if (isNewModel) {
      if (!id) {
        setFormError("Model id is required.");
        return;
      }
      if (models.some((m) => m.id.toLowerCase() === id.toLowerCase())) {
        setFormError(`A model with id "${id}" already exists.`);
        return;
      }
    }

    const caps = editForm.capabilities ?? base.capabilities;
    const saved: Model = {
      ...base,
      ...editForm,
      id,
      displayName,
      provider: (editForm.provider ?? base.provider).trim() || base.provider,
      inputPricePerMillion: Math.max(0, numberOr(editForm.inputPricePerMillion, base.inputPricePerMillion)),
      outputPricePerMillion: Math.max(0, numberOr(editForm.outputPricePerMillion, base.outputPricePerMillion)),
      contextWindow: Math.max(1000, numberOr(editForm.contextWindow, base.contextWindow)),
      speedRating: clamp(numberOr(editForm.speedRating, base.speedRating), 0, 10),
      supportedEfforts: [...(editForm.supportedEfforts ?? base.supportedEfforts)].sort(
        (a, b) => EFFORT_ORDER.indexOf(a) - EFFORT_ORDER.indexOf(b)
      ),
      capabilities: {
        coding: clamp(numberOr(caps.coding, base.capabilities.coding), 0, 10),
        architecture: clamp(numberOr(caps.architecture, base.capabilities.architecture), 0, 10),
        debugging: clamp(numberOr(caps.debugging, base.capabilities.debugging), 0, 10),
        research: clamp(numberOr(caps.research, base.capabilities.research), 0, 10),
        reasoning: clamp(numberOr(caps.reasoning, base.capabilities.reasoning), 0, 10),
        agentic: clamp(numberOr(caps.agentic, base.capabilities.agentic), 0, 10),
      },
    };

    persist(isNewModel ? [...models, saved] : models.map((m) => (m.id === editingModelId ? saved : m)));
    handleCancelEdit();
  };

  const handleResetDefaults = () => {
    if (confirm("Reset model catalog to default configurations? Any custom edits will be reverted.")) {
      const reset = resetStoredModels();
      setModels(reset);
      handleCancelEdit();
      triggerSaved();
    }
  };

  const handleToggleEffort = (effort: EffortLevel) => {
    const current = editForm.supportedEfforts ?? [];
    const next = current.includes(effort)
      ? current.filter((e) => e !== effort)
      : [...current, effort];

    if (next.length > 0) {
      setEditForm({ ...editForm, supportedEfforts: next });
    }
  };

  const handlePullLiveModels = async () => {
    setIsPullingLive(true);
    setSyncNotice(null);
    try {
      const res = await fetch("/api/models/live");
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success || !Array.isArray(data.updates)) {
        throw new Error(data?.error || "Failed to pull live pricing");
      }

      const updates: LivePriceUpdate[] = data.updates;
      const { models: synced, updatedIds } = applyLiveUpdates(
        models,
        updates,
        data.timestamp || new Date().toISOString()
      );

      persist(synced);
      const untouched = models.length - updatedIds.length;
      setSyncNotice(
        `Updated live pricing and context for ${updatedIds.length} model${updatedIds.length === 1 ? "" : "s"}.` +
          (untouched > 0 ? ` ${untouched} not listed on OpenRouter were left unchanged.` : "")
      );
      setTimeout(() => setSyncNotice(null), 6000);
    } catch (err: unknown) {
      console.error(err);
      setSyncNotice(
        `Live sync failed: ${err instanceof Error ? err.message : "unknown error"}. Your catalog was not changed.`
      );
      setTimeout(() => setSyncNotice(null), 6000);
    } finally {
      setIsPullingLive(false);
    }
  };

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.displayName.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterTab === "gemini") {
        return m.provider.toLowerCase() === "google" || m.id.toLowerCase().includes("gemini");
      }

      if (filterTab === "claude") {
        return (
          m.provider.toLowerCase() === "anthropic" ||
          m.id.toLowerCase().includes("claude") ||
          m.id.toLowerCase().includes("sonnet") ||
          m.id.toLowerCase().includes("opus") ||
          m.id.toLowerCase().includes("haiku")
        );
      }

      if (filterTab === "live") {
        return Boolean(m.isLiveSynced);
      }

      return true;
    });
  }, [models, filterTab, searchQuery]);

  const geminiCount = useMemo(() => {
    return models.filter(
      (m) => m.provider.toLowerCase() === "google" || m.id.toLowerCase().includes("gemini")
    ).length;
  }, [models]);

  const claudeCount = useMemo(() => {
    return models.filter(
      (m) =>
        m.provider.toLowerCase() === "anthropic" ||
        m.id.toLowerCase().includes("claude") ||
        m.id.toLowerCase().includes("sonnet") ||
        m.id.toLowerCase().includes("opus") ||
        m.id.toLowerCase().includes("haiku")
    ).length;
  }, [models]);

  const liveCount = useMemo(() => {
    return models.filter((m) => Boolean(m.isLiveSynced)).length;
  }, [models]);

  const tabClass = (active: boolean, accent: string) =>
    `px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
      active
        ? `bg-white dark:bg-zinc-900 ${accent} shadow-xs font-semibold`
        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
    }`;

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Model Catalog & Pricing Matrix
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage model pricing, capability scores, context windows, and live-synced pricing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {savedNotice && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium animate-fadeIn">
              <Check className="w-3.5 h-3.5" />
              Saved to localStorage
            </span>
          )}

          <button
            type="button"
            onClick={handleStartAdd}
            className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-400" />
            <span>Add Model</span>
          </button>

          <button
            type="button"
            onClick={handlePullLiveModels}
            disabled={isPullingLive}
            className="px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Update prices and context windows of catalog models from OpenRouter. Capability scores are never changed."
          >
            {isPullingLive ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isPullingLive ? "Syncing..." : "Sync Live Pricing"}</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Reset Catalog</span>
          </button>
        </div>
      </div>

      {/* Sync notification banner */}
      {syncNotice && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={tabClass(filterTab === "all", "text-zinc-900 dark:text-zinc-100")}
          >
            All ({models.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("gemini")}
            className={tabClass(filterTab === "gemini", "text-blue-600 dark:text-blue-400")}
          >
            Gemini ({geminiCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("claude")}
            className={tabClass(filterTab === "claude", "text-purple-600 dark:text-purple-400")}
          >
            Claude ({claudeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("live")}
            className={tabClass(filterTab === "live", "text-emerald-600 dark:text-emerald-400")}
          >
            Live Synced ({liveCount})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search models or providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      {/* Models Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">In / Out ($ / 1M)</th>
                <th className="px-4 py-3">Context</th>
                <th className="px-4 py-3">Effort Levels</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-800 dark:text-zinc-300">
              {filteredModels.map((model) => {
                const contextFormatted =
                  model.contextWindow >= 1000000
                    ? `${(model.contextWindow / 1000000).toFixed(1).replace(/\.0$/, "")}M`
                    : `${Math.round(model.contextWindow / 1000)}k`;

                return (
                  <tr
                    key={model.id}
                    className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/70 transition-colors ${
                      model.enabled === false ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={model.enabled !== false}
                        onChange={() => handleToggleEnabled(model.id)}
                        aria-label={`Enable ${model.displayName}`}
                        className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {model.displayName}
                        </span>
                        {model.isLiveSynced && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Synced
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>{model.id}</span>
                        {model.lastSyncedAt && (
                          <span className="text-[10px] text-zinc-400">
                            • Synced {new Date(model.lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium border border-zinc-200 dark:border-zinc-700">
                        {model.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                          model.tier === "frontier"
                            ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                            : model.tier === "standard"
                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                        }`}
                      >
                        {model.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-800 dark:text-zinc-200 font-medium whitespace-nowrap">
                      ${model.inputPricePerMillion.toFixed(2)} / ${model.outputPricePerMillion.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400 text-[11px]">
                      {contextFormatted} tokens
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {model.supportedEfforts.map((eff) => (
                          <span
                            key={eff}
                            className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono text-zinc-700 dark:text-zinc-300"
                          >
                            {eff}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(model)}
                        className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(model)}
                        aria-label={`Delete ${model.displayName}`}
                        title="Delete model"
                        className="ml-1.5 p-1.5 rounded text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer align-middle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inline Editor Panel */}
      {isEditing && (
        <div
          ref={editorRef}
          className="rounded-2xl border border-blue-500/40 bg-white dark:bg-zinc-950 p-6 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {isNewModel ? "Add Model" : `Edit Model: ${editForm.displayName}`}
            </h4>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {isNewModel && (
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Model ID</label>
                <input
                  type="text"
                  value={editForm.id || ""}
                  placeholder="e.g. gpt-5-mini"
                  onChange={(e) => setEditForm({ ...editForm, id: e.target.value })}
                  className={`${inputClass} font-mono`}
                />
              </div>
            )}

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Display Name</label>
              <input
                type="text"
                value={editForm.displayName || ""}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Provider</label>
              <input
                type="text"
                value={editForm.provider || ""}
                onChange={(e) => setEditForm({ ...editForm, provider: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Tier</label>
              <select
                value={editForm.tier || "standard"}
                onChange={(e) => setEditForm({ ...editForm, tier: e.target.value as ModelTier })}
                className={inputClass}
              >
                <option value="budget">Budget</option>
                <option value="standard">Standard</option>
                <option value="frontier">Frontier</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Speed Rating (0-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={editForm.speedRating ?? ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    speedRating: e.target.value === "" ? undefined : parseFloat(e.target.value),
                  })
                }
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">
                Context Window (tokens)
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={editForm.contextWindow ?? ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    contextWindow: e.target.value === "" ? undefined : parseFloat(e.target.value),
                  })
                }
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">
                Input Price / 1M tokens ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editForm.inputPricePerMillion ?? ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    inputPricePerMillion: e.target.value === "" ? undefined : parseFloat(e.target.value),
                  })
                }
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">
                Output Price / 1M tokens ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editForm.outputPricePerMillion ?? ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    outputPricePerMillion: e.target.value === "" ? undefined : parseFloat(e.target.value),
                  })
                }
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1">
                Supported Efforts
              </label>
              <div className="flex gap-1.5 pt-1">
                {EFFORT_ORDER.map((eff) => {
                  const active = editForm.supportedEfforts?.includes(eff);
                  return (
                    <button
                      key={eff}
                      type="button"
                      onClick={() => handleToggleEffort(eff)}
                      className={`px-2 py-1 rounded text-[10px] font-mono border cursor-pointer ${
                        active
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {eff}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Capability scores */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Capability Scores (0-10)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
              {CAPABILITY_KEYS.map((key) => (
                <div key={key}>
                  <label className="block text-zinc-600 dark:text-zinc-400 mb-1 capitalize">{key}</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={editForm.capabilities?.[key] ?? ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        capabilities: {
                          ...(editForm.capabilities as Model["capabilities"]),
                          [key]: e.target.value === "" ? undefined : parseFloat(e.target.value),
                        } as Model["capabilities"],
                      })
                    }
                    className={`${inputClass} font-mono`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
            >
              {isNewModel ? "Add Model" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
