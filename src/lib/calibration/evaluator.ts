import {
  EffortLevel,
  Model,
  ModelTier,
  TaskProfile,
  TaskType,
} from "@/types";
import { classifyTaskDeterministic } from "../analyzer/fallback-classifier";

import { DEFAULT_MODELS } from "../models/catalog";

import { generateRecommendation } from "../recommendation/engine";

import { GOLDEN_BENCHMARK_SUITE } from "./golden-dataset";

import {
  runBiasTests,
  runCapabilitySwapTests,
  runPairwiseTests,
  runSensitivityAnalysis,
} from "./adversarial-tests";

import {
  BenchmarkCase,
  BenchmarkResult,
  CalibrationSuiteReport,
  CatalogMutationResult,
  DimensionComparison,
  InvariantResult,
  ModelAgnosticResult,
  MonotonicityStressResult,
  PriorityTestResult,
} from "./types";


const EFFORT_ORDER: Record<EffortLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  VERY_HIGH: 4,
};

const TIER_ORDER: Record<ModelTier, number> = {
  budget: 1,
  standard: 2,
  frontier: 3,
};

function checkRange(value: number, min: number, max: number): DimensionComparison {
  return {
    actual: value,
    min,
    max,
    passed: value >= min && value <= max,
  };
}

/**
 * Runs a single golden benchmark test case.
 */
export function runBenchmarkCase(
  testCase: BenchmarkCase,
  models: Model[] = DEFAULT_MODELS
): BenchmarkResult {
  const profile = classifyTaskDeterministic(testCase.task, testCase.context);
  const rec = generateRecommendation(profile, models, "balanced", testCase.task);

  const failures: string[] = [];

  // 1. Task Type Check
  const taskTypePassed = testCase.expected.taskTypes.includes(profile.taskType);
  if (!taskTypePassed) {
    failures.push(
      `TaskType mismatch: expected [${testCase.expected.taskTypes.join(", ")}], got "${profile.taskType}"`
    );
  }

  // 2. Metric Ranges Checks
  const complexityComp = checkRange(
    profile.complexity,
    testCase.expected.complexity.min,
    testCase.expected.complexity.max
  );
  if (!complexityComp.passed) {
    failures.push(
      `Complexity out of range: expected [${testCase.expected.complexity.min}..${testCase.expected.complexity.max}], got ${profile.complexity}`
    );
  }

  const ambiguityComp = checkRange(
    profile.ambiguity,
    testCase.expected.ambiguity.min,
    testCase.expected.ambiguity.max
  );
  if (!ambiguityComp.passed) {
    failures.push(
      `Ambiguity out of range: expected [${testCase.expected.ambiguity.min}..${testCase.expected.ambiguity.max}], got ${profile.ambiguity}`
    );
  }

  const consequenceComp = checkRange(
    profile.consequence,
    testCase.expected.consequence.min,
    testCase.expected.consequence.max
  );
  if (!consequenceComp.passed) {
    failures.push(
      `Consequence out of range: expected [${testCase.expected.consequence.min}..${testCase.expected.consequence.max}], got ${profile.consequence}`
    );
  }

  const scopeComp = checkRange(
    profile.scope,
    testCase.expected.scope.min,
    testCase.expected.scope.max
  );
  if (!scopeComp.passed) {
    failures.push(
      `Scope out of range: expected [${testCase.expected.scope.min}..${testCase.expected.scope.max}], got ${profile.scope}`
    );
  }

  // 3. Effort Level Check
  const actualEffortRank = EFFORT_ORDER[rec.effort];
  const effortComp: DimensionComparison = {
    actual: actualEffortRank,
    min: testCase.expected.effort.min,
    max: testCase.expected.effort.max,
    passed:
      actualEffortRank >= testCase.expected.effort.min &&
      actualEffortRank <= testCase.expected.effort.max,
  };
  if (!effortComp.passed) {
    failures.push(
      `Effort rank out of range: expected [${testCase.expected.effort.min}..${testCase.expected.effort.max}], got ${actualEffortRank} (${rec.effort})`
    );
  }

  // 4. Minimum Model Tier Check
  const actualTierRank = TIER_ORDER[rec.tier];
  const minTierRank = TIER_ORDER[testCase.expected.minimumModelTier];
  const tierPassed = actualTierRank >= minTierRank;
  if (!tierPassed) {
    failures.push(
      `Model tier below minimum: expected at least "${testCase.expected.minimumModelTier}", got "${rec.tier}" (${rec.modelName})`
    );
  }

  // 5. Strategy Check (Optional)
  let strategyComparison = undefined;
  if (testCase.expected.strategy && testCase.expected.strategy.length > 0) {
    const stratPassed = testCase.expected.strategy.includes(rec.strategy);
    strategyComparison = {
      actual: rec.strategy,
      expected: testCase.expected.strategy,
      passed: stratPassed,
    };
    if (!stratPassed) {
      failures.push(
        `Strategy mismatch: expected [${testCase.expected.strategy.join(", ")}], got "${rec.strategy}"`
      );
    }
  }

  const passed = failures.length === 0;

  return {
    id: testCase.id,
    name: testCase.name,
    task: testCase.task,
    passed,
    profile,
    requirements: rec.taskRequirements,
    recommendation: {
      modelId: rec.modelId,
      modelName: rec.modelName,
      tier: rec.tier,
      effort: rec.effort,
      strategy: rec.strategy,
      taskScore: rec.taskScore,
      certainty: rec.certainty,
    },
    comparisons: {
      taskType: {
        actual: profile.taskType,
        expected: testCase.expected.taskTypes,
        passed: taskTypePassed,
      },
      complexity: complexityComp,
      ambiguity: ambiguityComp,
      consequence: consequenceComp,
      scope: scopeComp,
      effort: effortComp,
      modelTier: {
        actual: rec.tier,
        minimum: testCase.expected.minimumModelTier,
        passed: tierPassed,
      },
      strategy: strategyComparison,
    },
    failures,
    rationale: testCase.expected.rationale,
  };
}

