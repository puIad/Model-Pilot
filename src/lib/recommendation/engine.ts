import {
  AlternativeOption,
  CertaintyLevel,
  DecisionTrace,
  EligibleModel,
  EliminatedModel,
  EffortLevel,
  Model,
  Recommendation,
  TaskProfile,
  TaskRequirements,
  UserPriority,
} from "@/types";
import { getPriceTierSymbol } from "../models/catalog";
import {
  CAPABILITY_NUMERIC_THRESHOLDS,
  deriveTaskRequirements,
  EFFORT_RANK,
} from "./requirements";
import { calculateTaskScore } from "./scoring";
import { determineStrategy, StrategyModelRoles } from "./strategies";

export interface RecommendationOptions {
  /** Who produced the TaskProfile. The keyword fallback is coarser than an LLM/Jev, so confidence drops. */
  classifierSource?: "jev" | "llm" | "fallback";
  classifierNote?: string;
  /** Min confidence (0-1) over Jev's key answers. Only present when classifierSource is "jev". */
  classifierConfidence?: number;
  /** Per-provider on/off switch, keyed by `Model.provider`. Missing entries default to enabled. */
  providerEnabled?: Record<string, boolean>;
}

/** Provisional thresholds for the risk-scaled low-confidence rule (JEV-PLAN.md section 3.2), to
 *  be tuned once the live evaluation (section 7) has data. */
export const RISK_SCALED_CONSEQUENCE_THRESHOLD = 7;
export const RISK_SCALED_CONFIDENCE_THRESHOLD = 0.7;

interface CandidateEvaluation {
  model: Model;
  effort: EffortLevel;
  utility: number;
  effectiveCapability: number;
  capabilitySurplus: number;
  costIndex: number;
  speedScore: number;
  reason: string;
}

const EFFORT_BOOST: Record<EffortLevel, number> = {
  LOW: 0.0,
  MEDIUM: 0.3,
  HIGH: 0.7,
  VERY_HIGH: 1.1,
};

const EFFORT_TOKEN_FACTOR: Record<EffortLevel, number> = {
  LOW: 1.0,
  MEDIUM: 1.4,
  HIGH: 2.0,
  VERY_HIGH: 3.0,
};

const EFFORT_LATENCY_DELAY: Record<EffortLevel, number> = {
  LOW: 0.0,
  MEDIUM: 1.2,
  HIGH: 2.8,
  VERY_HIGH: 4.5,
};

/**
 * Three-Layer Recommendation Engine
 * Layer A: Task Profile (Task Understanding)
 * Layer B: Abstract Task Requirements (deriveTaskRequirements)
 * Layer C: Requirements Gate -> Eligible Candidate Optimization -> Decision Trace
 */
