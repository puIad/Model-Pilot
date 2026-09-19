import { classifyTask } from "@/lib/analyzer/classifier";
import { DEFAULT_MODELS } from "@/lib/models/catalog";
import { ContextSchema, parseModelList, UserPrioritySchema } from "@/lib/models/schema";
import { generateRecommendation } from "@/lib/recommendation/engine";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const MAX_TASK_LENGTH = 20000;

const ApiConfigSchema = z
  .object({
    apiKey: z.string().max(500).optional(),
    baseUrl: z.string().max(500).optional(),
    model: z.string().max(200).optional(),
  })
  .optional();

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Request body must be valid JSON.");
    }
    const input = (body ?? {}) as Record<string, unknown>;

    const taskText = typeof input.taskText === "string" ? input.taskText.trim() : "";
    if (!taskText) {
      return badRequest("Please provide a task description to analyze.");
    }
    if (taskText.length > MAX_TASK_LENGTH) {
      return badRequest(`Task description is too long (max ${MAX_TASK_LENGTH} characters).`);
    }

    const priority = UserPrioritySchema.safeParse(input.priority ?? "balanced");
    if (!priority.success) {
      return badRequest("Priority must be balanced, lowest_cost, highest_reliability or lowest_latency.");
    }

    const context = ContextSchema.safeParse(input.context ?? {});
    if (!context.success) {
      return badRequest("Context flags must be booleans.");
    }

    const apiConfig = ApiConfigSchema.safeParse(input.apiConfig);
    if (!apiConfig.success) {
      return badRequest("API configuration is malformed.");
    }

    const providerEnabledInput = input.providerEnabled;
    let providerEnabled: Record<string, boolean> | undefined;
    if (providerEnabledInput && typeof providerEnabledInput === "object") {
      providerEnabled = {};
      for (const [provider, value] of Object.entries(providerEnabledInput as Record<string, unknown>)) {
        if (typeof value === "boolean") providerEnabled[provider] = value;
      }
    }

    let modelsToUse = DEFAULT_MODELS;
    if (input.customModels !== undefined && input.customModels !== null) {
      const parsed = parseModelList(input.customModels);
      if (!parsed) {
        return badRequest("The model catalog is invalid. Reset it on the Catalog page and try again.");
      }
      modelsToUse = parsed;
    }

    // Classify task
    const { profile, source, fallbackReason, classifierConfidence } = await classifyTask(
      taskText,
      context.data,
      apiConfig.data,
      input.classifierMode === "jev" ? "jev" : "classifier"
    );

    // Generate deterministic recommendation
    const recommendation = generateRecommendation(profile, modelsToUse, priority.data, taskText, {
      classifierSource: source,
      classifierNote: fallbackReason,
      classifierConfidence,
      providerEnabled,
    });

    return NextResponse.json({
      profile,
      recommendation,
      source,
      fallbackReason,
    });
  } catch (error: unknown) {
    console.error("Task analysis error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during task analysis.",
      },
      { status: 500 }
    );
  }
}