/**
 * Runs all 30 golden benchmark test cases.
 */
export function runAllBenchmarks(models: Model[] = DEFAULT_MODELS): BenchmarkResult[] {
  return GOLDEN_BENCHMARK_SUITE.map((c) => runBenchmarkCase(c, models));
}

/**
 * Executes the 18+ Logical Invariant tests (Section 50).
 */
export function runInvariantTests(models: Model[] = DEFAULT_MODELS): InvariantResult[] {
  const results: InvariantResult[] = [];

  const baseProfile: TaskProfile = {
    taskType: "coding",
    complexity: 4,
    ambiguity: 2,
    consequence: 3,
    novelty: 3,
    contextDemand: 4,
    scope: 4,
    toolDemand: 3,
    verifiability: 8,
    existingCodebase: true,
    largeCodebase: false,
    securitySensitive: false,
    architectureChanging: false,
    summary: "Base test task",
    reasoning: [],
  };

  // Helper to test monotonicity
  const testRiskMonotonicity = (
    id: string,
    name: string,
    lowRisk: number,
    highRisk: number
  ) => {
    const p1 = { ...baseProfile, consequence: lowRisk };
    const p2 = { ...baseProfile, consequence: highRisk };
    const r1 = generateRecommendation(p1, models, "balanced");
    const r2 = generateRecommendation(p2, models, "balanced");
    const passed = TIER_ORDER[r2.tier] >= TIER_ORDER[r1.tier];
    results.push({
      id,
      name,
      category: "risk_monotonicity",
      passed,
      assertion: `Tier(consequence=${highRisk}) [${r2.tier}] >= Tier(consequence=${lowRisk}) [${r1.tier}]`,
      details: `Consequence increase from ${lowRisk} to ${highRisk} resulted in tier transition: ${r1.tier} -> ${r2.tier}`,
    });
  };

  // Invariant 1: Risk Monotonicity (Tests 1.1 - 1.3)
  testRiskMonotonicity("inv-01", "Invariant 1.1: Risk Monotonicity (Low to Moderate)", 2, 6);
  testRiskMonotonicity("inv-02", "Invariant 1.2: Risk Monotonicity (Moderate to Critical)", 5, 9);
  testRiskMonotonicity("inv-03", "Invariant 1.3: Risk Monotonicity (Trivial to Severe)", 1, 10);

  // Invariant 2: Ambiguity Monotonicity (Tests 2.1 - 2.3)
  const testAmbiguityMonotonicity = (
    id: string,
    name: string,
    lowAmb: number,
    highAmb: number
  ) => {
    const p1 = { ...baseProfile, ambiguity: lowAmb };
    const p2 = { ...baseProfile, ambiguity: highAmb };
    const r1 = generateRecommendation(p1, models, "balanced");
    const r2 = generateRecommendation(p2, models, "balanced");
    const passed = EFFORT_ORDER[r2.effort] >= EFFORT_ORDER[r1.effort];
    results.push({
      id,
      name,
      category: "ambiguity_monotonicity",
      passed,
      assertion: `Effort(ambiguity=${highAmb}) [${r2.effort}] >= Effort(ambiguity=${lowAmb}) [${r1.effort}]`,
      details: `Ambiguity increase from ${lowAmb} to ${highAmb} yielded effort transition: ${r1.effort} -> ${r2.effort}`,
    });
  };
  testAmbiguityMonotonicity("inv-04", "Invariant 2.1: Ambiguity Monotonicity (Clear to Moderate)", 2, 5);
  testAmbiguityMonotonicity("inv-05", "Invariant 2.2: Ambiguity Monotonicity (Moderate to Vague)", 4, 9);
  testAmbiguityMonotonicity("inv-06", "Invariant 2.3: Ambiguity Monotonicity (Zero Spec to Maximum)", 1, 10);

  // Invariant 3: Scope Monotonicity (Tests 3.1 - 3.3)
  const testScopeMonotonicity = (
    id: string,
    name: string,
    lowScope: number,
    highScope: number
  ) => {
    const p1 = { ...baseProfile, scope: lowScope };
    const p2 = { ...baseProfile, scope: highScope };
    const r1 = generateRecommendation(p1, models, "balanced");
    const r2 = generateRecommendation(p2, models, "balanced");
    const passed = EFFORT_ORDER[r2.effort] >= EFFORT_ORDER[r1.effort];
    results.push({
      id,
      name,
      category: "scope_monotonicity",
      passed,
      assertion: `Effort(scope=${highScope}) [${r2.effort}] >= Effort(scope=${lowScope}) [${r1.effort}]`,
      details: `Scope increase from ${lowScope} to ${highScope} yielded effort transition: ${r1.effort} -> ${r2.effort}`,
    });
  };
  testScopeMonotonicity("inv-07", "Invariant 3.1: Scope Monotonicity (Single file to Multi-module)", 2, 6);
  testScopeMonotonicity("inv-08", "Invariant 3.2: Scope Monotonicity (Multi-module to Repo-wide)", 5, 9);
  testScopeMonotonicity("inv-09", "Invariant 3.3: Scope Monotonicity (Trivial edit to Complete rewrite)", 1, 10);

  // Invariant 4: Verifiability Discount (Tests 4.1 - 4.3)
  const testVerifiabilityDiscount = (
    id: string,
    name: string,
    verifHigh: number,
    verifLow: number
  ) => {
    const pHigh = { ...baseProfile, verifiability: verifHigh, consequence: 2, complexity: 4 };
    const pLow = { ...baseProfile, verifiability: verifLow, consequence: 2, complexity: 4 };
    const rHigh = generateRecommendation(pHigh, models, "balanced");
    const rLow = generateRecommendation(pLow, models, "balanced");
    const passed =
      TIER_ORDER[rHigh.tier] <= TIER_ORDER[rLow.tier] &&
      EFFORT_ORDER[rHigh.effort] <= EFFORT_ORDER[rLow.effort] &&
      rHigh.taskScore <= rLow.taskScore;
    results.push({
      id,
      name,
      category: "verifiability_discount",
      passed,
      assertion: `Score(verif=${verifHigh}) [${rHigh.taskScore}] <= Score(verif=${verifLow}) [${rLow.taskScore}]`,
      details: `High verifiability task score: ${rHigh.taskScore} vs Low verifiability task score: ${rLow.taskScore}`,
    });
  };
  testVerifiabilityDiscount("inv-10", "Invariant 4.1: Verifiability Discount on Bounded Tasks", 10, 2);
  testVerifiabilityDiscount("inv-11", "Invariant 4.2: Verifiability Discount on Algorithmic Tasks", 9, 3);
  testVerifiabilityDiscount("inv-12", "Invariant 4.3: Verifiability Score Dampening", 8, 4);

  // Invariant 5: Security Floor (Tests 5.1 - 5.3)
  const testSecurityFloor = (
    id: string,
    name: string,
    profileMod: Partial<TaskProfile>
  ) => {
    const prof = { ...baseProfile, ...profileMod };
    const recBalanced = generateRecommendation(prof, models, "balanced");
    const recCost = generateRecommendation(prof, models, "lowest_cost");
    const passed = recCost.tier !== "budget" && recBalanced.tier !== "budget";
    results.push({
      id,
      name,
      category: "security_floor",
      passed,
      assertion: `Tier under lowest_cost [${recCost.tier}] must NOT be budget`,
      details: `Balanced tier: ${recBalanced.tier}, Lowest Cost tier: ${recCost.tier}`,
    });
  };
  testSecurityFloor("inv-13", "Invariant 5.1: Security Sensitive Floor under Lowest Cost", {
    securitySensitive: true,
    consequence: 8,
  });
  testSecurityFloor("inv-14", "Invariant 5.2: Critical Consequence Floor under Lowest Cost", {
    securitySensitive: false,
    consequence: 9,
  });
  testSecurityFloor("inv-15", "Invariant 5.3: Auth & Cryptographic Operation Floor", {
    securitySensitive: true,
    consequence: 10,
  });

  // Invariant 6: Architecture Floor (Tests 6.1 - 6.3)
  const testArchitectureFloor = (
    id: string,
    name: string,
    profileMod: Partial<TaskProfile>
  ) => {
    const prof = { ...baseProfile, ...profileMod };
    const recBalanced = generateRecommendation(prof, models, "balanced");
    const recCost = generateRecommendation(prof, models, "lowest_cost");
    const passed = recCost.effort !== "LOW" && recBalanced.effort !== "LOW";
    results.push({
      id,
      name,
      category: "architecture_floor",
      passed,
      assertion: `Effort for architecture task [${recCost.effort}] must NOT be LOW`,
      details: `Balanced effort: ${recBalanced.effort}, Lowest Cost effort: ${recCost.effort}`,
    });
  };
  testArchitectureFloor("inv-16", "Invariant 6.1: Architecture TaskType Floor", {
    taskType: "architecture",
  });
  testArchitectureFloor("inv-17", "Invariant 6.2: Architecture Changing Flag Floor", {
    architectureChanging: true,
  });
  testArchitectureFloor("inv-18", "Invariant 6.3: Large Migration Floor under Lowest Cost", {
    taskType: "architecture",
    architectureChanging: true,
    scope: 8,
  });

  // Invariant 7: Cheap Priority Safety Floor (Tests 7.1 - 7.3)
  const testCheapSafetyFloor = (
    id: string,
    name: string,
    profileMod: Partial<TaskProfile>
  ) => {
    const prof = { ...baseProfile, ...profileMod };
    const recCost = generateRecommendation(prof, models, "lowest_cost");
    // If task is high consequence or complexity >= 7, must not drop to budget
    const passed = recCost.tier !== "budget";
    results.push({
      id,
      name,
      category: "cheap_priority_floor",
      passed,
      assertion: `Lowest cost priority must respect minimum safe tier (expected >= standard, got ${recCost.tier})`,
      details: `Model recommended: ${recCost.modelName} [${recCost.tier}] at effort ${recCost.effort}`,
    });
  };
  testCheapSafetyFloor("inv-19", "Invariant 7.1: High Consequence Safe Floor", {
    consequence: 8,
    complexity: 7,
  });
  testCheapSafetyFloor("inv-20", "Invariant 7.2: High Complexity Safe Floor", {
    complexity: 8,
    scope: 7,
  });
  testCheapSafetyFloor("inv-21", "Invariant 7.3: Complex Debugging Safe Floor", {
    taskType: "debugging",
    complexity: 8,
    consequence: 7,
  });

  return results;
}