export function generateRecommendation(
  profile: TaskProfile,
  models: Model[],
  priority: UserPriority = "balanced",
  taskText = "",
  options: RecommendationOptions = {}
): Recommendation {
  const scoreBreakdown = calculateTaskScore(profile);
  const taskScore = scoreBreakdown.finalScore;

  // Active models: honour each model's own toggle plus the per-provider on/off switch.
  const providerEnabled = options.providerEnabled;
  const availableModels = models.filter(
    (m) => m.enabled !== false && providerEnabled?.[m.provider] !== false
  );
  if (availableModels.length === 0) {
    throw new Error("No enabled models found in the catalog.");
  }

  // Layer B: Derive abstract capability requirements strictly from task characteristics
  const taskRequirements = deriveTaskRequirements(profile);

  // Determine required numeric capability threshold
  let primaryDimension: "coding" | "architecture" | "debugging" | "research" | "reasoning" = "coding";
  if (profile.taskType === "architecture" || profile.architectureChanging) {
    primaryDimension = "architecture";
  } else if (profile.taskType === "debugging") {
    primaryDimension = "debugging";
  } else if (profile.taskType === "research") {
    primaryDimension = "research";
  } else if (profile.taskType === "security" || profile.securitySensitive) {
    primaryDimension = "reasoning";
  }

  const requiredLevel = taskRequirements[primaryDimension] || taskRequirements.reasoning;
  const baseThreshold = CAPABILITY_NUMERIC_THRESHOLDS[requiredLevel];
  const requiredThreshold = Math.min(10.0, baseThreshold + taskRequirements.reliabilityBuffer);

  // Layer C - Step 1: Requirements Gate (Eliminate Ineligible Models)
  const eliminatedModels: EliminatedModel[] = [];
  const eligibleCandidates: CandidateEvaluation[] = [];

  for (const model of availableModels) {
    let modelHasAnyEligibleEffort = false;
    let primaryEliminationReason = "";

    // 1. Minimum Viable Intelligence (MVI) Check
    if (taskRequirements.minimumViableIntelligence === "FRONTIER" && model.tier === "budget") {
      eliminatedModels.push({
        modelId: model.id,
        modelName: model.displayName,
        provider: model.provider,
        reason: `Fails Minimum Viable Intelligence: task demands FRONTIER intelligence, but model is ${model.tier} tier.`,
        failedDimension: "minimumViableIntelligence",
        requiredValue: "FRONTIER",
        modelValue: model.tier,
      });
      continue;
    }

    if (taskRequirements.minimumViableIntelligence === "STRONG" && model.tier === "budget") {
      eliminatedModels.push({
        modelId: model.id,
        modelName: model.displayName,
        provider: model.provider,
        reason: `Fails Minimum Viable Intelligence: task demands STRONG intelligence, but model is ${model.tier} tier.`,
        failedDimension: "minimumViableIntelligence",
        requiredValue: "STRONG",
        modelValue: model.tier,
      });
      continue;
    }

    // 2. Invariant 5: Security Floor Check
    if ((profile.securitySensitive || profile.consequence >= 8) && model.tier === "budget") {
      eliminatedModels.push({
        modelId: model.id,
        modelName: model.displayName,
        provider: model.provider,
        reason: `Security Floor Violation: tasks with security sensitivity or consequence >= 8 strictly prohibit budget tier models.`,
        failedDimension: "securityFloor",
        requiredValue: "standard or frontier",
        modelValue: model.tier,
      });
      continue;
    }

    // 3. Context Window check for large codebase operations
    if (profile.largeCodebase && profile.contextDemand >= 8 && model.contextWindow < 100000) {
      eliminatedModels.push({
        modelId: model.id,
        modelName: model.displayName,
        provider: model.provider,
        reason: `Insufficient Context Window: large codebase task requires at least 100K context, but model only has ${model.contextWindow.toLocaleString()} tokens.`,
        failedDimension: "contextWindow",
        requiredValue: ">= 100,000 tokens",
        modelValue: `${model.contextWindow.toLocaleString()} tokens`,
      });
      continue;
    }

    // 4. Minimum Effort Check across supported efforts
    const supportedPassingEfforts = model.supportedEfforts.filter(
      (e) => EFFORT_RANK[e] >= EFFORT_RANK[taskRequirements.minimumEffort]
    );

    if (supportedPassingEfforts.length === 0) {
      eliminatedModels.push({
        modelId: model.id,
        modelName: model.displayName,
        provider: model.provider,
        reason: `Unsupported Effort: task requires minimum ${taskRequirements.minimumEffort} effort, but model only supports [${model.supportedEfforts.join(
          ", "
        )}].`,
        failedDimension: "minimumEffort",
        requiredValue: taskRequirements.minimumEffort,
        modelValue: model.supportedEfforts.join(", "),
      });
      continue;
    }

    // Evaluate model at the lowest supported passing effort (and all passing efforts if highest_reliability)
    const isArch = profile.taskType === "architecture" || profile.architectureChanging;
    const targetEffort =
      isArch && EFFORT_RANK[taskRequirements.minimumEffort] < EFFORT_RANK["MEDIUM"]
        ? "MEDIUM"
        : taskRequirements.minimumEffort;

    const passingEfforts = model.supportedEfforts
      .filter((e) => {
        if (isArch && e === "LOW") return false;
        return EFFORT_RANK[e] >= EFFORT_RANK[targetEffort];
      })
      .sort((a, b) => EFFORT_RANK[a] - EFFORT_RANK[b]);

    const candidateEfforts =
      priority === "highest_reliability"
        ? passingEfforts
        : passingEfforts.length > 0
        ? [passingEfforts[0]]
        : [];

    for (const effort of candidateEfforts) {
      // Invariant 6: Architecture Floor (Effort LOW prohibited)
      if (
        (profile.taskType === "architecture" || profile.architectureChanging) &&
        effort === "LOW"
      ) {
        continue;
      }

      // Compute task-specific effective capability
      const rawSpecificCap =
        primaryDimension === "reasoning"
          ? model.capabilities.reasoning * 0.6 + model.capabilities.architecture * 0.4
          : model.capabilities[primaryDimension];

      const rawEffectiveCapability = rawSpecificCap + EFFORT_BOOST[effort];
      const effectiveCapability = Math.min(10.0, rawEffectiveCapability);

      // Check against required threshold
      if (effectiveCapability < requiredThreshold - 0.25) {
        primaryEliminationReason = `Insufficient ${primaryDimension} capability: effective score ${effectiveCapability.toFixed(
          1
        )} < required ${requiredThreshold.toFixed(1)} (${requiredLevel} + ${taskRequirements.reliabilityBuffer.toFixed(1)} buffer).`;
        continue;
      }

      // Check reasoning baseline for non-trivial tasks
      if (taskRequirements.reasoning === "FRONTIER" && model.capabilities.reasoning < 9.2) {
        primaryEliminationReason = `Reasoning depth ${model.capabilities.reasoning.toFixed(
          1
        )} is below FRONTIER reasoning threshold (9.2).`;
        continue;
      }

      modelHasAnyEligibleEffort = true;

      // Calculate candidate cost and speed metrics
      const blendedPrice =
        (model.inputPricePerMillion + model.outputPricePerMillion * 2) *
        EFFORT_TOKEN_FACTOR[effort];
      const speedScore = Math.max(1, model.speedRating - EFFORT_LATENCY_DELAY[effort]);
      const costPenalty = Math.log10(1 + blendedPrice) * 3.0;
      const speedBonus = speedScore * 0.3;

      // Tier alignment bonus based on task intelligence demand
      let tierBonus = 0;
      if (taskRequirements.minimumViableIntelligence === "FRONTIER") {
        tierBonus = model.tier === "frontier" ? 4.0 : 0.0;
      } else if (taskRequirements.minimumViableIntelligence === "STRONG") {
        tierBonus = model.tier === "standard" ? 3.0 : model.tier === "frontier" ? 1.5 : -2.0;
      } else if (taskRequirements.minimumViableIntelligence === "STANDARD") {
        tierBonus = model.tier === "standard" ? 3.0 : model.tier === "budget" ? 3.0 : -1.0;
      } else {
        tierBonus = model.tier === "budget" ? 5.0 : -3.0;
      }

      // Capability surplus:
      // On FRONTIER tasks, reward raw capability depth above 9.5 (pinnacle reasoning)
      // On non-frontier tasks, surplus has diminishing returns to prevent expensive overkill
      const isFrontierTask =
        taskRequirements.minimumViableIntelligence === "FRONTIER" || requiredLevel === "FRONTIER";
      const capabilitySurplus = Math.max(0, rawEffectiveCapability - requiredThreshold);
      const pinnacleBonus =
        isFrontierTask && model.tier === "frontier" ? Math.max(0, rawSpecificCap - 9.5) * 3.5 : 0.0;
      const surplusScore = Math.min(2.0, capabilitySurplus * 1.5) + pinnacleBonus;

      // Dynamic consequence & blast-radius scaling (Section 11)
      // High-consequence / high-complexity tasks discount cost & latency in favor of reasoning depth
      const consequenceDampener =
        profile.consequence >= 8 ? 0.35 : profile.consequence >= 6 ? 0.7 : 1.0;
      const complexityLatencyDampener =
        profile.complexity >= 8 ? 0.4 : profile.complexity >= 6 ? 0.75 : 1.0;

      const baseWeights = {
        balanced: { capability: 1.2, reliability: 1.0, cost: 0.8, latency: 0.4 },
        lowest_cost: { capability: 0.7, reliability: 0.4, cost: 2.6, latency: 0.2 },
        highest_reliability: { capability: 2.2, reliability: 2.0, cost: 0.15, latency: 0.2 },
        lowest_latency: { capability: 0.8, reliability: 0.5, cost: 0.3, latency: 2.2 },
      }[priority];

      const weights = {
        capability: baseWeights.capability,
        reliability: baseWeights.reliability,
        cost: priority === "lowest_cost" ? baseWeights.cost : baseWeights.cost * consequenceDampener,
        latency:
          priority === "lowest_latency"
            ? baseWeights.latency
            : baseWeights.latency * complexityLatencyDampener,
      };

      // Tool-heavy tasks favour models that are strong at agentic tool use (0 for tool-light tasks)
      const agenticFit = (profile.toolDemand / 10) * (model.capabilities.agentic - 8.5) * 1.5;

      const utility =
        surplusScore * weights.capability +
        agenticFit * weights.capability +
        tierBonus * weights.reliability -
        costPenalty * weights.cost +
        speedBonus * weights.latency;

      eligibleCandidates.push({
        model,
        effort,
        utility,
        effectiveCapability,
        capabilitySurplus,
        costIndex: blendedPrice,
        speedScore,
        reason: `Satisfies ${requiredLevel} ${primaryDimension} (effective ${effectiveCapability.toFixed(
          1
        )} >= ${requiredThreshold.toFixed(1)}) with ${effort} effort.`,
      });
    }

    if (!modelHasAnyEligibleEffort && primaryEliminationReason) {
      eliminatedModels.push({
        modelId: model.id,
        modelName: model.displayName,
        provider: model.provider,
        reason: primaryEliminationReason,
        failedDimension: primaryDimension,
      });
    }
  }

  // Fallback if no models satisfied hard requirements
  const usedFallback = eligibleCandidates.length === 0;
  if (usedFallback) {
    // The fallback still honours the security floor: budget models are excluded for
    // security-sensitive or high-consequence work whenever a stronger model exists.
    const needsStrongTier =
      profile.securitySensitive ||
      profile.consequence >= 8 ||
      taskRequirements.minimumViableIntelligence === "FRONTIER" ||
      taskRequirements.minimumViableIntelligence === "STRONG";
    const floorPool = needsStrongTier
      ? availableModels.filter((m) => m.tier !== "budget")
      : availableModels;
    const pool = floorPool.length > 0 ? floorPool : availableModels;

    const highestCap = [...pool].sort(
      (a, b) => b.capabilities.reasoning - a.capabilities.reasoning
    )[0];
    // supportedEfforts is user-editable and may be unordered
    const bestEffort = [...highestCap.supportedEfforts].sort(
      (a, b) => EFFORT_RANK[b] - EFFORT_RANK[a]
    )[0];
    eligibleCandidates.push({
      model: highestCap,
      effort: bestEffort,
      utility: 0,
      effectiveCapability: highestCap.capabilities.reasoning,
      capabilitySurplus: 0,
      costIndex: (highestCap.inputPricePerMillion + highestCap.outputPricePerMillion * 2) * 2,
      speedScore: highestCap.speedRating,
      reason: "Fallback candidate: no models met all abstract requirements.",
    });
  }

  // Sort eligible candidates by utility descending
  eligibleCandidates.sort((a, b) => b.utility - a.utility);
  const best = eligibleCandidates[0];

  // Pick Cheaper Alternative
  const cheaperMatch = eligibleCandidates.find(
    (c) =>
      c.costIndex < best.costIndex * 0.75 &&
      (c.model.id !== best.model.id || c.effort !== best.effort)
  );
  let cheaperAlternative: AlternativeOption | undefined = undefined;
  if (cheaperMatch) {
    const savingsPercent = Math.round((1 - cheaperMatch.costIndex / best.costIndex) * 100);
    cheaperAlternative = {
      modelId: cheaperMatch.model.id,
      modelName: cheaperMatch.model.displayName,
      provider: cheaperMatch.model.provider,
      effort: cheaperMatch.effort,
      relativeCost: getPriceTierSymbol(cheaperMatch.model.inputPricePerMillion),
      explanation:
        cheaperMatch.model.id === best.model.id
          ? `Downscale reasoning effort to ${cheaperMatch.effort} to save tokens.`
          : `Use ${cheaperMatch.model.displayName} (${cheaperMatch.effort}) to cut estimated cost by ~${Math.max(
              15,
              savingsPercent
            )}% while remaining within eligible capability boundaries.`,
    };
  }

  // Pick Reliability Alternative
  // Prefer a different, stronger model. Only when none qualifies, offer the same model at higher effort.
  const isStronger = (c: CandidateEvaluation) =>
    c.effectiveCapability > best.effectiveCapability + 0.15 ||
    (c.model.tier === "frontier" && best.model.tier !== "frontier");
  const reliabilityMatch =
    eligibleCandidates.find((c) => c.model.id !== best.model.id && isStronger(c)) ??
    eligibleCandidates.find(
      (c) =>
        c.model.id === best.model.id &&
        EFFORT_RANK[c.effort] > EFFORT_RANK[best.effort] &&
        c.effectiveCapability > best.effectiveCapability
    );
  let reliabilityAlternative: AlternativeOption | undefined = undefined;
  if (reliabilityMatch) {
    reliabilityAlternative = {
      modelId: reliabilityMatch.model.id,
      modelName: reliabilityMatch.model.displayName,
      provider: reliabilityMatch.model.provider,
      effort: reliabilityMatch.effort,
      relativeCost: getPriceTierSymbol(reliabilityMatch.model.inputPricePerMillion),
      explanation:
        reliabilityMatch.model.id === best.model.id
          ? `Raise reasoning effort to ${reliabilityMatch.effort} for extra depth on the same model.`
          : `Upgrade to ${reliabilityMatch.model.displayName} (${reliabilityMatch.effort}) for maximum reasoning depth and risk mitigation.`,
    };
  }

  // Certainty Determination & Close Call Detection (Section 14)
  let certainty: CertaintyLevel = "clear";
  let certaintyExplanation = "";
  if (usedFallback) {
    certainty = "insufficient_data";
    certaintyExplanation = `No enabled model met all requirements for this task, so ${best.model.displayName} (${best.effort}) is shown as the strongest available option. Enable a stronger model in the catalog or lower the task requirements.`;
  } else if (eligibleCandidates.length > 1) {
    const runnerUp = eligibleCandidates[1];
    const capDiff = Math.abs(best.effectiveCapability - runnerUp.effectiveCapability);
    const utilityDiff = Math.abs(best.utility - runnerUp.utility);

    if (capDiff <= 0.2 && utilityDiff <= 0.45) {
      certainty = "close_call";
      certaintyExplanation = `No decisive winner between ${best.model.displayName} (${best.effort}) and ${runnerUp.model.displayName} (${runnerUp.effort}). Both satisfy the required capability. The difference is primarily cost/latency rather than capability.`;
    } else if (utilityDiff <= 0.85) {
      certainty = "moderate";
    }
  }

  // Strategy Details
  const strategyInfo = determineStrategy(
    profile,
    taskScore,
    pickStrategyRoles(availableModels, eligibleCandidates, best, cheaperAlternative?.modelName)
  );

  // Confidence Calculation
  const confidence = calculateConfidence(
    taskText,
    profile,
    certainty,
    options.classifierSource,
    usedFallback,
    options.classifierConfidence
  );

  // Risk-scaled low-confidence rule (JEV-PLAN.md section 3.2): on high-consequence tasks where
  // Jev's own answer confidence is low, promote the reliability alternative to the headline and
  // surface a warning. Low-stakes tasks ignore low classifier confidence. Thresholds are
  // provisional until tuned against the live evaluation (section 7).
  let lowConfidenceWarning: string | undefined;
  if (
    options.classifierSource === "jev" &&
    options.classifierConfidence !== undefined &&
    profile.consequence >= RISK_SCALED_CONSEQUENCE_THRESHOLD &&
    options.classifierConfidence < RISK_SCALED_CONFIDENCE_THRESHOLD &&
    reliabilityAlternative
  ) {
    lowConfidenceWarning = `Low classifier confidence: consider adding detail. Jev's confidence on this high-consequence task was ${Math.round(
      options.classifierConfidence * 100
    )}%, below the ${Math.round(RISK_SCALED_CONFIDENCE_THRESHOLD * 100)}% threshold used for consequence >= ${RISK_SCALED_CONSEQUENCE_THRESHOLD}/10 tasks.`;

    // Promote the reliability alternative to the headline; the previous headline becomes the
    // "cheaper" alternative so both options remain visible.
    const promoted = reliabilityMatch!;
    cheaperAlternative = {
      modelId: best.model.id,
      modelName: best.model.displayName,
      provider: best.model.provider,
      effort: best.effort,
      relativeCost: getPriceTierSymbol(best.model.inputPricePerMillion),
      explanation: `Originally recommended, but classifier confidence was low for this high-consequence task; ${promoted.model.displayName} was promoted for extra reliability.`,
    };
    reliabilityAlternative = undefined;
    eligibleCandidates.splice(eligibleCandidates.indexOf(promoted), 1);
    eligibleCandidates.unshift(promoted);
  }

  const finalBest = eligibleCandidates[0];

  // Decision Trace Construction (Section 15)
  const traceSteps: string[] = [
    `1. Abstract Requirements: reasoning=${taskRequirements.reasoning}, ${primaryDimension}=${requiredLevel}, minimumEffort=${taskRequirements.minimumEffort}, MVI=${taskRequirements.minimumViableIntelligence} (threshold=${requiredThreshold.toFixed(1)} with +${taskRequirements.reliabilityBuffer.toFixed(1)} buffer).`,
    `2. Requirements Gate: Evaluated ${availableModels.length} models. Eliminated ${eliminatedModels.length} models that failed capability, effort, or security floor gates.`,
    `3. Optimization: Compared ${eligibleCandidates.length} eligible configurations under ${priority} priority.`,
    `4. Decision: Selected ${finalBest.model.displayName} with ${finalBest.effort} effort. ${finalBest.reason}`,
  ];
  if (lowConfidenceWarning) traceSteps.push(`5. ${lowConfidenceWarning}`);

  const decisionTrace: DecisionTrace = {
    summary: `Selected ${finalBest.model.displayName} (${finalBest.effort}) as the optimal eligible candidate under ${priority} priority.`,
    steps: traceSteps,
    certaintyExplanation: [certaintyExplanation, lowConfidenceWarning].filter(Boolean).join(" ") || undefined,
  };

  const eligibleSummary: EligibleModel[] = eligibleCandidates.map((c) => ({
    modelId: c.model.id,
    modelName: c.model.displayName,
    provider: c.model.provider,
    effort: c.effort,
    tier: c.model.tier,
    matchQuality: Math.min(100, Math.round(c.effectiveCapability * 10)),
    costIndex: Math.round(c.costIndex * 100) / 100,
    speedRating: c.speedScore,
    reason: c.reason,
  }));

  // Why Explanation
  const reason = generateWhyExplanation(
    profile,
    taskScore,
    finalBest.model,
    finalBest.effort,
    priority,
    taskRequirements,
    [certaintyExplanation, lowConfidenceWarning].filter(Boolean).join(" ")
  );

  return {
    modelId: finalBest.model.id,
    modelName: finalBest.model.displayName,
    provider: finalBest.model.provider,
    tier: finalBest.model.tier,
    effort: finalBest.effort,
    confidence: confidence.level,
    confidenceScore: confidence.score,
    certainty,
    reason,
    taskScore,
    taskProfile: profile,
    taskRequirements,
    eliminatedModels,
    eligibleModels: eligibleSummary,
    decisionTrace,
    cheaperAlternative,
    reliabilityAlternative,
    strategy: strategyInfo.strategy,
    strategyDetails: strategyInfo.details,
    modelPricing: {
      inputPricePerMillion: finalBest.model.inputPricePerMillion,
      outputPricePerMillion: finalBest.model.outputPricePerMillion,
      contextWindow: finalBest.model.contextWindow,
    },
    costBaseline: computeCostBaseline(availableModels, finalBest.model),
    classifierSource: options.classifierSource,
    classifierNote: options.classifierNote,
    classifierConfidence: options.classifierConfidence,
    timestamp: new Date().toISOString(),
  };
}

