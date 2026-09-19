import { ClassifierMode, TaskProfile } from "@/types";
import { classifyTaskDeterministic } from "./fallback-classifier";
import { classifyTaskWithJev } from "./jev-classifier";
import { TaskProfileSchema } from "./schema";

const SYSTEM_PROMPT = `You are a task-analysis engine.
Analyze the user's task.
Do not recommend models.
Do not recommend effort levels.
Do not make pricing assumptions.
Return only valid JSON matching the supplied schema.

Schema fields:
{
  "taskType": "architecture" | "coding" | "debugging" | "research" | "security" | "writing" | "data" | "automation" | "review" | "other",
  "complexity": number (0-10),
  "ambiguity": number (0-10),
  "consequence": number (0-10),
  "novelty": number (0-10),
  "contextDemand": number (0-10),
  "scope": number (0-10),
  "toolDemand": number (0-10),
  "verifiability": number (0-10),
  "existingCodebase": boolean,
  "largeCodebase": boolean,
  "securitySensitive": boolean,
  "architectureChanging": boolean,
  "summary": string,
  "reasoning": string[]
}

Evaluate:
- task type
- complexity
- ambiguity
- consequence of failure
- novelty
- context demand
- scope
- tool demand
- verifiability
- security sensitivity
- architecture changes
- existing codebase characteristics

Base scores on the actual task description.
Do not assume that difficult-looking words necessarily mean a difficult task.
Return ONLY clean JSON without markdown formatting.`;

interface ContextOptions {
  newProject?: boolean;
  existingCodebase?: boolean;
  largeCodebase?: boolean;
}

export interface ClassifierApiConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export type ClassifierResult = {
  profile: TaskProfile;
  source: "jev" | "llm" | "fallback";
  /** Why the keyword classifier was used instead of Jev/LLM. Only set when source is "fallback". */
  fallbackReason?: string;
  /** Min confidence (0-1) over Jev's consequence, ambiguity, complexity and task-type answers. Only set when source is "jev". */
  classifierConfidence?: number;
};

const OPENAI_BASE_URL = "https://api.openai.com/v1";
const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";
const LLM_TIMEOUT_MS = 20000;

function cleanBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" ? trimmed : null;
  } catch {
    return null;
  }
}

/**
 * Chooses the endpoint, key and model for one request.
 *
 * A key typed in the browser is only ever sent to the endpoint typed with it. The server's
 * LLM_API_KEY is only ever sent to the server's LLM_BASE_URL, so a client can never redirect it.
 */
function resolveEndpoint(
  apiConfig: ClassifierApiConfig
): { apiKey: string; baseUrl: string; model: string } | { reason: string } {
  const clientKey = apiConfig.apiKey?.trim();
  const envKey = process.env.LLM_API_KEY?.trim();
  const envBase = cleanBaseUrl(process.env.LLM_BASE_URL);

  let apiKey: string;
  let baseUrl: string;

  if (clientKey) {
    if (apiConfig.baseUrl?.trim() && !cleanBaseUrl(apiConfig.baseUrl)) {
      return { reason: "The Base URL in Settings is not a valid http(s) URL." };
    }
    apiKey = clientKey;
    baseUrl = cleanBaseUrl(apiConfig.baseUrl) || envBase || OPENAI_BASE_URL;
  } else if (envKey) {
    apiKey = envKey;
    baseUrl = envBase || OPENAI_BASE_URL;
  } else {
    return { reason: "No API key configured. Add one in Settings to use LLM classification." };
  }

  const model =
    apiConfig.model?.trim() ||
    process.env.LLM_MODEL?.trim() ||
    (baseUrl === OPENAI_BASE_URL ? OPENAI_DEFAULT_MODEL : "");

  if (!model) {
    return { reason: `No model name set for ${new URL(baseUrl).host}. Add one in Settings.` };
  }

  return { apiKey, baseUrl, model };
}

export async function classifyTask(
  taskText: string,
  context: ContextOptions = {},
  apiConfig: ClassifierApiConfig = {},
  mode: ClassifierMode = "classifier"
): Promise<ClassifierResult> {
  let jevFailure: string | undefined;
  // Jev is opt-in: only tried when selected and the server key is set.
  if (mode === "jev" && process.env.TYPESAFE_API_KEY?.trim()) {
    const jevResult = await classifyTaskWithJev(taskText, context);
    if (jevResult.ok) {
      return { profile: jevResult.profile, source: "jev", classifierConfidence: jevResult.confidence };
    }
    jevFailure = jevResult.fallbackReason;
    console.warn("Jev classification failed, falling back:", jevFailure);
  } else if (mode === "jev") {
    jevFailure = "TYPESAFE_API_KEY is not configured on the server.";
  }
  const withJevNote = (reason: string) => (jevFailure ? `Jev unavailable (${jevFailure}) ${reason}` : reason);

  const endpoint = resolveEndpoint(apiConfig);

  if ("reason" in endpoint) {
    return {
      profile: classifyTaskDeterministic(taskText, context),
      source: "fallback",
      fallbackReason: withJevNote(endpoint.reason),
    };
  }

  const { apiKey, baseUrl, model } = endpoint;

  const promptContent = `Task Description (JSON string):
${JSON.stringify(taskText)}

Selected User Context:
- New Project: ${context.newProject ? "Yes" : "No"}
- Existing Codebase: ${context.existingCodebase ? "Yes" : "No"}
- Large/Complex Codebase: ${context.largeCodebase ? "Yes" : "No"}

Analyze the task and return ONLY the JSON object.`;

  let failure = "The model returned no usable answer.";

  // Try calling LLM with 1 retry on parse failure
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: promptContent },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        failure = `The LLM endpoint returned HTTP ${response.status} for model "${model}".`;
        console.warn(`LLM API returned status ${response.status}`);
        break; // retrying will not fix an auth or model error
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        continue; // retry
      }

      // Parse and validate with Zod
      const validated = TaskProfileSchema.safeParse(JSON.parse(content));

      if (validated.success) {
        return { profile: validated.data, source: "llm" };
      }
      failure = "The model's answer did not match the task schema.";
      console.warn("Zod validation failed for LLM output:", validated.error.issues);
    } catch (err) {
      failure =
        err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")
          ? `The LLM endpoint did not answer within ${LLM_TIMEOUT_MS / 1000}s.`
          : "The LLM request failed or returned invalid JSON.";
      console.warn(`Error during LLM classification attempt ${attempt + 1}:`, err);
    }
  }

  // Graceful fallback if LLM call or validation failed
  return {
    profile: classifyTaskDeterministic(taskText, context),
    source: "fallback",
    fallbackReason: withJevNote(failure),
  };
}