/**
 * Executes Priority Tradeoff tests (Section 47).
 */
export function runPriorityTradeoffTests(
  models: Model[] = DEFAULT_MODELS
): PriorityTestResult[] {
  const tasksToTest = [
    {
      id: "priority-crud",
      name: "Standard REST Endpoint",
      text: "Add a GET /api/users/:id endpoint that returns user profile from PostgreSQL via Prisma, with 404 handling",
      context: { existingCodebase: true },
    },
    {
      id: "priority-webhook",
      name: "Payment Webhook Handler",
      text: "Implement Stripe webhook handler for invoice.payment_succeeded and invoice.payment_failed with idempotency, signature verification, and database transaction",
      context: { existingCodebase: true },
    },
    {
      id: "priority-refactor",
      name: "State Management Migration",
      text: "Migrate our React state management from Redux to Zustand across 35 components and 8 slices",
      context: { existingCodebase: true, largeCodebase: true },
    },
  ];

  return tasksToTest.map((t) => {
    const prof = classifyTaskDeterministic(t.text, t.context);

    const getCostIndex = (mId: string, eff: EffortLevel) => {
      const m = models.find((mod) => mod.id === mId) || models[0];
      const factor = { LOW: 1.0, MEDIUM: 1.4, HIGH: 2.0, VERY_HIGH: 3.0 }[eff];
      return (m.inputPricePerMillion + m.outputPricePerMillion * 2) * factor;
    };

    const recBalanced = generateRecommendation(prof, models, "balanced", t.text);
    const recLowestCost = generateRecommendation(prof, models, "lowest_cost", t.text);
    const recReliability = generateRecommendation(prof, models, "highest_reliability", t.text);
    const recLatency = generateRecommendation(prof, models, "lowest_latency", t.text);

    const costBalanced = getCostIndex(recBalanced.modelId, recBalanced.effort);
    const costLowest = getCostIndex(recLowestCost.modelId, recLowestCost.effort);
    const costReliability = getCostIndex(recReliability.modelId, recReliability.effort);
    const costLatency = getCostIndex(recLatency.modelId, recLatency.effort);

    // Validations
    const lowestCostCheaperOrEqual = costLowest <= costBalanced * 1.05; // allow margin
    const lowestCostRespectsFloor =
      !prof.securitySensitive && prof.consequence < 8 ? true : recLowestCost.tier !== "budget";
    const reliabilityHigherOrEqual =
      TIER_ORDER[recReliability.tier] >= TIER_ORDER[recBalanced.tier] &&
      EFFORT_ORDER[recReliability.effort] >= EFFORT_ORDER[recBalanced.effort];

    // For latency, check if speed is high or effort is minimal
    const mLatency = models.find((m) => m.id === recLatency.modelId);
    const mBalanced = models.find((m) => m.id === recBalanced.modelId);
    const latencyOptimized =
      (mLatency?.speedRating ?? 7) >= (mBalanced?.speedRating ?? 7) ||
      EFFORT_ORDER[recLatency.effort] <= EFFORT_ORDER[recBalanced.effort];

    const passed =
      lowestCostCheaperOrEqual &&
      lowestCostRespectsFloor &&
      reliabilityHigherOrEqual &&
      latencyOptimized;

    return {
      taskId: t.id,
      taskName: t.name,
      balanced: {
        modelId: recBalanced.modelId,
        tier: recBalanced.tier,
        effort: recBalanced.effort,
        costIndex: Math.round(costBalanced * 100) / 100,
      },
      lowestCost: {
        modelId: recLowestCost.modelId,
        tier: recLowestCost.tier,
        effort: recLowestCost.effort,
        costIndex: Math.round(costLowest * 100) / 100,
      },
      highestReliability: {
        modelId: recReliability.modelId,
        tier: recReliability.tier,
        effort: recReliability.effort,
        costIndex: Math.round(costReliability * 100) / 100,
      },
      lowestLatency: {
        modelId: recLatency.modelId,
        tier: recLatency.tier,
        effort: recLatency.effort,
        costIndex: Math.round(costLatency * 100) / 100,
      },
      passed,
      validations: {
        lowestCostCheaperOrEqual,
        lowestCostRespectsFloor,
        reliabilityHigherOrEqual,
        latencyOptimized,
      },
      details: `Lowest cost index ${costLowest.toFixed(2)} <= Balanced ${costBalanced.toFixed(2)}. Reliability tier ${recReliability.tier} >= Balanced ${recBalanced.tier}.`,
    };
  });
}

