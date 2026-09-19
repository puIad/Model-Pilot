import {
  EffortLevel,
  ModelTier,
  TaskProfile,
  TaskRequirements,
} from "@/types";

export type NumericRange = {
  min: number;
  max: number;
};

export interface BenchmarkCase {
  id: string;
  name: string;
  task: string;
  context?: {
    newProject?: boolean;
    existingCodebase?: boolean;
    largeCodebase?: boolean;
  };
  expected: {
    taskTypes: string[];
    complexity: NumericRange;
    ambiguity: NumericRange;
    consequence: NumericRange;
    scope: NumericRange;
    effort: {
      min: number;
      max: number;
    };
    strategy?: string[];
    minimumModelTier: ModelTier;
    rationale: string;
  };
}

export interface DimensionComparison {
  actual: number;
  min: number;
  max: number;
  passed: boolean;
}

export interface BenchmarkResult {
  id: string;
  name: string;
  task: string;
  passed: boolean;
  profile: TaskProfile;
  requirements?: TaskRequirements;
  recommendation: {
    modelId: string;
    modelName: string;
    tier: ModelTier;
    effort: EffortLevel;
    strategy: string;
    taskScore: number;
    certainty?: string;
  };
  comparisons: {
    taskType: { actual: string; expected: string[]; passed: boolean };
    complexity: DimensionComparison;
    ambiguity: DimensionComparison;
    consequence: DimensionComparison;
    scope: DimensionComparison;
    effort: DimensionComparison;
    modelTier: { actual: ModelTier; minimum: ModelTier; passed: boolean };
    strategy?: { actual: string; expected: string[]; passed: boolean };
  };
  failures: string[];
  rationale: string;
}

export interface InvariantResult {
  id: string;
  name: string;
  category:
    | "risk_monotonicity"
    | "ambiguity_monotonicity"
    | "scope_monotonicity"
    | "verifiability_discount"
    | "security_floor"
    | "architecture_floor"
    | "cheap_priority_floor";
  passed: boolean;
  assertion: string;
  details: string;
  error?: string;
}

export interface PriorityTestResult {
  taskId: string;
  taskName: string;
  balanced: { modelId: string; tier: ModelTier; effort: EffortLevel; costIndex: number };
  lowestCost: { modelId: string; tier: ModelTier; effort: EffortLevel; costIndex: number };
  highestReliability: { modelId: string; tier: ModelTier; effort: EffortLevel; costIndex: number };
  lowestLatency: { modelId: string; tier: ModelTier; effort: EffortLevel; costIndex: number };
  passed: boolean;
  validations: {
    lowestCostCheaperOrEqual: boolean;
    lowestCostRespectsFloor: boolean;
    reliabilityHigherOrEqual: boolean;
    latencyOptimized: boolean;
  };
  details: string;
}

export interface ModelAgnosticResult {
  passed: boolean;
  syntheticModelsUsed: string[];
  scenariosTested: number;
  passedScenarios: number;
  details: string[];
}

export interface CatalogMutationResult {
  passed: boolean;
  tests: {
    name: string;
    description: string;
    passed: boolean;
    beforeMetric: string;
    afterMetric: string;
  }[];
}

export interface MonotonicityStressResult {
  iterations: number;
  violations: number;
  criticalViolations: number;
  details: {
    perturbedDimension: "complexity" | "consequence" | "ambiguity" | "scope";
    profileBefore: Partial<TaskProfile>;
    profileAfter: Partial<TaskProfile>;
    recBefore: { tier: ModelTier; effort: EffortLevel };
    recAfter: { tier: ModelTier; effort: EffortLevel };
    violationType: string;
  }[];
  passed: boolean;
}

export interface BiasTestResult {
  id: string;
  name: string;
  category:
    | "identical_models_diff_names"
    | "swap_identities"
    | "superior_synthetic"
    | "cheaper_equivalent"
    | "reversed_provider_names"
    | "differential_shuffle";
  passed: boolean;
  description: string;
  details: string;
  providerNameDependencyDetected: boolean;
}

export interface CapabilitySwapResult {
  id: string;
  name: string;
  passed: boolean;
  originalWinner: string;
  swappedWinner: string;
  expectedBehavior: string;
  details: string;
}

export interface PairwiseTestResult {
  id: string;
  name: string;
  task: string;
  candidateA: { modelName: string; effort: EffortLevel };
  candidateB: { modelName: string; effort: EffortLevel };
  expectedWinner: "A" | "B";
  actualWinner: "A" | "B";
  passed: boolean;
  rationale: string;
}

export interface SensitivityAnalysisResult {
  variableSweeps: {
    variable: string;
    steps: { value: number; recommendedModel: string; effort: EffortLevel; tier: ModelTier }[];
    isMonotonic: boolean;
  }[];
  weightPerturbations: {
    perturbedDimension: string;
    change: "+10%" | "-10%";
    changedRecommendationsCount: number;
    totalBenchmarksTested: number;
    stabilityRate: number;
  }[];
  stabilityRating: "STABLE" | "HIGH_SENSITIVITY";
  passed: boolean;
}

export interface CalibrationSuiteReport {
  timestamp: string;
  overallPassed: boolean;
  consistencyScore: number;
  summary: {
    goldenPassCount: number;
    goldenTotalCount: number;
    goldenPassRate: number;
    invariantPassCount: number;
    invariantTotalCount: number;
    invariantPassRate: number;
    biasPassCount: number;
    biasTotalCount: number;
    capabilitySwapPassCount: number;
    capabilitySwapTotalCount: number;
    pairwisePassCount: number;
    pairwiseTotalCount: number;
    monotonicityIterations: number;
    criticalViolationsCount: number;
    providerNameDependenciesCount: number;
    sensitivityRating: "STABLE" | "HIGH_SENSITIVITY";
  };
  goldenResults: BenchmarkResult[];
  invariantResults: InvariantResult[];
  priorityResults: PriorityTestResult[];
  modelAgnosticResult: ModelAgnosticResult;
  mutationResult: CatalogMutationResult;
  monotonicityResult: MonotonicityStressResult;
  biasResults: BiasTestResult[];
  capabilitySwapResults: CapabilitySwapResult[];
  pairwiseResults: PairwiseTestResult[];
  sensitivityResult: SensitivityAnalysisResult;
  suggestedAdjustments: string[];
}
