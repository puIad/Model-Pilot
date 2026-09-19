"use client";

import { CatalogEditor } from "@/components/models/catalog-editor";
import { getStoredModels, getStoredSettings, saveStoredSettings } from "@/lib/storage/local-storage";
import { ClassifierMode, UserSettings } from "@/types";
import {
  ArrowRight,
  Check,
  Gauge,
  Key,
  Save,
  Server,
  Settings,
  ShieldCheck,
  ToggleLeft,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const fieldClass =
  "w-full bg-white dark:bg-zinc-950/60 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-blue-500 font-mono";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    theme: "dark",
    customModels: [],
    apiConfig: {
      baseUrl: "",
      apiKey: "",
      model: "",
    },
    providerEnabled: {},
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [providers, setProviders] = useState<string[]>([]);
  const [jevEnabled, setJevEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    // Hydrate from localStorage after mount: it does not exist during server rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(getStoredSettings());
    setProviders(Array.from(new Set(getStoredModels().map((m) => m.provider))).sort());

    fetch("/api/classifier/status")
      .then((r) => r.json())
      .then((data) => setJevEnabled(Boolean(data.jevEnabled)))
      .catch(() => setJevEnabled(false));
  }, []);

  const toggleProvider = (provider: string, enabled: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, providerEnabled: { ...prev.providerEnabled, [provider]: enabled } };
      saveStoredSettings(next);
      return next;
    });
  };

  const setClassifierMode = (mode: ClassifierMode) => {
    setSettings((prev) => {
      const next = { ...prev, classifierMode: mode };
      saveStoredSettings(next);
      return next;
    });
  };

  const handleSaveApiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const isMockFallback = !settings.apiConfig.apiKey?.trim();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Settings & Model Catalog
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Configure models, pricing tiers, and optional LLM classification endpoints
            </p>
          </div>
        </div>
      </div>

      {/* Recommendation Calibration Lab Promo Card */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-50/60 dark:bg-gradient-to-r dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-zinc-900/40 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
            Developer Validation Suite
          </span>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Recommendation Calibration Lab
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Run the scoring engine against curated golden tasks, logical invariants (risk, ambiguity, scope monotonicity, safety floors), blind provider tests, and randomized stress permutations. Results are computed when you open the lab.
          </p>
        </div>

        <Link
          href="/settings/calibration"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 transition-all shrink-0"
        >
          <Gauge className="w-3.5 h-3.5" />
          Open Calibration Lab
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </Link>
      </div>

      {/* LLM Classifier Connection Section */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800/60">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              LLM Classification Provider
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Task interpretation uses this endpoint. The final recommendation is always produced deterministically.
            </p>
          </div>

          <div>
            {isMockFallback ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Keyword Fallback Active (Zero Setup Needed)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                <Key className="w-3.5 h-3.5" />
                Custom API Key Configured
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveApiConfig} className="space-y-4 pt-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                Base URL (OpenAI-compatible)
              </label>
              <input
                type="text"
                placeholder="https://api.openai.com/v1"
                value={settings.apiConfig.baseUrl}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    apiConfig: { ...settings.apiConfig, baseUrl: e.target.value },
                  })
                }
                className={fieldClass}
              />
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                API Key (Stored locally in browser)
              </label>
              <input
                type="password"
                placeholder="sk-..."
                value={settings.apiConfig.apiKey}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    apiConfig: { ...settings.apiConfig, apiKey: e.target.value },
                  })
                }
                className={fieldClass}
              />
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                Model Name
              </label>
              <input
                type="text"
                placeholder="gpt-4o-mini"
                value={settings.apiConfig.model}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    apiConfig: { ...settings.apiConfig, model: e.target.value },
                  })
                }
                className={fieldClass}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Leave the key blank to run ModelPilot with the keyword classifier. With a non-OpenAI Base URL, set the model name that endpoint expects.
            </p>

            <div className="flex items-center gap-3 shrink-0">
              {savedSuccess && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium animate-fadeIn">
                  <Check className="w-3.5 h-3.5" />
                  API Settings Saved
                </span>
              )}
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save API Config</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* TypeSafe (Jev) Status Card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              TypeSafe (Jev)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Choose which engine interprets your task. Jev needs the server key; if it fails,
              the LLM/keyword classifier is used instead.
              The key lives only in the server environment (<code>TYPESAFE_API_KEY</code>) and is
              never sent to the browser.
            </p>
          </div>
          {jevEnabled === null ? (
            <span className="text-xs text-zinc-400">Checking...</span>
          ) : jevEnabled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 shrink-0">
              <Key className="w-3.5 h-3.5" />
              Server key present
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.08] shrink-0">
              Not configured
            </span>
          )}
        </div>

        <div className="flex gap-2" role="radiogroup" aria-label="Classifier">
          {(
            [
              ["classifier", "Classifier (LLM / keyword)"],
              ["jev", "Jev"],
            ] as const
          ).map(([mode, label]) => {
            const active = (settings.classifierMode ?? "classifier") === mode;
            const disabled = mode === "jev" && jevEnabled === false;
            return (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => setClassifierMode(mode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  disabled ? "opacity-50 cursor-not-allowed " : "cursor-pointer "
                }${
                  active
                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                    : "bg-zinc-100 dark:bg-white/[0.05] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Per-Provider On/Off Switches */}
      {providers.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ToggleLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Providers
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Turn a provider off to exclude all of its models from recommendations, on top of the
              per-model toggle in the catalog below.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {providers.map((provider) => {
              const enabled = settings.providerEnabled?.[provider] !== false;
              return (
                <button
                  key={provider}
                  type="button"
                  onClick={() => toggleProvider(provider, !enabled)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    enabled
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-zinc-100 dark:bg-white/[0.05] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08]"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${enabled ? "bg-emerald-500" : "bg-zinc-400"}`} />
                  {provider}
                  <span className="text-[10px] opacity-70">{enabled ? "On" : "Off"}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Model Catalog Table & Editor */}
      <CatalogEditor />
    </div>
  );
}