/** List-price blend for a coding workload (input-heavy). Effort is ignored on purpose. */
function blendedListPrice(model: Model): number {
  return (model.inputPricePerMillion * 3 + model.outputPricePerMillion) / 4;
}

function computeCostBaseline(availableModels: Model[], chosen: Model) {
  const priciest = availableModels.reduce((a, b) =>
    blendedListPrice(b) > blendedListPrice(a) ? b : a
  );
  const baseline = blendedListPrice(priciest);
  const savingsPercent =
    baseline > 0 ? Math.max(0, Math.round((1 - blendedListPrice(chosen) / baseline) * 100)) : 0;
  return { modelName: priciest.displayName, savingsPercent };
}

/** Names the real catalog models behind the generic roles used by strategy steps. */
function pickStrategyRoles(
  availableModels: Model[],
  eligible: CandidateEvaluation[],
  best: CandidateEvaluation,
  cheaperName?: string
): StrategyModelRoles {
  const byTier = (tier: Model["tier"]) => {
    const fromEligible = eligible.find((c) => c.model.tier === tier)?.model;
    if (fromEligible) return fromEligible.displayName;
    return availableModels
      .filter((m) => m.tier === tier)
      .sort((a, b) => blendedListPrice(a) - blendedListPrice(b))[0]?.displayName;
  };
  return {
    frontier: byTier("frontier"),
    standard: byTier("standard"),
    recommended: best.model.displayName,
    costOptimized: cheaperName ?? best.model.displayName,
  };
}

