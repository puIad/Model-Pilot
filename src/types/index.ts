export type TaskType =
  | "architecture"
  | "coding"
  | "debugging"
  | "research"
  | "security"
  | "writing"
  | "data"
  | "automation"
  | "review"
  | "other";

export type EffortLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export type CapabilityLevel = "BASIC" | "STANDARD" | "STRONG" | "FRONTIER";

export type CertaintyLevel = "clear" | "moderate" | "close_call" | "insufficient_data";

export type UserPriority =
  | "balanced"
  | "lowest_cost"
  | "highest_reliability"
  | "lowest_latency";

export type ExecutionStrategy =
  | "single_pass"
  | "cheap_then_escalate"
  | "expert_first"
  | "expert_review"
  | "multi_stage";

export type TaskProfile = {
  taskType: TaskType;
  complexity: number; // 0-10
  ambiguity: number; // 0-10
  consequence: number; // 0-10 (Risk)
  novelty: number; // 0-10
  contextDemand: number; // 0-10
  scope: number; // 0-10
  toolDemand: number; // 0-10
  verifiability: number; // 0-10

  existingCodebase: boolean;
  largeCodebase: boolean;
  securitySensitive: boolean;
  architectureChanging: boolean;

  summary: string;
  reasoning: string[];
};

export type TaskRequirements = {
  reasoning: CapabilityLevel;
  coding: CapabilityLevel;
  architecture: CapabilityLevel;
  debugging: CapabilityLevel;
  research: CapabilityLevel;
  agentic: CapabilityLevel;
  context: CapabilityLevel;
  minimumEffort: EffortLevel;
  minimumViableIntelligence: CapabilityLevel;
  reliabilityBuffer: number;
  rationale: string[];
};

export type ModelTier = "budget" | "standard" | "frontier";

export type MetadataSourceType = "benchmark" | "observed" | "estimated" | "documented" | "user";

export type CapabilityMetadata = {
  sourceType: MetadataSourceType;
  confidence: "high" | "medium" | "low";
  sourceName?: string;
  lastUpdated?: string;
};

export type Model = {
  id: string;
  provider: string;
  displayName: string;
  tier: ModelTier;
  strengths: string[];
  capabilities: {
    coding: number; // 1-10
    architecture: number; // 1-10
    debugging: number; // 1-10
    research: number; // 1-10
    reasoning: number; // 1-10
    agentic: number; // 1-10
  };
  capabilityMetadata?: Record<string, CapabilityMetadata>;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  supportedEfforts: EffortLevel[];
  contextWindow: number;
  speedRating: number; // 1-10 (10 = fastest)
  description?: string;
  enabled?: boolean;
  isLiveSynced?: boolean;
  lastSyncedAt?: string;
};

export type ModelPricing = {
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  contextWindow: number;
};

export type CostBaseline = {
  modelName: string;
  /** Percent cheaper than the baseline, 0 when the recommendation is the baseline. */
  savingsPercent: number;
};

export type AlternativeOption = {
  modelId: string;
  modelName: string;
  provider: string;
  effort: EffortLevel;
  explanation: string;
  relativeCost: "$" | "$$" | "$$$" | "$$$$";
};

export type StrategyDetails = {
  name: string;
  headline: string;
  description: string;
  steps: {
    title: string;
    description: string;
    modelRole?: string;
  }[];
};

export type EliminatedModel = {
  modelId: string;
  modelName: string;
  provider: string;
  reason: string;
  failedDimension?: string;
  requiredValue?: string | number;
  modelValue?: string | number;
};

export type EligibleModel = {
  modelId: string;
  modelName: string;
  provider: string;
  effort: EffortLevel;
  tier: ModelTier;
  matchQuality: number; // 0-100
  costIndex: number;
  speedRating: number;
  reason: string;
};

export type DecisionTrace = {
  summary: string;
  steps: string[];
  certaintyExplanation?: string;
};

export type Recommendation = {
  modelId: string;
  modelName: string;
  provider: string;
  tier: ModelTier;
  effort: EffortLevel;
  confidence: "high" | "medium" | "low";
  confidenceScore: number; // 0-100
  certainty?: CertaintyLevel;
  reason: string;
  taskScore: number; // 0-100
  taskProfile: TaskProfile;
  taskRequirements?: TaskRequirements;
  eliminatedModels?: EliminatedModel[];
  eligibleModels?: EligibleModel[];
  decisionTrace?: DecisionTrace;
  cheaperAlternative?: AlternativeOption;
  reliabilityAlternative?: AlternativeOption;
  strategy: ExecutionStrategy;
  strategyDetails: StrategyDetails;
  /** Price and context of the recommended model in the catalog used for this analysis. */
  modelPricing?: ModelPricing;
  /** Most expensive enabled configuration, used as the savings baseline. */
  costBaseline?: CostBaseline;
  /** Who classified the task: Jev, the LLM, or the keyword fallback. */
  classifierSource?: "jev" | "llm" | "fallback";
  /** Why the keyword fallback was used. Only set when classifierSource is "fallback". */
  classifierNote?: string;
  /** Min confidence (0-1) over Jev's key answers. Only set when classifierSource is "jev". */
  classifierConfidence?: number;
  timestamp: string;
};

export type UserFeedback = {
  /** Only present when the user chose one. */
  outcome?: "excellent" | "good" | "acceptable" | "poor" | "failed";
  /** Only present when the user chose one. */
  recommendationQuality?: "too_expensive" | "too_weak" | "about_right";
  comment?: string;
  submittedAt: string;
};

export type HistoryItem = {
  id: string;
  timestamp: string;
  taskText: string;
  context: {
    newProject: boolean;
    existingCodebase: boolean;
    largeCodebase: boolean;
  };
  priority: UserPriority;
  recommendation: Recommendation;
  feedback?: UserFeedback;
};

export type UserSettings = {
  theme: "dark" | "light" | "system";
  customModels: Model[];
  apiConfig: {
    baseUrl: string;
    apiKey: string;
    model: string;
  };
  /** Per-provider on/off switch, keyed by `Model.provider` (e.g. "Google", "Anthropic"). A
   *  missing entry defaults to enabled. Applied on top of each model's own enabled toggle. */
  providerEnabled?: Record<string, boolean>;
  /** Which classifier interprets the task: the LLM/keyword classifier (default) or TypeSafe Jev. */
  classifierMode?: ClassifierMode;
};

export type ClassifierMode = "classifier" | "jev";
