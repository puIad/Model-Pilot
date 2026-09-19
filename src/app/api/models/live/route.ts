import { DEFAULT_MODELS } from "@/lib/models/catalog";
import { buildLiveUpdates, OpenRouterModel } from "@/lib/models/sync";
import { NextResponse } from "next/server";

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

/**
 * Returns live price and context-window updates for catalog models.
 * It never invents models or capability scores: only ids already in the catalog are matched.
 */
export async function GET() {
  try {
    const response = await fetch(OPENROUTER_MODELS_URL, {
      signal: AbortSignal.timeout(6000),
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter returned HTTP ${response.status}`);
    }

    const json = await response.json();
    const data: OpenRouterModel[] = Array.isArray(json?.data) ? json.data : [];
    const updates = buildLiveUpdates(
      data,
      DEFAULT_MODELS.map((m) => m.id)
    );

    if (updates.length === 0) {
      throw new Error("OpenRouter returned no pricing for any catalog model.");
    }

    return NextResponse.json({
      success: true,
      updates,
      unmatched: DEFAULT_MODELS.filter((m) => !updates.some((u) => u.id === m.id)).map((m) => m.id),
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.warn("Live model sync failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to pull live models",
      },
      { status: 502 }
    );
  }
}
