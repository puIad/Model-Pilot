import { classifyTaskDeterministic } from "./src/lib/analyzer/fallback-classifier";
import { DEFAULT_MODELS } from "./src/lib/models/catalog";
import { generateRecommendation } from "./src/lib/recommendation/engine";
import { calculateTaskScore, determineEffortLevel } from "./src/lib/recommendation/scoring";

const testCases = [
  {
    name: "Test 1: Rename variable across three files",
    input: "Rename a variable across three files.",
    context: { existingCodebase: true },
    expected: {
      taskType: "coding",
      maxComplexity: 4,
      maxConsequence: 4,
      effort: "LOW",
      modelTier: "budget",
    },
  },
  {
    name: "Test 2: Reusable dashboard component with design system",
    input: "Build a reusable dashboard component using our existing design system.",
    context: { existingCodebase: true },
    expected: {
      taskType: "coding",
      minComplexity: 4,
      maxComplexity: 7,
      effort: "MEDIUM",
      modelTier: "standard",
    },
  },
  {
    name: "Test 3: Database multi-tenancy redesign",
    input: "Redesign our database to support multi-tenancy without breaking existing customer data.",
    context: { existingCodebase: true, largeCodebase: true },
    expected: {
      taskType: "architecture",
      minConsequence: 7,
      minScope: 6,
      effort: ["HIGH", "VERY_HIGH"],
      strategy: "expert_first",
    },
  },
  {
    name: "Test 4: Payment webhook intermittent duplicate processing",
    input: "Our payment webhook occasionally processes the same payment twice. Find the root cause and fix it.",
    context: { existingCodebase: true },
    expected: {
      taskType: "debugging",
      minConsequence: 7,
      effort: ["HIGH", "VERY_HIGH"],
    },
  },
  {
    name: "Test 5: Button component matching existing style",
    input: "Write a button component matching the existing style.",
    context: { existingCodebase: true },
    expected: {
      taskType: "coding",
      maxComplexity: 4,
      maxConsequence: 4,
      effort: "LOW",
      modelTier: "budget",
    },
  },
  {
    name: "Test 6: Security audit of auth and authorization",
    input: "Perform a security audit of our authentication and authorization system and identify paths to privilege escalation.",
    context: { existingCodebase: true, largeCodebase: true },
    expected: {
      taskType: "security",
      minConsequence: 8,
      effort: ["HIGH", "VERY_HIGH"],
      strategy: "expert_review",
    },
  },
];

console.log("=== RUNNING MODELPILOT TEST SUITE (Plan.md Section 29) ===\n");
let passed = 0;

for (const tc of testCases) {
  console.log(`▶ ${tc.name}`);
  const profile = classifyTaskDeterministic(tc.input, tc.context);
  const scoreBreakdown = calculateTaskScore(profile);
  const effortResult = determineEffortLevel(profile, scoreBreakdown.finalScore);
  const rec = generateRecommendation(profile, DEFAULT_MODELS, "balanced", tc.input);

  console.log(`  - TaskType: ${profile.taskType}`);
  console.log(`  - Complexity: ${profile.complexity}/10, Ambiguity: ${profile.ambiguity}/10, Consequence: ${profile.consequence}/10`);
  console.log(`  - Final Task Score: ${rec.taskScore}/100`);
  console.log(`  - Recommended Model: ${rec.modelName} (${rec.provider}) [${rec.tier}]`);
  console.log(`  - Recommended Effort: ${rec.effort}`);
  console.log(`  - Strategy: ${rec.strategyDetails.name}`);
  console.log(`  - Confidence: ${rec.confidence.toUpperCase()} (${rec.confidenceScore}%)`);

  let testOk = true;

  if (tc.expected.taskType && profile.taskType !== tc.expected.taskType) {
    console.error(`  ❌ Expected taskType ${tc.expected.taskType}, got ${profile.taskType}`);
    testOk = false;
  }
  if (tc.expected.maxComplexity && profile.complexity > tc.expected.maxComplexity) {
    console.error(`  ❌ Expected complexity <= ${tc.expected.maxComplexity}, got ${profile.complexity}`);
    testOk = false;
  }
  if (tc.expected.minComplexity && profile.complexity < tc.expected.minComplexity) {
    console.error(`  ❌ Expected complexity >= ${tc.expected.minComplexity}, got ${profile.complexity}`);
    testOk = false;
  }
  if (tc.expected.maxConsequence && profile.consequence > tc.expected.maxConsequence) {
    console.error(`  ❌ Expected consequence <= ${tc.expected.maxConsequence}, got ${profile.consequence}`);
    testOk = false;
  }
  if (tc.expected.minConsequence && profile.consequence < tc.expected.minConsequence) {
    console.error(`  ❌ Expected consequence >= ${tc.expected.minConsequence}, got ${profile.consequence}`);
    testOk = false;
  }
  if (tc.expected.effort) {
    const validEfforts = Array.isArray(tc.expected.effort) ? tc.expected.effort : [tc.expected.effort];
    if (!validEfforts.includes(rec.effort)) {
      console.error(`  ❌ Expected effort in [${validEfforts.join(", ")}], got ${rec.effort}`);
      testOk = false;
    }
  }
  if (tc.expected.modelTier && rec.tier !== tc.expected.modelTier) {
    console.error(`  ❌ Expected model tier ${tc.expected.modelTier}, got ${rec.tier}`);
    testOk = false;
  }
  if (tc.expected.strategy && rec.strategy !== tc.expected.strategy) {
    console.error(`  ❌ Expected strategy ${tc.expected.strategy}, got ${rec.strategy}`);
    testOk = false;
  }

  if (testOk) {
    console.log(`  ✅ PASSED\n`);
    passed++;
  } else {
    console.log(`  ❌ FAILED\n`);
  }
}

console.log(`=== SUMMARY: ${passed} / ${testCases.length} tests passed ===`);
if (passed !== testCases.length) {
  process.exit(1);
}