function calculateConfidence(
  taskText: string,
  profile: TaskProfile,
  certainty: CertaintyLevel,
  classifierSource: "jev" | "llm" | "fallback" | undefined,
  usedFallback: boolean,
  classifierConfidence?: number
): { level: "high" | "medium" | "low"; score: number } {
  let confScore = 88;

  const textLength = taskText.trim().length;
  if (textLength < 25) confScore -= 20;
  else if (textLength > 120) confScore += 5;

  if (profile.ambiguity >= 7) confScore -= 12;
  else if (profile.ambiguity <= 3) confScore += 5;

  if (certainty === "close_call") confScore -= 10;
  else if (certainty === "moderate") confScore -= 4;

  if (classifierSource === "jev" && classifierConfidence !== undefined) {
    // Real per-task signal from Jev's answer confidence, replacing the flat fallback penalty
    // below. Centered so a 0.7 classifier confidence (the risk-scaled threshold) is neutral.
    confScore += Math.round((classifierConfidence - 0.7) * 40);
  } else if (classifierSource === "fallback") {
    // The keyword classifier is coarser than an LLM/Jev read of the task
    confScore -= 8;
  }

  // No configuration met the requirements, so the pick is a best guess
  if (usedFallback) confScore -= 30;

  confScore = Math.max(30, Math.min(98, Math.round(confScore)));

  let level: "high" | "medium" | "low" = "high";
  if (confScore < 60) level = "low";
  else if (confScore < 80) level = "medium";

  return { level, score: confScore };
}

