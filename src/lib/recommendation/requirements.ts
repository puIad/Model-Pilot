import {
  CapabilityLevel,
  EffortLevel,
  TaskProfile,
  TaskRequirements,
} from "@/types";

export const CAPABILITY_NUMERIC_THRESHOLDS: Record<CapabilityLevel, number> = {
  BASIC: 6.0,
  STANDARD: 7.5,
  STRONG: 8.8,
  FRONTIER: 9.5,
};

export const LEVEL_RANK: Record<CapabilityLevel, number> = {
  BASIC: 1,
  STANDARD: 2,
  STRONG: 3,
  FRONTIER: 4,
};

export const EFFORT_RANK: Record<EffortLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  VERY_HIGH: 4,
};

/**
 * Layer B: Capability Requirement Engine
 * Derives abstract capability and effort requirements strictly from TaskProfile
 * without knowledge of any model, provider, or catalog.
 */
export function deriveTaskRequirements(profile: TaskProfile): TaskRequirements {
  const rationale: string[] = [];

  // 1. Reliability Buffer based on blast radius (Section 11)
  let reliabilityBuffer = 0.0;
  if (profile.consequence >= 8 || profile.securitySensitive) {
    reliabilityBuffer = 0.8;
    rationale.push("Critical consequence/security requires high reliability buffer (+0.8)");
  } else if (profile.consequence >= 5) {
    reliabilityBuffer = 0.4;
    rationale.push("Moderate consequence applies standard reliability buffer (+0.4)");
  }

  // 2. Minimum Viable Intelligence (Section 9)
  let minimumViableIntelligence: CapabilityLevel = "BASIC";
  if (
    profile.consequence >= 8 ||
    (profile.securitySensitive && profile.consequence >= 7) ||
    (profile.complexity >= 8 && profile.ambiguity >= 4) ||
    (profile.architectureChanging && profile.consequence >= 7)
  ) {
    minimumViableIntelligence = "FRONTIER";
    rationale.push("High blast radius and deep reasoning demand FRONTIER minimum viable intelligence.");
  } else if (
    profile.complexity >= 5 ||
    profile.consequence >= 5 ||
    profile.ambiguity >= 6 ||
    profile.scope >= 6
  ) {
    minimumViableIntelligence = "STRONG";
    rationale.push("Multi-file scope and substantial complexity require STRONG minimum viable intelligence.");
  } else if (
    (profile.complexity >= 3 && profile.verifiability < 8) ||
    profile.consequence >= 4 ||
    profile.scope >= 4
  ) {
    minimumViableIntelligence = "STANDARD";
    rationale.push("Standard implementation requirements demand STANDARD minimum viable intelligence.");
  } else {
    minimumViableIntelligence = "BASIC";
    rationale.push("Trivial/bounded scope requires BASIC minimum viable intelligence.");
  }

  // 3. Minimum Effort Determination (Section 8)
  let minimumEffort: EffortLevel = "LOW";
  if (profile.complexity >= 9 && profile.scope >= 8) {
    minimumEffort = "VERY_HIGH";
    rationale.push("Extreme complexity and broad scope require VERY_HIGH effort.");
  } else if (
    profile.complexity >= 7 ||
    profile.ambiguity >= 7 ||
    profile.consequence >= 8 ||
    (profile.securitySensitive && profile.consequence >= 7) ||
    (profile.architectureChanging && profile.scope >= 6) ||
    profile.novelty >= 8
  ) {
    minimumEffort = "HIGH";
    rationale.push("High complexity, ambiguity, or critical blast radius imposes HIGH minimum reasoning effort.");
  } else if (
    (profile.complexity >= 3 && profile.verifiability < 8) ||
    profile.complexity >= 5 ||
    profile.consequence >= 4 ||
    profile.ambiguity >= 4 ||
    profile.scope >= 4 ||
    profile.taskType === "architecture" ||
    profile.architectureChanging
  ) {
    minimumEffort = "MEDIUM";
    rationale.push("Standard feature logic, architecture, or multi-step tasks require at least MEDIUM effort.");
  } else {
    minimumEffort = "LOW";
    rationale.push("Trivial or highly verifiable task allows LOW effort.");
  }

  // 4. Dimensional Requirements
  // Reasoning
  let reasoning: CapabilityLevel = "BASIC";
  if (
    profile.complexity >= 8 ||
    profile.ambiguity >= 8 ||
    (profile.consequence >= 8 && profile.complexity >= 6) ||
    profile.novelty >= 8
  ) {
    reasoning = "FRONTIER";
  } else if (
    profile.complexity >= 6 ||
    profile.ambiguity >= 5 ||
    profile.consequence >= 6 ||
    profile.novelty >= 6
  ) {
    reasoning = "STRONG";
  } else if (profile.complexity >= 3 || profile.ambiguity >= 3) {
    reasoning = "STANDARD";
  }

  // Coding
  let coding: CapabilityLevel = "BASIC";
  if (profile.complexity >= 8) {
    coding = "FRONTIER";
  } else if (profile.complexity >= 5) {
    coding = "STRONG";
  } else if (profile.complexity >= 3) {
    coding = "STANDARD";
  }

  // Architecture
  let architecture: CapabilityLevel = "BASIC";
  if (
    profile.taskType === "architecture" ||
    profile.architectureChanging ||
    profile.scope >= 8
  ) {
    if (profile.complexity >= 8 || profile.consequence >= 8 || profile.scope >= 8) {
      architecture = "FRONTIER";
    } else if (profile.complexity >= 5 || profile.scope >= 6) {
      architecture = "STRONG";
    } else {
      architecture = "STANDARD";
    }
  } else if (profile.complexity >= 7) {
    architecture = "STRONG";
  } else if (profile.complexity >= 4) {
    architecture = "STANDARD";
  }

  // Debugging
  let debugging: CapabilityLevel = "BASIC";
  if (profile.taskType === "debugging" || profile.ambiguity >= 7) {
    if (profile.complexity >= 7 || profile.ambiguity >= 7 || profile.consequence >= 7) {
      debugging = "FRONTIER";
    } else {
      debugging = "STRONG";
    }
  } else if (profile.complexity >= 6) {
    debugging = "STRONG";
  } else if (profile.complexity >= 3) {
    debugging = "STANDARD";
  }

  // Research / Context
  let research: CapabilityLevel = "BASIC";
  if (profile.taskType === "research" || profile.novelty >= 8 || profile.contextDemand >= 8) {
    research = profile.complexity >= 8 ? "FRONTIER" : "STRONG";
  } else if (profile.complexity >= 5 || profile.novelty >= 5) {
    research = "STANDARD";
  }

  let context: CapabilityLevel = "BASIC";
  if (profile.contextDemand >= 8 || profile.largeCodebase) {
    context = "FRONTIER";
  } else if (profile.contextDemand >= 6 || profile.existingCodebase) {
    context = "STRONG";
  } else if (profile.contextDemand >= 3) {
    context = "STANDARD";
  }

  // Agentic / Tool Demand
  let agentic: CapabilityLevel = "BASIC";
  if (profile.toolDemand >= 8 || profile.scope >= 8) {
    agentic = "FRONTIER";
  } else if (profile.toolDemand >= 5 || profile.scope >= 5) {
    agentic = "STRONG";
  } else if (profile.toolDemand >= 3) {
    agentic = "STANDARD";
  }

  return {
    reasoning,
    coding,
    architecture,
    debugging,
    research,
    agentic,
    context,
    minimumEffort,
    minimumViableIntelligence,
    reliabilityBuffer,
    rationale,
  };
}
