import { NextRequest } from "next/server";
import { POST as analyzePost } from "./src/app/api/analyze/route";
import { classifyTask } from "./src/lib/analyzer/classifier";
import { classifyTaskDeterministic } from "./src/lib/analyzer/fallback-classifier";
import { classifyTaskWithJev } from "./src/lib/analyzer/jev-classifier";
import { DEFAULT_MODELS } from "./src/lib/models/catalog";
import { applyLiveUpdates, buildLiveUpdates, normalizeModelId } from "./src/lib/models/sync";
import { generateRecommendation } from "./src/lib/recommendation/engine";
import { Model } from "./src/types";

let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    console.log(`  ✔ ${name}`);
  } else {
    failed++;
    console.log(`  ✘ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function model(overrides: Partial<Model> & Pick<Model, "id" | "tier">): Model {
  return {
    provider: "Test",
    displayName: overrides.id,
    strengths: [],
    capabilities: { coding: 8, architecture: 8, debugging: 8, research: 8, reasoning: 8, agentic: 8 },
    inputPricePerMillion: 1,
    outputPricePerMillion: 5,
    supportedEfforts: ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
    contextWindow: 200000,
    speedRating: 7,
    enabled: true,
    ...overrides,
  };
}

async function main() {
  console.log("Live sync");
  check("normalises dotted OpenRouter id", normalizeModelId("anthropic/claude-haiku-4.5") === "claude-haiku-4-5");
  check("normalises Gemini id", normalizeModelId("google/gemini-3.1-pro-preview") === "gemini-3-1-pro-preview");
  check("strips ~ prefix", normalizeModelId("~anthropic/claude-opus-5") === "claude-opus-5");
  check("rejects :batch variants", normalizeModelId("anthropic/claude-opus-5:batch") === null);

  const feed = [
    { id: "anthropic/claude-haiku-4.5", context_length: 200000, pricing: { prompt: "0.000001", completion: "0.000005" } },
    { id: "anthropic/claude-haiku-4.5:batch", context_length: 200000, pricing: { prompt: "0.0000005", completion: "0.0000025" } },
    { id: "anthropic/claude-3-haiku", context_length: 200000, pricing: { prompt: "0.00000025", completion: "0.00000125" } },
    { id: "anthropic/claude-opus-4", context_length: 200000, pricing: { prompt: "0.000015", completion: "0.000075" } },
    { id: "google/gemini-2.5-flash-lite", context_length: 1048576, pricing: { prompt: "0.0000001", completion: "0.0000004" } },
    { id: "google/gemini-3.1-pro-preview", context_length: 1048576, pricing: { prompt: "0.000002", completion: "0.000012" } },
    { id: "anthropic/claude-sonnet-5", context_length: 1000000, pricing: { prompt: "-1", completion: "-1" } },
  ];
  const updates = buildLiveUpdates(feed, DEFAULT_MODELS.map((m) => m.id));
  check("only catalog models are matched", updates.length === 2, `got ${updates.map((u) => u.id).join(",")}`);
  check("old models are not imported", !updates.some((u) => /opus-4|claude-3|2-5/.test(u.id)));
  check("negative router prices are skipped", !updates.some((u) => u.id === "claude-sonnet-5"));
  check("batch price is not used", updates.find((u) => u.id === "claude-haiku-4-5")?.inputPricePerMillion === 1);

  const edited = DEFAULT_MODELS.map((m) =>
    m.id === "claude-haiku-4-5" ? { ...m, capabilities: { ...m.capabilities, coding: 3.3 } } : m
  );
  const applied = applyLiveUpdates(edited, updates, "2026-01-01T00:00:00.000Z");
  const haiku = applied.models.find((m) => m.id === "claude-haiku-4-5");
  check("sync never adds models", applied.models.length === DEFAULT_MODELS.length);
  check("sync keeps edited capability scores", haiku?.capabilities.coding === 3.3);
  check("sync updates price and flags model", haiku?.isLiveSynced === true && haiku.inputPricePerMillion === 1);

  console.log("Jev classifier");
  {
    const realFetch = globalThis.fetch;
    const jevCalls: { url: string; auth: string }[] = [];

    function goodAnswers() {
      const scoreAnswer = (score: number, confidence = 0.9) => ({ type: "score", score, confidence });
      return {
        complexity: scoreAnswer(4), // level 4 -> 10
        ambiguity: scoreAnswer(0), // level 0 -> 0
        consequence: scoreAnswer(4),
        novelty: scoreAnswer(2),
        contextDemand: scoreAnswer(2),
        scope: scoreAnswer(2),
        toolDemand: scoreAnswer(2),
        verifiability: scoreAnswer(2),
        securitySensitive: { type: "noul", noul: 0.7 }, // >= 0.5 -> true
        architectureChanging: { type: "noul", noul: 0.3 }, // < 0.5 -> false
        taskType: { type: "choice", choice: "security", confidence: 0.95 },
      };
    }

    delete process.env.TYPESAFE_API_KEY;
    const noKeyResult = await classifyTaskWithJev("Audit the auth system");
    check("no key: not attempted, reason given", !noKeyResult.ok && Boolean(noKeyResult.fallbackReason));

    process.env.TYPESAFE_API_KEY = "jev-secret";

    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      jevCalls.push({ url: String(url), auth: String((init?.headers as Record<string, string>)?.Authorization) });
      return new Response(JSON.stringify({ answers: goodAnswers(), usage: { input_tokens: 10, output_tokens: 2 } }), {
        status: 200,
      });
    }) as typeof fetch;
    const ok = await classifyTaskWithJev("Audit the auth system", { existingCodebase: true });
    check("key is sent only to api.typesafe.ai/v1/systemone", jevCalls.length === 1 && jevCalls[0].url === "https://api.typesafe.ai/v1/systemone");
    check("key sent as bearer token", jevCalls[0]?.auth === "Bearer jev-secret");
    check("level 4 score maps to 10", ok.ok && ok.profile.complexity === 10, JSON.stringify(ok));
    check("level 0 score maps to 0", ok.ok && ok.profile.ambiguity === 0);
    check("Noul >= 0.5 maps to true", ok.ok && ok.profile.securitySensitive === true);
    check("Noul < 0.5 maps to false", ok.ok && ok.profile.architectureChanging === false);
    check("Choice answer maps to taskType", ok.ok && ok.profile.taskType === "security");
    check("classifierConfidence is the min over key answers", ok.ok && ok.confidence === 0.9, String(ok.ok && ok.confidence));

    jevCalls.length = 0;
    globalThis.fetch = (async () => new Response("nope", { status: 401 })) as typeof fetch;
    const unauthorized = await classifyTaskWithJev("Audit the auth system");
    check("401 falls back with a reason, no retry", !unauthorized.ok && Boolean(unauthorized.fallbackReason?.includes("401")) && jevCalls.length === 0);

    globalThis.fetch = (async () => new Response("bad", { status: 422 })) as typeof fetch;
    const unprocessable = await classifyTaskWithJev("Audit the auth system");
    check("422 falls back with a reason", !unprocessable.ok && Boolean(unprocessable.fallbackReason?.includes("422")));

    let attempts = 0;
    globalThis.fetch = (async () => {
      attempts++;
      return new Response("rate limited", { status: 429 });
    }) as typeof fetch;
    const rateLimited = await classifyTaskWithJev("Audit the auth system");
    check("429 retries once then falls back", !rateLimited.ok && attempts === 2, String(attempts));

    globalThis.fetch = (async () => {
      throw Object.assign(new Error("aborted"), { name: "TimeoutError" });
    }) as typeof fetch;
    const timedOut = await classifyTaskWithJev("Audit the auth system");
    check("timeout falls back with a reason", !timedOut.ok && Boolean(timedOut.fallbackReason?.includes("did not answer")));

    // classifyTask should try Jev first when the server key is set, and fall back to the LLM
    // path (or keywords) when Jev fails.
    globalThis.fetch = (async () => new Response("nope", { status: 401 })) as typeof fetch;
    delete process.env.LLM_API_KEY;
    const routed = await classifyTask("Audit the auth system", {}, {}, "jev");
    check("classifyTask falls through past a failed Jev call to the keyword classifier", routed.source === "fallback");

    delete process.env.TYPESAFE_API_KEY;
    globalThis.fetch = realFetch;
  }

  console.log("Classifier endpoint handling");
  const realFetch = globalThis.fetch;
  const calls: { url: string; auth: string }[] = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), auth: String((init?.headers as Record<string, string>)?.Authorization) });
    return new Response("nope", { status: 401 });
  }) as typeof fetch;

  process.env.LLM_API_KEY = "server-secret";
  process.env.LLM_BASE_URL = "https://server.example/v1";
  process.env.LLM_MODEL = "server-model";
  const leak = await classifyTask("Fix a typo", {}, { baseUrl: "https://attacker.example/v1" });
  check(
    "server key is never sent to a client-supplied URL",
    calls.length === 1 && calls[0].url.startsWith("https://server.example") && !calls.some((c) => c.url.includes("attacker")),
    JSON.stringify(calls)
  );
  check("HTTP failure falls back with a reason", leak.source === "fallback" && Boolean(leak.fallbackReason?.includes("401")));

  calls.length = 0;
  await classifyTask("Fix a typo", {}, { apiKey: "client-key", baseUrl: "https://mine.example/v1", model: "m" });
  check(
    "client key goes to the client URL",
    calls[0]?.url === "https://mine.example/v1/chat/completions" && calls[0].auth === "Bearer client-key"
  );

  delete process.env.LLM_API_KEY;
  delete process.env.LLM_BASE_URL;
  delete process.env.LLM_MODEL;
  calls.length = 0;
  const noKey = await classifyTask("Fix a typo", {}, {});
  check("no key: no request, reason given", calls.length === 0 && noKey.source === "fallback" && Boolean(noKey.fallbackReason));
  const noModel = await classifyTask("Fix a typo", {}, { apiKey: "k", baseUrl: "https://other.example/v1" });
  check("non-OpenAI endpoint without a model explains itself", Boolean(noModel.fallbackReason?.includes("model")));
  globalThis.fetch = realFetch;

  console.log("Engine");
  const securityProfile = classifyTaskDeterministic(
    "Perform a security audit of our authentication and authorization system and identify paths to privilege escalation.",
    { existingCodebase: true }
  );
  const weakCatalog: Model[] = [
    model({
      id: "std-weak",
      tier: "standard",
      supportedEfforts: ["HIGH", "LOW", "MEDIUM"],
      capabilities: { coding: 5, architecture: 5, debugging: 5, research: 5, reasoning: 5, agentic: 5 },
    }),
    model({
      id: "budget-strong",
      tier: "budget",
      capabilities: { coding: 6, architecture: 6, debugging: 6, research: 6, reasoning: 6, agentic: 6 },
    }),
  ];
  const fallbackRec = generateRecommendation(securityProfile, weakCatalog, "balanced", "security audit of auth system");
  check("no-match fallback respects the security floor", fallbackRec.modelId === "std-weak", fallbackRec.modelId);
  check("no-match fallback picks the highest effort even when unordered", fallbackRec.effort === "HIGH", fallbackRec.effort);
  check("no-match fallback is flagged", fallbackRec.certainty === "insufficient_data");
  check("no-match fallback lowers confidence", fallbackRec.confidence === "low", fallbackRec.confidence);

  const taskText = "Build a reusable dashboard component using our existing design system.";
  const mediumProfile = classifyTaskDeterministic(taskText, { existingCodebase: true });
  // Old bug: .find() could return the same model at a higher effort, which was then discarded,
  // leaving no reliability option even when a stronger frontier model was eligible.
  const priorities = ["balanced", "lowest_cost", "highest_reliability", "lowest_latency"] as const;
  let missingAlt = "";
  for (const priority of priorities) {
    const r = generateRecommendation(mediumProfile, DEFAULT_MODELS, priority, taskText);
    const frontierEligible = r.eligibleModels?.some((e) => e.tier === "frontier" && e.modelId !== r.modelId);
    if (r.tier !== "frontier" && frontierEligible && !r.reliabilityAlternative) missingAlt = priority;
  }
  check("reliability option present whenever a frontier model is eligible", missingAlt === "", missingAlt);

  const llmRec = generateRecommendation(mediumProfile, DEFAULT_MODELS, "balanced", taskText, { classifierSource: "llm" });
  const kwRec = generateRecommendation(mediumProfile, DEFAULT_MODELS, "balanced", taskText, { classifierSource: "fallback" });
  check("keyword classifier lowers confidence", kwRec.confidenceScore < llmRec.confidenceScore);
  check("recommendation carries catalog pricing", llmRec.modelPricing?.inputPricePerMillion !== undefined);
  check(
    "strategy names real catalog models",
    !JSON.stringify(llmRec.strategyDetails).match(/Claude 3|Sonnet 3|\bo1\b/)
  );
  const archProfile = classifyTaskDeterministic(
    "Redesign our database to support multi-tenancy without breaking existing customer data.",
    { existingCodebase: true, largeCodebase: true }
  );
  const archRec = generateRecommendation(archProfile, DEFAULT_MODELS, "balanced", "Redesign our database");
  check(
    "expert-first steps name the frontier model",
    archRec.strategyDetails.steps.some((s) => s.modelRole?.includes("Opus") || s.modelRole?.includes("Gemini")),
    JSON.stringify(archRec.strategyDetails.steps.map((s) => s.modelRole))
  );

  console.log("Analyze route validation");
  const post = async (body: unknown) =>
    analyzePost(
      new NextRequest("http://localhost/api/analyze", { method: "POST", body: JSON.stringify(body) })
    );
  check("rejects unknown priority", (await post({ taskText: "x", priority: "cheapest" })).status === 400);
  check("rejects malformed catalog", (await post({ taskText: "x", customModels: [{ id: 1 }] })).status === 400);
  check("rejects non-boolean context", (await post({ taskText: "x", context: { newProject: "yes" } })).status === 400);
  check("rejects oversized task", (await post({ taskText: "x".repeat(20001) })).status === 400);
  const ok = await post({ taskText: "Rename a variable across three files", priority: "lowest_cost" });
  const okJson = await ok.json();
  check("valid request works and reports classifier source", ok.status === 200 && okJson.source === "fallback");

  if (failed > 0) {
    console.log(`\n${failed} regression check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll regression checks passed");
}

main();
