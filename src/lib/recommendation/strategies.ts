import { ExecutionStrategy, StrategyDetails, TaskProfile } from "@/types";

/** Real catalog model names to show in strategy steps. Any role may be missing. */
export interface StrategyModelRoles {
  frontier?: string;
  standard?: string;
  recommended?: string;
  costOptimized?: string;
}

function role(label: string, name?: string): string {
  return name ? `${label} · ${name}` : label;
}

export function determineStrategy(
  profile: TaskProfile,
  score: number,
  roles: StrategyModelRoles = {}
): {
  strategy: ExecutionStrategy;
  details: StrategyDetails;
} {
  // 1. Expert First: Architecture changing, high ambiguity or high novelty
  if (profile.architectureChanging || (profile.taskType === "architecture" && score >= 50)) {
    return {
      strategy: "expert_first",
      details: {
        name: "Expert First Strategy",
        headline: "Frontier Architecture → Standard Implementation",
        description:
          "High structural or architectural impact requires high-tier reasoning upfront to produce an unambiguous technical spec, which can then be executed affordably.",
        steps: [
          {
            title: "1. Architectural Analysis & Schema Design",
            description: "Use a frontier reasoning model to evaluate edge cases, data migration, and interfaces.",
            modelRole: role("Frontier model", roles.frontier),
          },
          {
            title: "2. Scoped Implementation",
            description: "Hand the ratified spec to a cost-effective standard model for code implementation.",
            modelRole: role("Standard model", roles.standard),
          },
          {
            title: "3. Automated Verification",
            description: "Run test suite and regression checks against the new architecture.",
          },
        ],
      },
    };
  }

  // 2. Expert Review: Security sensitive or critical consequence with good testability
  if (profile.securitySensitive || (profile.consequence >= 8 && (profile.taskType === "security" || profile.taskType === "debugging"))) {
    return {
      strategy: "expert_review",
      details: {
        name: "Expert Review Strategy",
        headline: "Standard Build → Frontier Security Audit",
        description:
          "Enables rapid and cost-effective development with a standard model, followed by a dedicated high-reasoning audit to verify security invariants or subtle concurrency races.",
        steps: [
          {
            title: "1. Baseline Implementation / Reproduction",
            description: "Implement functionality or isolated regression test using standard model.",
            modelRole: role("Standard model", roles.standard),
          },
          {
            title: "2. Frontier Audit & Invariant Analysis",
            description: "Run a dedicated audit pass specifically checking for race conditions, bypasses, and state leaks.",
            modelRole: role("Frontier model", roles.frontier),
          },
          {
            title: "3. Hardening & Verification",
            description: "Apply flagged mitigations and verify with security penetration or stress tests.",
          },
        ],
      },
    };
  }

  // 3. Multi-stage: High scope, large codebase, or cross-cutting changes
  if (profile.scope >= 7 || (profile.largeCodebase && profile.complexity >= 7)) {
    return {
      strategy: "multi_stage",
      details: {
        name: "Multi-Stage Phased Execution",
        headline: "Spec → Modular Slices → Integration Tests",
        description:
          "Large repository changes or broad scopes run the risk of context bloat and hallucination if attempted in one giant prompt. Decompose into verifiable sub-phases.",
        steps: [
          {
            title: "1. Discovery & Impact Mapping",
            description: "Analyze affected files, imports, and downstream dependencies.",
          },
          {
            title: "2. Phased Code Changes",
            description: "Execute changes in atomic modular slices, running lint & unit tests per slice.",
            modelRole: role("Recommended model", roles.recommended),
          },
          {
            title: "3. End-to-End Integration & Regression",
            description: "Run full test harness to ensure cross-module compatibility.",
          },
        ],
      },
    };
  }

  // 4. Straightforward low-risk tasks: Single Pass
  if (score < 35 && profile.consequence <= 4 && profile.complexity <= 4) {
    return {
      strategy: "single_pass",
      details: {
        name: "Single Pass Execution",
        headline: "Direct Execution & Quick Sanity Check",
        description:
          "The requirements are well-bounded with minimal ambiguity. A direct single-session execution with the recommended model is the most efficient approach.",
        steps: [
          {
            title: "1. Execute Implementation",
            description: "Feed prompt with relevant files directly to the recommended model.",
            modelRole: role("Recommended model", roles.recommended),
          },
          {
            title: "2. Quick Sanity Check",
            description: "Review generated diff and verify expected behavior.",
          },
        ],
      },
    };
  }

  // 5. Cheap Then Escalate: Good verifiability, moderate consequence
  if (profile.verifiability >= 6 && profile.consequence < 8 && score < 75) {
    return {
      strategy: "cheap_then_escalate",
      details: {
        name: "Cheap Then Escalate",
        headline: "Fast Model First → Verify → Escalate Only on Failure",
        description:
          "Since the task output can be objectively validated with automated tests, starting with a cheaper configuration avoids paying the frontier premium unless necessary.",
        steps: [
          {
            title: "1. Fast Pass",
            description: "Attempt the task with an inexpensive or standard model at low/medium effort.",
            modelRole: role("Cost-optimized model", roles.costOptimized),
          },
          {
            title: "2. Automated Validation",
            description: "Run unit tests, compiler checks, or linters on the diff.",
          },
          {
            title: "3. Conditional Escalation",
            description: "If tests pass, finish. If subtle errors persist across 2 attempts, escalate to frontier reasoning.",
            modelRole: role("Frontier model, only if required", roles.frontier),
          },
        ],
      },
    };
  }

  // Default fallback: Single Pass
  return {
    strategy: "single_pass",
    details: {
      name: "Single Pass Execution",
      headline: "Direct Execution & Quick Sanity Check",
      description:
        "The requirements are well-bounded with minimal ambiguity. A direct single-session execution with the recommended model is the most efficient approach.",
      steps: [
        {
          title: "1. Execute Implementation",
          description: "Feed prompt with relevant files directly to the recommended model.",
          modelRole: role("Recommended model", roles.recommended),
        },
        {
          title: "2. Quick Sanity Check",
          description: "Review generated diff and verify expected behavior.",
        },
      ],
    },
  };
}
