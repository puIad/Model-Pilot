import { TaskProfile, TaskType } from "@/types";
import { buildJevQuestions, SCORE_DIMENSIONS, ScoreDimension, TASK_TYPE_QUESTION } from "./jev-questions";

/**
 * Calls TypeSafe's Jev model (System One) to classify a task in one request.
 *
 * The `@typesafe-ai/sdk` npm package exists (confirmed via `npm view`), but its `score()`/`noul()`
 * helper signatures could not be verified against live docs with confidence, so per JEV-PLAN.md
 * section 8a this calls the REST endpoint directly instead of guessing at helper names. The host
 * is hard-coded; the key is read only from the server env `TYPESAFE_API_KEY` and is never sent to
 * a client-supplied URL.
 */

const TYPESAFE_HOST = "https://api.typesafe.ai/v1/systemone";
const JEV_MODEL = "jev-latest";
/** Whole-attempt budget including the retry; must stay comfortably under ~10s end to end. */
const JEV_TIMEOUT_MS = 8000;

interface ContextOptions {
  newProject?: boolean;
  existingCodebase?: boolean;
  largeCodebase?: boolean;
}

type ScoreAnswer = { type: "score"; score: number; confidence: number };
type NoulAnswer = { type: "noul"; noul: number };
type ChoiceAnswer = { type: "choice"; choice: string; confidence: number };
type Answer = ScoreAnswer | NoulAnswer | ChoiceAnswer;

interface SystemOneResponse {
  answers: Record<string, Answer>;
  usage?: { input_tokens?: number; output_tokens?: number };
}

export type JevResult =
  | {
      ok: true;
      profile: TaskProfile;
      /** Min confidence over consequence, ambiguity, complexity and the task-type choice. */
      confidence: number;
      usage?: { inputTokens: number; outputTokens: number };
    }
  | { ok: false; fallbackReason: string };

function scoreToTen(score: number): number {
  return Math.max(0, Math.min(10, Math.round((score / 4) * 10 * 10) / 10));
}

async function callSystemOne(
  apiKey: string,
  taskText: string,
  context: ContextOptions,
  signal: AbortSignal
): Promise<SystemOneResponse> {
  const state = {
    task: taskText,
    newProject: Boolean(context.newProject),
    existingCodebase: Boolean(context.existingCodebase),
    largeCodebase: Boolean(context.largeCodebase),
  };

  const response = await fetch(TYPESAFE_HOST, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      state,
      model: JEV_MODEL,
      questions: buildJevQuestions(),
    }),
  });

  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }

  return (await response.json()) as SystemOneResponse;
}

/**
 * Classifies a task with Jev. Returns `{ ok: false }` with a human-readable reason on any
 * failure (missing key, auth error, validation error, rate limit/overload after retry, timeout,
 * or a malformed response) so the caller can fall back to the next classifier in the chain.
 */
export async function classifyTaskWithJev(
  taskText: string,
  context: ContextOptions = {}
): Promise<JevResult> {
  const apiKey = process.env.TYPESAFE_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, fallbackReason: "TYPESAFE_API_KEY is not configured on the server." };
  }

  // One deadline shared by both attempts and the backoff.
  const signal = AbortSignal.timeout(JEV_TIMEOUT_MS);
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const data = await callSystemOne(apiKey, taskText, context, signal);
      return mapAnswersToProfile(data, context);
    } catch (err) {
      lastError = err;
      const status = (err as { status?: number } | undefined)?.status;

      if (status === 401) {
        return { ok: false, fallbackReason: "TypeSafe API key was rejected (401)." };
      }
      if (status === 422) {
        return { ok: false, fallbackReason: "TypeSafe rejected the request body (422)." };
      }
      if (status === 429 || status === 529) {
        // Retry once with a short backoff; the shared 8s deadline bounds both attempts together.
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        return {
          ok: false,
          fallbackReason:
            status === 429 ? "TypeSafe rate limit exceeded (429)." : "TypeSafe service overloaded (529).",
        };
      }
      if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
        return { ok: false, fallbackReason: `Jev did not answer within ${JEV_TIMEOUT_MS / 1000}s.` };
      }
      // Unknown failure: don't retry, fall back.
      return {
        ok: false,
        fallbackReason: err instanceof Error ? `Jev request failed: ${err.message}` : "Jev request failed.",
      };
    }
  }

  return {
    ok: false,
    fallbackReason:
      lastError instanceof Error ? `Jev request failed: ${lastError.message}` : "Jev request failed.",
  };
}

