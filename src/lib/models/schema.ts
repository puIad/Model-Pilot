import { Model } from "@/types";
import { z } from "zod";

const score = z.number().min(0).max(10);

export const EffortLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]);
export const UserPrioritySchema = z.enum([
  "balanced",
  "lowest_cost",
  "highest_reliability",
  "lowest_latency",
]);

export const ModelSchema = z.object({
  id: z.string().min(1).max(120),
  provider: z.string().min(1).max(60),
  displayName: z.string().min(1).max(120),
  tier: z.enum(["budget", "standard", "frontier"]),
  strengths: z.array(z.string().max(200)).max(20).default([]),
  capabilities: z.object({
    coding: score,
    architecture: score,
    debugging: score,
    research: score,
    reasoning: score,
    agentic: score,
  }),
  capabilityMetadata: z.record(z.string(), z.unknown()).optional(),
  inputPricePerMillion: z.number().min(0).max(100000),
  outputPricePerMillion: z.number().min(0).max(100000),
  supportedEfforts: z.array(EffortLevelSchema).min(1).max(4),
  contextWindow: z.number().positive().max(1e9),
  speedRating: score,
  description: z.string().max(500).optional(),
  enabled: z.boolean().optional(),
  isLiveSynced: z.boolean().optional(),
  lastSyncedAt: z.string().max(60).optional(),
});

export const ModelListSchema = z.array(ModelSchema).min(1).max(200);

export const ContextSchema = z.object({
  newProject: z.boolean().optional(),
  existingCodebase: z.boolean().optional(),
  largeCodebase: z.boolean().optional(),
});

/** Parses untrusted model input. Returns null when it is not a valid catalog. */
export function parseModelList(input: unknown): Model[] | null {
  const parsed = ModelListSchema.safeParse(input);
  return parsed.success ? (parsed.data as Model[]) : null;
}
