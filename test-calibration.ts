import { runFullCalibrationSuite } from "./src/lib/calibration/evaluator";

async function main() {
  console.log("\n================================================================================");
  console.log("             MODELPILOT RECOMMENDATION ENGINE CALIBRATION LAB                   ");
  console.log("================================================================================\n");

  const startTime = Date.now();
  const report = runFullCalibrationSuite();
  const elapsedMs = Date.now() - startTime;

  // 1. Golden Benchmarks
  console.log("┌──────────────────────────────────────────────────────────────────────────────┐");
  console.log("│ 1. GOLDEN BENCHMARK TEST SUITE (Sections 35 - 46: 45 Tasks)                  │");
  console.log("├──────────────────────────────────────────────────────────────────────────────┤");
  console.log(
    `│ Executed ${report.summary.goldenTotalCount} Curated Tasks: ${report.summary.goldenPassCount} Passed, ${
      report.summary.goldenTotalCount - report.summary.goldenPassCount
    } Failed (${report.summary.goldenPassRate}% Pass Rate)`.padEnd(79) + "│"
  );
  console.log("└──────────────────────────────────────────────────────────────────────────────┘");

  for (const b of report.goldenResults) {
    const symbol = b.passed ? "✔" : "✖";
    const status = b.passed ? "PASS" : "FAIL";
    console.log(`  ${symbol} [${status}] ${b.id.toUpperCase()}: ${b.name}`);
    console.log(`     Task: "${b.task.length > 70 ? b.task.slice(0, 67) + "..." : b.task}"`);
    console.log(
      `     Score: ${b.recommendation.taskScore}/100 | Tier: ${b.recommendation.tier.toUpperCase()} (${b.recommendation.modelName}) | Effort: ${b.recommendation.effort} | Strategy: ${b.recommendation.strategy} | Certainty: ${b.recommendation.certainty || "clear"}`
    );
    if (!b.passed) {
      for (const f of b.failures) {
        console.log(`     ❌ ${f}`);
      }
    }
  }

  // 2. Logical Invariants
  console.log("\n┌──────────────────────────────────────────────────────────────────────────────┐");
  console.log("│ 2. LOGICAL INVARIANT TESTS (Section 50 - Invariants 1 through 7)            │");
  console.log("├──────────────────────────────────────────────────────────────────────────────┤");
  console.log(
    `│ Verified ${report.summary.invariantTotalCount} Invariants: ${report.summary.invariantPassCount} Passed, ${
      report.summary.invariantTotalCount - report.summary.invariantPassCount
    } Failed (${report.summary.invariantPassRate}% Pass Rate)`.padEnd(79) + "│"
  );
  console.log("└──────────────────────────────────────────────────────────────────────────────┘");

  for (const inv of report.invariantResults) {
    const symbol = inv.passed ? "✔" : "✖";
    console.log(`  ${symbol} [${inv.category.toUpperCase()}] ${inv.name}`);
    console.log(`     Assertion: ${inv.assertion}`);
    console.log(`     Details: ${inv.details}`);
  }

  // 3. Provider-Blind & Anti-Bias Tests
  console.log("\n┌──────────────────────────────────────────────────────────────────────────────┐");
  console.log("│ 3. PROVIDER-BLIND & ANTI-BIAS TESTS (Sections 16 & 17 - 10 Tests)            │");
  console.log("├──────────────────────────────────────────────────────────────────────────────┤");
  console.log(
    `│ Verified ${report.summary.biasTotalCount} Anti-Bias Tests: ${report.summary.biasPassCount} Passed, ${
      report.summary.biasTotalCount - report.summary.biasPassCount
    } Failed | Dependencies Detected: ${report.summary.providerNameDependenciesCount}`.padEnd(79) + "│"
  );
  console.log("└──────────────────────────────────────────────────────────────────────────────┘");

  for (const bias of report.biasResults) {
    const symbol = bias.passed ? "✔" : "✖";
    console.log(`  ${symbol} [${bias.id.toUpperCase()}] ${bias.name}`);
    console.log(`     Details: ${bias.details}`);
  }

  // 4. Capability Swap Tests
  console.log("\n┌──────────────────────────────────────────────────────────────────────────────┐");
  console.log("│ 4. CAPABILITY-SWAP TESTS (Section 6 - 10 Tests)                              │");
  console.log("├──────────────────────────────────────────────────────────────────────────────┤");
  console.log(
    `│ Verified ${report.summary.capabilitySwapTotalCount} Specialist Tests: ${report.summary.capabilitySwapPassCount} Passed, ${
      report.summary.capabilitySwapTotalCount - report.summary.capabilitySwapPassCount
    } Failed`.padEnd(79) + "│"
  );
  console.log("└──────────────────────────────────────────────────────────────────────────────┘");

  for (const swap of report.capabilitySwapResults) {
    const symbol = swap.passed ? "✔" : "✖";
    console.log(`  ${symbol} [${swap.id.toUpperCase()}] ${swap.name}`);
    console.log(`     Expectation: ${swap.expectedBehavior}`);
    console.log(`     Details: ${swap.details}`);
  }

  // 5. Pairwise Recommendation Tests
  console.log("\n┌──────────────────────────────────────────────────────────────────────────────┐");
  console.log("│ 5. PAIRWISE RECOMMENDATION TESTS (Section 20 - 20 Tests)                     │");
  console.log("├──────────────────────────────────────────────────────────────────────────────┤");
  console.log(
    `│ Verified ${report.summary.pairwiseTotalCount} Decision Boundaries: ${report.summary.pairwisePassCount} Passed, ${
      report.summary.pairwiseTotalCount - report.summary.pairwisePassCount
    } Failed`.padEnd(79) + "│"
  );
  console.log("└──────────────────────────────────────────────────────────────────────────────┘");

  for (const pair of report.pairwiseResults) {
    const symbol = pair.passed ? "✔" : "✖";
    const winnerLabel =
      pair.actualWinner === "A"
        ? `${pair.candidateA.modelName} (${pair.candidateA.effort})`
        : `${pair.candidateB.modelName} (${pair.candidateB.effort})`;
    console.log(`  ${symbol} [${pair.id.toUpperCase()}] ${pair.name}`);
    console.log(
      `     Winner: Candidate ${pair.actualWinner} [${winnerLabel}] (Expected: Candidate ${pair.expectedWinner})`
    );
    console.log(`     Rationale: ${pair.rationale}`);
  }

  // 6. Monotonicity Stress Test
  console.log("\n┌──────────────────────────────────────────────────────────────────────────────┐");
  console.log("│ 6. MONOTONICITY STRESS TEST (Section 52 - 500 Random Perturbations)          │");
  console.log("├──────────────────────────────────────────────────────────────────────────────┤");
  console.log(
    `│ Ran ${report.monotonicityResult.iterations} Iterations: ${report.monotonicityResult.criticalViolations} Critical Violations, ${report.monotonicityResult.violations} Total Violations`.padEnd(
      79
    ) + "│"
  );
  console.log("└──────────────────────────────────────────────────────────────────────────────┘");

  // 7. Sensitivity Analysis
  console.log("\n┌──────────────────────────────────────────────────────────────────────────────┐");
  console.log("│ 7. SENSITIVITY ANALYSIS (Sections 21 & 22)                                   │");
  console.log("├──────────────────────────────────────────────────────────────────────────────┤");
  console.log(
    `│ Stability Rating: ${report.sensitivityResult.stabilityRating} | Monotonic Sweeps: ${
      report.sensitivityResult.passed ? "YES" : "NO"
    } | Perturbations: +/-10%`.padEnd(79) + "│"
  );
  console.log("└──────────────────────────────────────────────────────────────────────────────┘");

  for (const sweep of report.sensitivityResult.variableSweeps) {
    console.log(`  ✔ Variable Sweep [${sweep.variable}]: Monotonic = ${sweep.isMonotonic}`);
    console.log(
      `     Transitions: ${sweep.steps.map((s) => `[${s.value}: ${s.tier}/${s.effort}]`).join(" -> ")}`
    );
  }

  // Final Calibration Summary matching Section 27
  const totalTests =
    report.summary.goldenTotalCount +
    report.summary.invariantTotalCount +
    report.summary.biasTotalCount +
    report.summary.capabilitySwapTotalCount +
    report.summary.pairwiseTotalCount +
    report.summary.monotonicityIterations;

  const totalCriticalFailures =
    (report.summary.goldenTotalCount - report.summary.goldenPassCount) +
    (report.summary.invariantTotalCount - report.summary.invariantPassCount) +
    (report.summary.biasTotalCount - report.summary.biasPassCount) +
    (report.summary.capabilitySwapTotalCount - report.summary.capabilitySwapPassCount) +
    (report.summary.pairwiseTotalCount - report.summary.pairwisePassCount) +
    report.summary.criticalViolationsCount;

  console.log("\n================================================================================");
  console.log("                         MODEL PILOT CALIBRATION REPORT                         ");
  console.log("================================================================================");
  console.log(`Total tests: ${totalTests}`);
  console.log(`Golden: ${report.summary.goldenPassCount}/${report.summary.goldenTotalCount}`);
  console.log(`Invariants: ${report.summary.invariantPassCount}/${report.summary.invariantTotalCount}`);
  console.log(`Blind provider: ${report.summary.biasPassCount}/${report.summary.biasTotalCount}`);
  console.log(`Capability swap: ${report.summary.capabilitySwapPassCount}/${report.summary.capabilitySwapTotalCount}`);
  console.log(`Pairwise: ${report.summary.pairwisePassCount}/${report.summary.pairwiseTotalCount}`);
  console.log(`Monotonicity: ${report.summary.monotonicityIterations - report.summary.criticalViolationsCount}/${report.summary.monotonicityIterations}`);
  console.log(`Provider-name dependency: ${report.summary.providerNameDependenciesCount}`);
  console.log(`Critical failures: ${totalCriticalFailures}`);
  console.log(`Execution time: ${elapsedMs} ms`);
  console.log(`Overall: ${report.overallPassed ? "PASS" : "FAIL"}`);
  console.log("================================================================================\n");

  if (report.overallPassed) {
    process.exit(0);
  } else {
    if (report.suggestedAdjustments.length > 0) {
      console.log("Suggested Adjustments:");
      for (const adj of report.suggestedAdjustments) {
        console.log(`  - ${adj}`);
      }
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error running calibration test suite:", err);
  process.exit(1);
});