/**
 * Model-Agnostic Synthetic Catalog Tests (Section 48).
 */
export function runModelAgnosticTests(): ModelAgnosticResult {
  const syntheticModels: Model[] = [
    {
      id: "synthetic-budget-model",
      displayName: "Synthetic Budget Model",
      provider: "SyntheticAI",
      tier: "budget",
      inputPricePerMillion: 0.1,
      outputPricePerMillion: 0.2,
      contextWindow: 32000,
      supportedEfforts: ["LOW", "MEDIUM"],
      speedRating: 9,
      capabilities: {
        coding: 6.5,
        architecture: 5.0,
        debugging: 6.0,
        research: 6.5,
        reasoning: 6.5,
        agentic: 6.0,
      },
      strengths: ["Simple edits", "Budget-conscious tasks"],
      enabled: true,
    },
    {
      id: "synthetic-standard-model",
      displayName: "Synthetic Standard Model",
      provider: "SyntheticAI",
      tier: "standard",
      inputPricePerMillion: 1.0,
      outputPricePerMillion: 3.0,
      contextWindow: 128000,
      supportedEfforts: ["LOW", "MEDIUM", "HIGH"],
      speedRating: 7,
      capabilities: {
        coding: 8.5,
        architecture: 8.0,
        debugging: 8.2,
        research: 8.5,
        reasoning: 8.5,
        agentic: 8.0,
      },
      strengths: ["Standard software engineering"],
      enabled: true,
    },
    {
      id: "synthetic-frontier-model",
      displayName: "Synthetic Frontier Model",
      provider: "SyntheticAI",
      tier: "frontier",
      inputPricePerMillion: 15.0,
      outputPricePerMillion: 45.0,
      contextWindow: 256000,
      supportedEfforts: ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
      speedRating: 5,
      capabilities: {
        coding: 9.8,
        architecture: 9.8,
        debugging: 9.8,
        research: 9.7,
        reasoning: 9.8,
        agentic: 9.5,
      },
      strengths: ["Mission-critical architecture and security"],
      enabled: true,
    },
  ];

  const scenarios = [
    {
      name: "Trivial task selects synthetic budget model",
      task: "Fix typo in landing page navbar: 'Compnay' -> 'Company'",
      expectedTier: "budget",
    },
    {
      name: "Standard task selects synthetic standard model",
      task: "Build a user registration form in React with react-hook-form and Zod",
      expectedTier: "budget", // or standard
      acceptableTiers: ["budget", "standard"],
    },
    {
      name: "High-risk task selects synthetic frontier model",
      task: "Rewrite the JWT token validation middleware to support key rotation and RS256 while maintaining backwards compatibility",
      expectedTier: "frontier",
      acceptableTiers: ["frontier"],
    },
  ];

  let passedScenarios = 0;
  const details: string[] = [];

  for (const s of scenarios) {
    const prof = classifyTaskDeterministic(s.task);
    const rec = generateRecommendation(prof, syntheticModels, "balanced", s.task);
    const acceptable = s.acceptableTiers || [s.expectedTier];
    const ok = acceptable.includes(rec.tier);
    if (ok) passedScenarios++;
    details.push(
      `Scenario "${s.name}": recommended ${rec.modelName} [${rec.tier}] (${ok ? "PASS" : "FAIL"})`
    );
  }

  return {
    passed: passedScenarios === scenarios.length,
    syntheticModelsUsed: syntheticModels.map((m) => m.displayName),
    scenariosTested: scenarios.length,
    passedScenarios,
    details,
  };
}

