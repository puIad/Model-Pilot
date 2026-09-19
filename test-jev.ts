// Opt-in live evaluation: runs the golden set through Jev and the keyword classifier.
// Usage: npx tsx --env-file=.env.local test-jev.ts
import { GOLDEN_BENCHMARK_SUITE } from "./src/lib/calibration/golden-dataset";
import { classifyTaskWithJev } from "./src/lib/analyzer/jev-classifier";
import { classifyTaskDeterministic } from "./src/lib/analyzer/fallback-classifier";
import { generateRecommendation } from "./src/lib/recommendation/engine";
import { DEFAULT_MODELS } from "./src/lib/models/catalog";
import type { TaskProfile } from "./src/types";

const DIMS = ["complexity", "ambiguity", "consequence", "scope"] as const;
// Jev scores land on 0/2.5/5/7.5/10, so also report a +-1 tolerance.
function check(p: TaskProfile, c: (typeof GOLDEN_BENCHMARK_SUITE)[number], tol: number) {
  const fails: string[] = [];
  if (!c.expected.taskTypes.includes(p.taskType)) fails.push(`type=${p.taskType}`);
  for (const d of DIMS) {
    const r = c.expected[d];
    if (p[d] < r.min - tol || p[d] > r.max + tol) fails.push(`${d}=${p[d]} [${r.min}..${r.max}]`);
  }
  return fails;
}

async function main() {
  let jevStrict = 0, jevTol = 0, kwStrict = 0, kwTol = 0, sameModel = 0, ok = 0;
  let tokIn = 0, tokOut = 0;
  const lat: number[] = [];
  const confs: number[] = [];
  for (const c of GOLDEN_BENCHMARK_SUITE) {
    const kw = classifyTaskDeterministic(c.task, c.context);
    const t0 = Date.now();
    const j = await classifyTaskWithJev(c.task, c.context ?? {});
    lat.push(Date.now() - t0);
    if (!check(kw, c, 0).length) kwStrict++;
    if (!check(kw, c, 1).length) kwTol++;
    if (!j.ok) { console.log(`${c.id} JEV FAILED: ${j.fallbackReason}`); continue; }
    ok++;
    confs.push(j.confidence);
    tokIn += j.usage?.inputTokens ?? 0; tokOut += j.usage?.outputTokens ?? 0;
    const s = check(j.profile, c, 0), t = check(j.profile, c, 1);
    if (!s.length) jevStrict++;
    if (!t.length) jevTol++;
    const mj = generateRecommendation(j.profile, DEFAULT_MODELS, "balanced", c.task).modelId;
    const mk = generateRecommendation(kw, DEFAULT_MODELS, "balanced", c.task).modelId;
    if (mj === mk) sameModel++;
    console.log(`${c.id} conf=${j.confidence.toFixed(2)} ${t.length ? "MISS(±1): " + t.join(", ") : "ok"}${mj !== mk ? `  model jev=${mj} kw=${mk}` : ""}`);
  }
  const n = GOLDEN_BENCHMARK_SUITE.length;
  lat.sort((a, b) => a - b);
  console.log(`\nJev calls ok: ${ok}/${n}`);
  console.log(`Jev pass: strict ${jevStrict}/${n}, ±1 ${jevTol}/${n}`);
  console.log(`Keyword pass: strict ${kwStrict}/${n}, ±1 ${kwTol}/${n}`);
  console.log(`Same recommended model: ${sameModel}/${ok}`);
  console.log(`Latency ms: median ${lat[Math.floor(n / 2)]}, max ${lat[n - 1]}`);
  console.log(`Confidence: min ${Math.min(...confs).toFixed(2)}, <0.7: ${confs.filter((x) => x < 0.7).length}`);
  console.log(`Tokens: in ${tokIn}, out ${tokOut}`);
}
main();