function generateWhyExplanation(
  profile: TaskProfile,
  score: number,
  model: Model,
  effort: EffortLevel,
  priority: UserPriority,
  requirements: TaskRequirements,
  certaintyExplanation?: string
): string {
  const sentences: string[] = [];

  if (score <= 32) {
    sentences.push(
      `This task has low complexity (${profile.complexity}/10) with bounded scope and high verifiability.`
    );
  } else if (score <= 58) {
    sentences.push(
      `This task presents moderate complexity (${profile.complexity}/10) requiring standard implementation reasoning.`
    );
  } else if (score <= 78) {
    sentences.push(
      `This is a demanding ${profile.taskType} challenge with substantial scope (${profile.scope}/10) and consequence (${profile.consequence}/10).`
    );
  } else {
    sentences.push(
      `This is a mission-critical ${profile.taskType} challenge with high consequence (${profile.consequence}/10) requiring frontier reasoning.`
    );
  }

  if (profile.securitySensitive) {
    sentences.push(
      `Because this touches security-sensitive components, ${effort} effort is required to prevent subtle vulnerabilities.`
    );
  } else if (profile.architectureChanging) {
    sentences.push(
      `Due to architectural implications, elevated reasoning ensures clean cross-system interfaces.`
    );
  } else if (profile.ambiguity >= 8) {
    sentences.push(
      `High ambiguity (${profile.ambiguity}/10) necessitates ${effort} effort to resolve requirements.`
    );
  }

  sentences.push(
    `${model.displayName} was selected because it satisfies the ${requirements.minimumViableIntelligence} requirement and provides the optimal balance under ${priority} priority.`
  );

  if (certaintyExplanation) {
    sentences.push(certaintyExplanation);
  }

  return sentences.join(" ");
}