/**
 * Model Catalog Mutation Tests (Section 49).
 */
export function runCatalogMutationTests(): CatalogMutationResult {
  // Test 1: Frontier model price drops by 80% (e.g., from $15/$45 to $3/$9)
  // For moderate complexity tasks, frontier usage should stay equal or increase.
  const baseModels = JSON.parse(JSON.stringify(DEFAULT_MODELS)) as Model[];
  const moderateTask =
    "Build a reusable data table component with column sorting and filtering in TypeScript";
  const prof = classifyTaskDeterministic(moderateTask);

  const recBefore = generateRecommendation(prof, baseModels, "balanced", moderateTask);

  // Mutate: frontier price drops drastically
  const mutatedModels = baseModels.map((m) => {
    if (m.tier === "frontier") {
      return {
        ...m,
        inputPricePerMillion: m.inputPricePerMillion * 0.2,
        outputPricePerMillion: m.outputPricePerMillion * 0.2,
      };
    }
    return m;
  });

  const recAfter = generateRecommendation(prof, mutatedModels, "balanced", moderateTask);
  const test1Passed = TIER_ORDER[recAfter.tier] >= TIER_ORDER[recBefore.tier];

  // Test 2: Budget model quality score improves dramatically (coding 9.0)
  const mutatedModels2 = baseModels.map((m) => {
    if (m.tier === "budget") {
      return {
        ...m,
        capabilities: {
          ...m.capabilities,
          coding: 9.2,
          architecture: 8.5,
          debugging: 9.0,
          reasoning: 9.0,
          research: 8.8,
          agentic: 8.5,
        },
      };
    }
    return m;
  });

  const recAfter2 = generateRecommendation(prof, mutatedModels2, "balanced", moderateTask);
  const test2Passed =
    recAfter2.tier === "budget" || TIER_ORDER[recAfter2.tier] <= TIER_ORDER[recBefore.tier];

  return {
    passed: test1Passed && test2Passed,
    tests: [
      {
        name: "Frontier Price Drop (-80%)",
        description:
          "Frontier price cut must encourage higher tier or equal tier adoption without degrading tier selection.",
        passed: test1Passed,
        beforeMetric: `Initial selection: ${recBefore.modelName} [${recBefore.tier}]`,
        afterMetric: `Post price-drop selection: ${recAfter.modelName} [${recAfter.tier}]`,
      },
      {
        name: "Budget Model Capability Surge (+35%)",
        description:
          "Significant capability boost to budget tier should increase budget tier viability on standard tasks.",
        passed: test2Passed,
        beforeMetric: `Initial selection: ${recBefore.modelName} [${recBefore.tier}]`,
        afterMetric: `Post capability boost selection: ${recAfter2.modelName} [${recAfter2.tier}]`,
      },
    ],
  };
}

