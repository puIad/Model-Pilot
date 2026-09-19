import { TaskType } from "@/types";

/**
 * Questions sent to Jev (TypeSafe System One). Levels describe concrete situations, not adjectives,
 * so the model can match the task against them. Edit the text here to tune classification.
 * Each Score has 5 levels (0-4); the classifier rescales the result to the 0-10 TaskProfile range.
 */

export const SCORE_DIMENSIONS = [
  "complexity",
  "ambiguity",
  "consequence",
  "novelty",
  "contextDemand",
  "scope",
  "toolDemand",
  "verifiability",
] as const;

export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];

export const SCORE_LEVEL_COUNT = 5;

interface ScoreQuestion {
  type: "score";
  instructions: string;
  criteria: string[];
}

export const SCORE_QUESTIONS: Record<ScoreDimension, ScoreQuestion> = {
  complexity: {
    type: "score",
    instructions:
      "How technically difficult is it to do this task correctly? Judge the intrinsic difficulty of the work, not how long the description is.",
    criteria: [
      "Trivial mechanical edit with an obvious solution: a rename, typo fix, copy change, or one-line tweak.",
      "Small, well-understood change in one place: a simple function, a small component, or a config change.",
      "Ordinary feature or fix across a few files that follows existing patterns and has a clear approach.",
      "Substantial work with non-obvious design choices, several interacting parts, or tricky logic such as concurrency, caching, state machines, or data migrations.",
      "Very hard problem: deep algorithmic or systems difficulty, a cross-cutting redesign, or something experienced engineers would struggle to get right.",
    ],
  },
  ambiguity: {
    type: "score",
    instructions:
      "How under-specified is the task? Judge whether a competent developer could start work without asking questions. A short task can be fully specified: do not raise ambiguity just because acceptance criteria are not spelled out when the intended result is obvious.",
    criteria: [
      "The intended result is obvious, e.g. fix a named typo, add a named icon next to another one, write a test for a given function.",
      "Clear goal where an expert would settle the remaining details by convention, e.g. build a form with listed fields, add JWT auth following standard practice, review a small tool's architecture, optimise a named slow query to a target time.",
      "Clear goal, but it names no preferred approach and the reasonable approaches lead to meaningfully different results.",
      "Vague: the goal or scope is loosely described, or the root cause is unknown and has to be investigated.",
      "Open-ended: it is unclear what is being asked or what success looks like, or requirements conflict or are missing.",
    ],
  },
  consequence: {
    type: "score",
    instructions:
      "How costly is it if the result is wrong or subtly flawed? Assume normal code review and testing happen. Judge the realistic outcome of a typical mistake, not the worst imaginable one. If the task is vague about what it touches (e.g. 'fix the app', 'make it scalable'), assume it touches production systems.",
    criteria: [
      "Throwaway or trivially reversible: mistakes are seen and fixed immediately.",
      "Minor: a bug would be noticed quickly and fixed with little impact.",
      "Moderate: a defect breaks a feature or wastes real developer time, but a workaround or rollback exists.",
      "Serious: a defect in production code could expose a security weakness, cause an outage, or hurt many users, but it can be detected and fixed.",
      "Critical and irreversible: the task directly moves money, deletes or migrates production data, or controls access to sensitive data, so a mistake causes lasting damage.",
    ],
  },
  novelty: {
    type: "score",
    instructions:
      "How unfamiliar or unprecedented is this kind of task for an experienced developer? Judge whether well-known patterns and documentation exist.",
    criteria: [
      "Routine work that is done all the time with well-known patterns.",
      "Familiar work with a minor twist.",
      "Uses a less common library or approach, so some research is needed.",
      "Rarely documented or cutting-edge technology, or an unusual combination that needs adaptation.",
      "Genuinely novel problem with little prior art that needs original solutions.",
    ],
  },
  contextDemand: {
    type: "score",
    instructions:
      "How much existing code or documentation must be read and understood to do this task well?",
    criteria: [
      "Self-contained: needs nothing beyond the task text.",
      "A single file or small snippet of surrounding context.",
      "Several files or modules that must be read and kept consistent.",
      "Large parts of a codebase: many modules, conventions and dependencies must be understood.",
      "Whole-repository or multi-repository understanding, or very long documents that must be held in mind at once.",
    ],
  },
  scope: {
    type: "score",
    instructions: "How broad is the change or deliverable in terms of how much of the system it touches?",
    criteria: [
      "A single line or a single spot.",
      "One function or one component.",
      "A handful of files in one area.",
      "Many files across several modules or layers.",
      "Repo-wide or multi-system change touching most of the codebase.",
    ],
  },
  toolDemand: {
    type: "score",
    instructions:
      "How much tool use and multi-step agentic work (reading files, running commands or tests, searching, iterating) does doing this task require?",
    criteria: [
      "A plain text or code answer with no tools.",
      "Occasional file reading or a single command.",
      "Several tool calls: edit files, run tests, iterate a few times.",
      "Sustained multi-step workflow: search, run, debug, edit and re-verify many times.",
      "Long-horizon autonomous work across many tools or external systems such as browsers, databases, or deployments.",
    ],
  },
  verifiability: {
    type: "score",
    instructions:
      "How easily can a developer objectively check that the result is correct (tests, compiler, exact expected output)?",
    criteria: [
      "No way to verify: correctness is a matter of judgment and there are no tests or checks.",
      "Only manual inspection is possible.",
      "Partly checkable: some tests or type checks cover parts of the result.",
      "Mostly checkable: an existing test suite or the compiler would catch most errors.",
      "Fully checkable: deterministic tests, exact expected output, or a type-checked mechanical transformation.",
    ],
  },
};

export const NOUL_QUESTIONS = {
  securitySensitive: {
    type: "noul" as const,
    instructions:
      "Does this task involve security-sensitive functionality such as authentication, authorization, permissions, secrets, cryptography, payments, personal data, or finding vulnerabilities?",
    criteria: {
      true: "The task touches security-sensitive functionality or asks about security weaknesses.",
      false: "The task has no meaningful security or payments component.",
    },
  },
  architectureChanging: {
    type: "noul" as const,
    instructions:
      "Would completing this task change the structure of the system, such as the data schema, service boundaries, module architecture, or core abstractions that other code depends on?",
    criteria: {
      true: "The task changes system structure or shared foundations that other code depends on.",
      false: "The task works within the existing structure.",
    },
  },
};

export const TASK_TYPE_QUESTION = {
  type: "choice" as const,
  instructions: "What is the main kind of work this task asks for? Pick the single best match.",
  criteria: {
    architecture: "Designing or restructuring systems, schemas, data models, or module boundaries.",
    coding: "Writing or modifying application code, components, or features, including system prompts that configure an AI agent.",
    debugging: "Finding the cause of and fixing a defect, crash, flaky behaviour, or performance problem.",
    research: "Investigating, comparing options, reading documentation, or summarising findings.",
    security: "Auditing, hardening, or reviewing code for security weaknesses.",
    writing: "Writing documentation, reports, post-mortems, comments, copy, or other prose for people to read.",
    data: "Analysing data or building data pipelines and transformations. Speeding up an application's query is coding or debugging, not data.",
    automation: "Scripts, CI/CD, deployment controllers, infrastructure tooling, or repetitive workflow automation.",
    review: "Reviewing existing code or a change and giving feedback.",
    other: "None of the above.",
  } satisfies Record<TaskType, string>,
};

export function buildJevQuestions() {
  return {
    ...SCORE_QUESTIONS,
    ...NOUL_QUESTIONS,
    taskType: TASK_TYPE_QUESTION,
  };
}