function mapAnswersToProfile(data: SystemOneResponse, context: ContextOptions): JevResult {
  const answers = data.answers;
  if (!answers) {
    return { ok: false, fallbackReason: "Jev returned no usable answer." };
  }

  const scores: Record<ScoreDimension, ScoreAnswer> = {} as Record<ScoreDimension, ScoreAnswer>;
  for (const dim of SCORE_DIMENSIONS) {
    const answer = answers[dim];
    if (!answer || answer.type !== "score" || typeof answer.score !== "number") {
      return { ok: false, fallbackReason: `Jev returned no score for "${dim}".` };
    }
    scores[dim] = answer;
  }

  const security = answers.securitySensitive;
  const architecture = answers.architectureChanging;
  if (!security || security.type !== "noul" || !architecture || architecture.type !== "noul") {
    return { ok: false, fallbackReason: "Jev returned no answer for the security/architecture questions." };
  }

  const taskTypeAnswer = answers.taskType;
  if (!taskTypeAnswer || taskTypeAnswer.type !== "choice") {
    return { ok: false, fallbackReason: "Jev returned no task-type answer." };
  }
  const taskType = taskTypeAnswer.choice as TaskType;
  if (!(taskType in TASK_TYPE_QUESTION.criteria)) {
    return { ok: false, fallbackReason: `Jev returned an unknown task type "${taskTypeAnswer.choice}".` };
  }

  const reasoning: string[] = [
    `Classified by Jev as ${taskType} (choice confidence ${(taskTypeAnswer.confidence * 100).toFixed(0)}%).`,
  ];
  if (security.noul >= 0.5) reasoning.push("Jev flagged this task as security sensitive.");
  if (architecture.noul >= 0.5) reasoning.push("Jev flagged this task as architecture changing.");

  const profile: TaskProfile = {
    taskType,
    complexity: scoreToTen(scores.complexity.score),
    ambiguity: scoreToTen(scores.ambiguity.score),
    consequence: scoreToTen(scores.consequence.score),
    novelty: scoreToTen(scores.novelty.score),
    contextDemand: scoreToTen(scores.contextDemand.score),
    scope: scoreToTen(scores.scope.score),
    toolDemand: scoreToTen(scores.toolDemand.score),
    verifiability: scoreToTen(scores.verifiability.score),
    existingCodebase: Boolean(context.existingCodebase) || Boolean(context.largeCodebase),
    largeCodebase: Boolean(context.largeCodebase),
    securitySensitive: security.noul >= 0.5,
    architectureChanging: architecture.noul >= 0.5,
    summary: `Task categorized as ${taskType} with complexity ${profileRound(
      scores.complexity.score
    )}/10 and consequence ${profileRound(scores.consequence.score)}/10 (classified by Jev).`,
    reasoning,
  };

  // classifierConfidence = min confidence over consequence, ambiguity, complexity, and the
  // task-type choice (JEV-PLAN.md section 3.1). Noul answers carry no confidence field.
  const confidence = Math.min(
    scores.consequence.confidence,
    scores.ambiguity.confidence,
    scores.complexity.confidence,
    taskTypeAnswer.confidence
  );

  return {
    ok: true,
    profile,
    confidence,
    usage: data.usage
      ? { inputTokens: data.usage.input_tokens ?? 0, outputTokens: data.usage.output_tokens ?? 0 }
      : undefined,
  };
}

function profileRound(score: number): number {
  return Math.round((score / 4) * 10);
}