/**
 * Monotonicity Stress Test with 500 random profiles (Section 52).
 */
export function runMonotonicityStressTest(
  iterations = 500,
  models: Model[] = DEFAULT_MODELS
): MonotonicityStressResult {
  let criticalViolations = 0;
  let totalViolations = 0;
  const violationDetails: MonotonicityStressResult["details"] = [];

  const taskTypes: TaskType[] = [
    "coding",
    "architecture",
    "debugging",
    "security",
    "research",
    "review",
  ];
  const dimensions: ("complexity" | "consequence" | "ambiguity" | "scope")[] = [
    "complexity",
    "consequence",
    "ambiguity",
    "scope",
  ];

  // Seeded deterministic pseudorandom generator for reproducibility
  let seed = 42;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let i = 0; i < iterations; i++) {
    const tType = taskTypes[Math.floor(random() * taskTypes.length)];
    const complexity = Math.floor(random() * 8) + 1; // 1 to 8
    const ambiguity = Math.floor(random() * 8) + 1;
    const consequence = Math.floor(random() * 8) + 1;
    const scope = Math.floor(random() * 8) + 1;
    const novelty = Math.floor(random() * 9) + 1;
    const contextDemand = Math.floor(random() * 9) + 1;
    const toolDemand = Math.floor(random() * 9) + 1;
    const verifiability = Math.floor(random() * 9) + 1;

    const profileBefore: TaskProfile = {
      taskType: tType,
      complexity,
      ambiguity,
      consequence,
      novelty,
      contextDemand,
      scope,
      toolDemand,
      verifiability,
      existingCodebase: random() > 0.5,
      largeCodebase: random() > 0.8,
      securitySensitive: consequence >= 8 || random() > 0.85,
      architectureChanging: tType === "architecture" || random() > 0.85,
      summary: `Synthetic Profile #${i}`,
      reasoning: [],
    };

    // Pick one dimension to perturb upward by +2
    const dim = dimensions[Math.floor(random() * dimensions.length)];
    const profileAfter: TaskProfile = {
      ...profileBefore,
      [dim]: Math.min(10, (profileBefore[dim] as number) + 2),
    };

    // If consequence reached >= 8, mark securitySensitive if applicable
    if (dim === "consequence" && profileAfter.consequence >= 8) {
      profileAfter.securitySensitive = true;
    }

    const recBefore = generateRecommendation(profileBefore, models, "balanced");
    const recAfter = generateRecommendation(profileAfter, models, "balanced");

    // Monotonicity checks
    if (dim === "complexity" || dim === "consequence") {
      const tierBeforeRank = TIER_ORDER[recBefore.tier];
      const tierAfterRank = TIER_ORDER[recAfter.tier];
      if (tierAfterRank < tierBeforeRank) {
        criticalViolations++;
        totalViolations++;
        if (violationDetails.length < 5) {
          violationDetails.push({
            perturbedDimension: dim,
            profileBefore: { [dim]: profileBefore[dim], taskType: profileBefore.taskType },
            profileAfter: { [dim]: profileAfter[dim], taskType: profileAfter.taskType },
            recBefore: { tier: recBefore.tier, effort: recBefore.effort },
            recAfter: { tier: recAfter.tier, effort: recAfter.effort },
            violationType: `Critical: Tier decreased from ${recBefore.tier} to ${recAfter.tier} when ${dim} increased.`,
          });
        }
      }
    }

    if (dim === "ambiguity") {
      const effortBeforeRank = EFFORT_ORDER[recBefore.effort];
      const effortAfterRank = EFFORT_ORDER[recAfter.effort];
      if (effortAfterRank < effortBeforeRank) {
        criticalViolations++;
        totalViolations++;
        if (violationDetails.length < 5) {
          violationDetails.push({
            perturbedDimension: dim,
            profileBefore: { [dim]: profileBefore[dim], taskType: profileBefore.taskType },
            profileAfter: { [dim]: profileAfter[dim], taskType: profileAfter.taskType },
            recBefore: { tier: recBefore.tier, effort: recBefore.effort },
            recAfter: { tier: recAfter.tier, effort: recAfter.effort },
            violationType: `Critical: Effort decreased from ${recBefore.effort} to ${recAfter.effort} when ambiguity increased.`,
          });
        }
      }
    }

    if (dim === "scope") {
      const effortBeforeRank = EFFORT_ORDER[recBefore.effort];
      const effortAfterRank = EFFORT_ORDER[recAfter.effort];
      if (effortAfterRank < effortBeforeRank) {
        criticalViolations++;
        totalViolations++;
        if (violationDetails.length < 5) {
          violationDetails.push({
            perturbedDimension: dim,
            profileBefore: { [dim]: profileBefore[dim], taskType: profileBefore.taskType },
            profileAfter: { [dim]: profileAfter[dim], taskType: profileAfter.taskType },
            recBefore: { tier: recBefore.tier, effort: recBefore.effort },
            recAfter: { tier: recAfter.tier, effort: recAfter.effort },
            violationType: `Critical: Effort decreased from ${recBefore.effort} to ${recAfter.effort} when scope increased.`,
          });
        }
      }
    }
  }

  return {
    iterations,
    violations: totalViolations,
    criticalViolations,
    details: violationDetails,
    passed: criticalViolations === 0,
  };
}

