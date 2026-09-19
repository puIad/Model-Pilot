import { Model } from "@/types";

export interface OpenRouterModel {
  id: string;
  name?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

export interface LivePriceUpdate {
  id: string;
  openRouterId: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  contextWindow?: number;
}

/**
 * Normalises a provider model id so OpenRouter ("anthropic/claude-haiku-4.5")
 * and catalog ("claude-haiku-4-5") spellings compare equal.
 * Returns null for variants such as ":batch" or ":free", which have different pricing.
 */
export function normalizeModelId(raw: string): string | null {
  const id = raw.trim().toLowerCase().replace(/^~/, "");
  if (id.includes(":")) return null;
  const slash = id.lastIndexOf("/");
  const bare = slash >= 0 ? id.slice(slash + 1) : id;
  return bare.replace(/\./g, "-");
}

function perMillion(perToken: string | undefined): number | null {
  const value = parseFloat(perToken ?? "");
  // OpenRouter uses negative prices for routers with no fixed price.
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 1e6 * 100) / 100;
}

/**
 * Picks price/context updates for catalog models only. Models that are not in the
 * catalog are never imported: their capability scores cannot be known from a price feed.
 */
export function buildLiveUpdates(
  data: OpenRouterModel[],
  catalogIds: Iterable<string>
): LivePriceUpdate[] {
  const wanted = new Set(Array.from(catalogIds, (id) => id.toLowerCase()));
  const updates = new Map<string, LivePriceUpdate>();

  for (const entry of data) {
    if (typeof entry?.id !== "string") continue;
    const normalized = normalizeModelId(entry.id);
    if (!normalized || !wanted.has(normalized) || updates.has(normalized)) continue;

    const input = perMillion(entry.pricing?.prompt);
    const output = perMillion(entry.pricing?.completion);
    if (input === null || output === null) continue;

    updates.set(normalized, {
      id: normalized,
      openRouterId: entry.id,
      inputPricePerMillion: input,
      outputPricePerMillion: output,
      contextWindow:
        typeof entry.context_length === "number" && entry.context_length > 0
          ? entry.context_length
          : undefined,
    });
  }

  return Array.from(updates.values());
}

/** Applies price/context updates only. Capability scores and user edits stay untouched. */
export function applyLiveUpdates(
  models: Model[],
  updates: LivePriceUpdate[],
  syncedAt: string
): { models: Model[]; updatedIds: string[] } {
  const byId = new Map(updates.map((u) => [u.id, u]));
  const updatedIds: string[] = [];

  const next = models.map((model) => {
    const update = byId.get(model.id.toLowerCase());
    if (!update) return model;
    updatedIds.push(model.id);
    return {
      ...model,
      inputPricePerMillion: update.inputPricePerMillion,
      outputPricePerMillion: update.outputPricePerMillion,
      contextWindow: update.contextWindow ?? model.contextWindow,
      isLiveSynced: true,
      lastSyncedAt: syncedAt,
    };
  });

  return { models: next, updatedIds };
}
