import { EffortLevel, TaskProfile } from "@/types";

export type ScoreBreakdown = {
  rawWeightedScore: number;
  modifiersAdded: number;
  finalScore: number;
  effectiveVerifiability: number;
  components: {
    complexityContribution: number;
    ambiguityContribution: number;
    consequenceContribution: number;
    noveltyContribution: number;
    contextContribution: number;
    scopeContribution: number;
    toolContribution: number;
    verifiabilityContribution: number;
  };
  appliedModifiers: string[];
};

/**
 * Calculates the normalized task score (0 - 100) and detailed breakdown
 * based on Plan.md Section 9 rules.
 */
export function calculateTaskScore(profile: TaskProfile): ScoreBreakdown {
  const effectiveVerifiability = Math.max(0, Math.min(10, 10 - profile.verifiability));

  const complexityContribution = profile.complexity * 0.20;
  const ambiguityContribution = profile.ambiguity * 0.15;
  const consequenceContribution = profile.consequence * 0.20;
  const noveltyContribution = profile.novelty * 0.10;
  const contextContribution = profile.contextDemand * 0.15;
  const scopeContribution = profile.scope * 0.10;
  const toolContribution = profile.toolDemand * 0.05;
  const verifiabilityContribution = effectiveVerifiability * 0.05;

  // Each dimension is 0-10, weighted sum is 0-10, so * 10 gives 0-100 base score
  const rawWeightedScore = (
    complexityContribution +
    ambiguityContribution +
    consequenceContribution +
    noveltyContribution +
    contextContribution +
    scopeContribution +
    toolContribution +
    verifiabilityContribution
  ) * 10;

  let modifiersAdded = 0;
  const appliedModifiers: string[] = [];

  if (profile.securitySensitive) {
    modifiersAdded += 10;
    appliedModifiers.push("Security sensitive (+10)");
  }
  if (profile.architectureChanging) {
    modifiersAdded += 8;
    appliedModifiers.push("Architecture changing (+8)");
  }
  if (profile.largeCodebase) {
    modifiersAdded += 5;
    appliedModifiers.push("Large existing codebase (+5)");
  }
  if (profile.existingCodebase) {
    modifiersAdded += 5;
    appliedModifiers.push("Existing codebase conventions (+5)");
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(rawWeightedScore + modifiersAdded)));

  return {
    rawWeightedScore: Math.round(rawWeightedScore * 10) / 10,
    modifiersAdded,
    finalScore,
    effectiveVerifiability,
    components: {
      complexityContribution: Math.round(complexityContribution * 100) / 10,
      ambiguityContribution: Math.round(ambiguityContribution * 100) / 10,
      consequenceContribution: Math.round(consequenceContribution * 100) / 10,
      noveltyContribution: Math.round(noveltyContribution * 100) / 10,
      contextContribution: Math.round(contextContribution * 100) / 10,
      scopeContribution: Math.round(scopeContribution * 100) / 10,
      toolContribution: Math.round(toolContribution * 100) / 10,
      verifiabilityContribution: Math.round(verifiabilityContribution * 100) / 10,
    },
    appliedModifiers,
  };
}

/**
 * Determines abstract recommended effort level according to Plan.md Section 10:
 * Base:
 * 0–29   → LOW
 * 30–54  → MEDIUM
 * 55–74  → HIGH
 * 75–100 → VERY_HIGH
 *
 * Overrides:
 * - securitySensitive && score >= 45 → HIGH minimum
 * - architectureChanging && score >= 45 → HIGH minimum
 * - ambiguity >= 8 → HIGH minimum
 * - consequence >= 9 → HIGH minimum
 * - complexity >= 9 && scope >= 8 → HIGH minimum
 */
export function determineEffortLevel(profile: TaskProfile, score: number): {
  effort: EffortLevel;
  overrideApplied?: string;
} {
  let baseEffort: EffortLevel = "LOW";
  if (score >= 75) {
    baseEffort = "VERY_HIGH";
  } else if (score >= 55) {
    baseEffort = "HIGH";
  } else if (score >= 30) {
    baseEffort = "MEDIUM";
  } else {
    baseEffort = "LOW";
  }

  // Priority order for effort levels
  const effortRank: Record<EffortLevel, number> = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    VERY_HIGH: 4,
  };

  const ensureAtLeast = (target: EffortLevel, reason: string): { effort: EffortLevel; overrideApplied?: string } => {
    if (effortRank[baseEffort] < effortRank[target]) {
      return { effort: target, overrideApplied: reason };
    }
    return { effort: baseEffort };
  };

  if (profile.securitySensitive && score >= 45) {
    return ensureAtLeast("HIGH", "Elevated to HIGH due to security sensitivity on substantial task.");
  }
  if (profile.architectureChanging && score >= 45) {
    return ensureAtLeast("HIGH", "Elevated to HIGH due to architectural scope.");
  }
  if (profile.ambiguity >= 8) {
    return ensureAtLeast("HIGH", "Elevated to HIGH due to high specification ambiguity.");
  }
  if (profile.consequence >= 9) {
    return ensureAtLeast("HIGH", "Elevated to HIGH due to critical blast radius/risk.");
  }
  if (profile.complexity >= 9 && profile.scope >= 8) {
    return ensureAtLeast("HIGH", "Elevated to HIGH due to combined extreme complexity and broad scope.");
  }

  return { effort: baseEffort };
}
