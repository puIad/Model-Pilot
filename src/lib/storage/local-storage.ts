import { DEFAULT_MODELS } from "@/lib/models/catalog";
import { HistoryItem, Model, UserFeedback, UserSettings } from "@/types";

const HISTORY_STORAGE_KEY = "modelpilot_history_v1";
const SETTINGS_STORAGE_KEY = "modelpilot_settings_v1";
const MODELS_STORAGE_KEY = "modelpilot_custom_models_v1";

export function getStoredHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to load history from localStorage", e);
    return [];
  }
}

export function saveHistoryItem(item: HistoryItem): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredHistory();
    // Prepend new item, deduplicate by id, keep max 100
    const filtered = current.filter((h) => h.id !== item.id);
    const updated = [item, ...filtered].slice(0, 100);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save history item to localStorage", e);
  }
}

export function updateHistoryFeedback(itemId: string, feedback: UserFeedback): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredHistory();
    const updated = current.map((item) => {
      if (item.id === itemId) {
        return { ...item, feedback };
      }
      return item;
    });
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to update feedback in localStorage", e);
  }
}

export function deleteHistoryItem(itemId: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredHistory();
    const updated = current.filter((item) => item.id !== itemId);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to delete history item", e);
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear history", e);
  }
}

// Older versions of "Pull Live Models" imported every matching OpenRouter model (Opus 4, Haiku 3,
// Gemini 2.5 ...) with made-up capability scores. Those imports are flagged isLiveSynced and are
// not part of the default catalog, so they are removed. Models the user added by hand are kept.
function dropLegacySyncedModels(models: Model[]): Model[] {
  const defaultIds = new Set(DEFAULT_MODELS.map((m) => m.id));
  const cleaned = models.filter((m) => !(m.isLiveSynced && !defaultIds.has(m.id)));
  if (cleaned.length === models.length) return models;
  const result = cleaned.length > 0 ? cleaned : DEFAULT_MODELS;
  saveStoredModels(result);
  return result;
}

export function getStoredModels(): Model[] {
  if (typeof window === "undefined") return DEFAULT_MODELS;
  try {
    const raw = localStorage.getItem(MODELS_STORAGE_KEY);
    if (!raw) return DEFAULT_MODELS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_MODELS;
    return dropLegacySyncedModels(parsed);
  } catch (e) {
    console.error("Failed to load custom models", e);
    return DEFAULT_MODELS;
  }
}

export function saveStoredModels(models: Model[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MODELS_STORAGE_KEY, JSON.stringify(models));
  } catch (e) {
    console.error("Failed to save models", e);
  }
}

export function resetStoredModels(): Model[] {
  if (typeof window === "undefined") return DEFAULT_MODELS;
  try {
    localStorage.removeItem(MODELS_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to reset models", e);
  }
  return DEFAULT_MODELS;
}

export function getStoredSettings(): UserSettings {
  const defaultSettings: UserSettings = {
    theme: "dark",
    customModels: DEFAULT_MODELS,
    apiConfig: {
      baseUrl: "",
      apiKey: "",
      model: "",
    },
    providerEnabled: {},
    classifierMode: "classifier",
  };

  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    const merged: UserSettings = { ...defaultSettings, ...parsed };
    merged.apiConfig = { ...defaultSettings.apiConfig, ...(parsed.apiConfig ?? {}) };
    // The old default paired a Gemini model name with the OpenAI endpoint, which always failed.
    if (!merged.apiConfig.baseUrl?.trim() && merged.apiConfig.model === "gemini-2.5-flash") {
      merged.apiConfig.model = "";
    }
    return merged;
  } catch (e) {
    console.error("Failed to load settings", e);
    return defaultSettings;
  }
}

export function saveStoredSettings(settings: UserSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings", e);
  }
}