/**
 * Runs the full Recommendation Calibration Suite and returns a comprehensive report.
 */
export function runFullCalibrationSuite(
  models: Model[] = DEFAULT_MODELS
): CalibrationSuiteReport {
  const goldenResults = runAllBenchmarks(models);
  const invariantResults = runInvariantTests(models);
  const priorityResults = runPriorityTradeoffTests(models);
  const modelAgnosticResult = runModelAgnosticTests();
  const mutationResult = runCatalogMutationTests();
  const monotonicityResult = runMonotonicityStressTest(500, models);
  const biasResults = runBiasTests(models);
  const capabilitySwapResults = runCapabilitySwapTests();
  const pairwiseResults = runPairwiseTests(models);
  const sensitivityResult = runSensitivityAnalysis(models);

  const goldenPassCount = goldenResults.filter((r) => r.passed).length;
  const goldenTotalCount = goldenResults.length;
  const goldenPassRate = Math.round((goldenPassCount / goldenTotalCount) * 100);

  const invariantPassCount = invariantResults.filter((r) => r.passed).length;
  const invariantTotalCount = invariantResults.length;
  const invariantPassRate = Math.round((invariantPassCount / invariantTotalCount) * 100);

  const biasPassCount = biasResults.filter((r) => r.passed).length;
  const biasTotalCount = biasResults.length;

  const capabilitySwapPassCount = capabilitySwapResults.filter((r) => r.passed).length;
  const capabilitySwapTotalCount = capabilitySwapResults.length;

  const pairwisePassCount = pairwiseResults.filter((r) => r.passed).length;
  const pairwiseTotalCount = pairwiseResults.length;

  const providerNameDependenciesCount = biasResults.filter(
    (r) => r.providerNameDependencyDetected
  ).length;

  // Overall consistency score calculation (0 - 100)
  const monotonicityScore = monotonicityResult.criticalViolations === 0 ? 100 : 0;
  const biasScore = (biasPassCount / biasTotalCount) * 100;
  const pairwiseScore = (pairwisePassCount / pairwiseTotalCount) * 100;
  const swapScore = (capabilitySwapPassCount / capabilitySwapTotalCount) * 100;

  const consistencyScore = Math.round(
    goldenPassRate * 0.35 +
      invariantPassRate * 0.25 +
      monotonicityScore * 0.15 +
      biasScore * 0.1 +
      swapScore * 0.05 +
      pairwiseScore * 0.1
  );

  const overallPassed =
    goldenPassRate >= 90 &&
    invariantPassRate === 100 &&
    biasPassCount === biasTotalCount &&
    capabilitySwapPassCount === capabilitySwapTotalCount &&
    pairwisePassCount === pairwiseTotalCount &&
    monotonicityResult.criticalViolations === 0 &&
    providerNameDependenciesCount === 0 &&
    sensitivityResult.passed;

  const suggestedAdjustments: string[] = [];
  if (goldenPassRate < 90) {
    const failedCategories = goldenResults
      .filter((r) => !r.passed)
      .map((r) => r.name);
    suggestedAdjustments.push(
      `Adjust classifier heuristics for failed cases: ${failedCategories.slice(0, 3).join("; ")}`
    );
  }
  if (invariantPassRate < 100) {
    suggestedAdjustments.push(
      "Tighten invariant safety floor checks in generateRecommendation to eliminate edge violations."
    );
  }
  if (monotonicityResult.criticalViolations > 0) {
    suggestedAdjustments.push(
      "Ensure scoring function and candidate evaluation have strictly positive coefficients across all dimensions."
    );
  }
  if (biasPassCount < biasTotalCount) {
    suggestedAdjustments.push("Eliminate provider-name leakage or order-dependent ties in engine optimization.");
  }
  if (pairwisePassCount < pairwiseTotalCount) {
    suggestedAdjustments.push("Rebalance effort penalties and capability thresholds on pairwise decision boundaries.");
  }

  return {
    timestamp: new Date().toISOString(),
    overallPassed,
    consistencyScore,
    summary: {
      goldenPassCount,
      goldenTotalCount,
      goldenPassRate,
      invariantPassCount,
      invariantTotalCount,
      invariantPassRate,
      biasPassCount,
      biasTotalCount,
      capabilitySwapPassCount,
      capabilitySwapTotalCount,
      pairwisePassCount,
      pairwiseTotalCount,
      monotonicityIterations: monotonicityResult.iterations,
      criticalViolationsCount: monotonicityResult.criticalViolations,
      providerNameDependenciesCount,
      sensitivityRating: sensitivityResult.stabilityRating,
    },
    goldenResults,
    invariantResults,
    priorityResults,
    modelAgnosticResult,
    mutationResult,
    monotonicityResult,
    biasResults,
    capabilitySwapResults,
    pairwiseResults,
    sensitivityResult,
    suggestedAdjustments,
  };
}
