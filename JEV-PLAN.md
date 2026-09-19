# Adding Jev (TypeSafe) to ModelPilot: implementation plan

Plan only, nothing here is built yet. API facts come from the live TypeSafe docs
(`docs.typesafe.ai`, read 2026-09-19). The npm package name `@typesafe-ai/sdk` and the
exact helper names (`choice`, `noul`, `score`) should be confirmed against the installed
package types before coding.

## 1. What Jev does here

Jev is a fast judgment model: it takes `state` plus typed questions and returns typed answers
with probabilities. It does not write text. That matches ModelPilot's existing rule
("the LLM classifies, code decides"), so **Jev replaces the classifier, and the engine keeps
choosing the model.**

```
task text + context flags
        │
        ▼
 ┌─ Jev (one call) ─┐   fail / no key   ┌─ OpenAI-compatible LLM (optional, today's path) ─┐   fail
 │ 8 Scores         │ ────────────────► │                                                  │ ──────► keyword classifier
 │ 2 Noul, 1 Choice │                   └──────────────────────────────────────────────────┘        (offline, always works)
 └──────────────────┘
        │  TaskProfile + classifier confidence
        ▼
 deterministic engine (unchanged; 606 calibration tests still apply)
```

## 2. The one Jev call

`POST https://api.typesafe.ai/v1/systemone`, model `jev-latest`, key in `TYPESAFE_API_KEY`
(server only). State: `{ task, newProject, existingCodebase, largeCodebase }`.
All questions go in the same request; they run in parallel.

| Answer | Primitive | Maps to |
|---|---|---|
| complexity, ambiguity, consequence, novelty, contextDemand, scope, toolDemand, verifiability | **Score**, 5 levels (0-4) each, concrete situations per level | `TaskProfile` field = `score / 4 * 10` |
| securitySensitive | **Noul** | `noul >= 0.5` |
| architectureChanging | **Noul** | `noul >= 0.5` |
| taskType | **Choice** over the 10 existing types plus descriptions | `taskType` |

- Level text must describe situations, not adjectives. Example for consequence:
  0 "throwaway or easily reverted", 2 "a bug breaks a feature but a workaround exists",
  4 "data loss, money movement, or a security breach if wrong".
- `existingCodebase` / `largeCodebase` stay user-controlled (from the context selector); Jev
  only sees them as state.
- `summary` and `reasoning[]` are not Jev outputs (it returns no prose). Build them in code from
  the answers, the same way the keyword classifier does.
- Levels are written once in `src/lib/analyzer/jev-questions.ts` so they are easy to tune.

## 3. Confidence and escalation (code, not Jev)

Score/Choice answers carry `confidence` (0-1); Noul does not (use distance from 0.5).

1. `classifierConfidence` = min confidence over consequence, ambiguity, complexity and the
   task-type Choice. Pass it into `generateRecommendation` next to `classifierSource`, and use it
   in `calculateConfidence` (replaces today's flat "-8 for keyword fallback" with a real signal).
2. Risk-scaled rule, as TypeSafe recommends: if `consequence >= 7` and `classifierConfidence < 0.7`,
   promote the reliability alternative to the headline and show "Low classifier confidence:
   consider adding detail". Low-stakes tasks ignore low confidence.
3. For safety dimensions (consequence, security) optionally read the upper tail of the
   probability distribution instead of the mean, so a hedged answer errs toward caution.
   Evaluate on the golden set before turning it on.

## 4. Optional phase 2: tie-break close calls

When the engine reports `certainty === "close_call"`, send a second Jev **Choice** whose options are
only the top 2-3 candidates the engine already made eligible (name, tier, price, strengths from the
catalog as state). Jev cannot pick an ineligible model, so the safety gates stay in code. Ship only
if it beats the current utility ordering on the evaluation set (section 7); otherwise skip it.

## 5. Where it goes in the code

| File | Change |
|---|---|
| `src/lib/analyzer/jev-questions.ts` (new) | question definitions and level text |
| `src/lib/analyzer/jev-classifier.ts` (new) | build state, call SDK, map answers to `TaskProfile`, return `{ profile, confidence, usage }`. 8 s timeout, one retry on 429/529 with backoff, 401 or other failure returns a `fallbackReason` |
| `src/lib/analyzer/classifier.ts` | try Jev first when `TYPESAFE_API_KEY` is set, then the existing OpenAI-compatible path, then keywords. Result gains `source: "jev" \| "llm" \| "fallback"` |
| `src/types/index.ts`, `engine.ts` | `classifierSource` gains `"jev"`; add `classifierConfidence`; use it in confidence and the risk-scaled rule |
| `recommendation-card.tsx`, `task-profile.tsx` | badge "Classified by Jev"; show per-dimension confidence; low-confidence banner |
| `settings/page.tsx` | "TypeSafe (Jev)" status card (key present on server: yes/no via a small `/api/classifier/status` route; never return the key) |
| `.env.example`, `README.md` | document `TYPESAFE_API_KEY` |

Key handling: the TypeSafe key lives only in server env. Do **not** add a browser-supplied
TypeSafe key; the host is hard-coded so a client can never redirect it (the leak fixed in the
review must not come back).

## 6. Prerequisites (from the review), status

| Item | Status |
|---|---|
| Live sync no longer imports old models or duplicates | done |
| Server key cannot be sent to a client URL | done |
| Classifier source shown in the UI | done |
| Add OpenAI (ChatGPT) models with capability scores and a ChatGPT filter tab | **todo**, needs a decision on which models and their scores |
| Per-provider on/off switches (Gemini / Claude / ChatGPT) on top of the per-model toggle | **todo**, small (settings flag filtered in `generateRecommendation`) |
| CLI-flag case for OpenAI | done (`codex --model`) |

## 7. Testing and evaluation

- **Unit (offline):** mock `fetch`; check answer-to-profile mapping (level 4 becomes 10, Noul
  threshold, Choice), error paths (401, 422, 429, timeout) fall back with a reason, and the key is
  never sent anywhere but `api.typesafe.ai`. Add to `test-regressions.ts`.
- **Existing suites:** the 606 calibration tests operate on `TaskProfile`, so they keep running
  unchanged and still guard the engine.
- **Live evaluation (needs a key, opt-in script `test-jev.ts`):** run the 45 golden tasks and the six
  Plan.md sample tasks through Jev. Compare Jev's profile and final recommendation against the
  keyword classifier and the golden expectations. Report agreement, disagreements, latency per
  call and tokens used. Tune level text, then decide the confidence thresholds from this data
  (TypeSafe's cookbook thresholds are examples, not rules).
- Manual: the app must still work with no key at all.

## 8. Rollout order

1. Prerequisites: provider switches, OpenAI models (once decided).
2. `jev-classifier` plus mocked tests, behind the `TYPESAFE_API_KEY` check.
3. Live evaluation on the golden set, tune questions.
4. Confidence signal and low-confidence UI.
5. Phase 2 tie-break, only if evaluation supports it.

## 8a. Execution scope for this pass (review, 2026-09-19)

Build now: rollout steps 2 and 4, plus the provider on/off switches from step 1 (small, no
decision needed). Defaults assumed for open decisions: recommend only (1), engine decides (2),
keyword fallback kept (3), Jev used whenever the server key is set (4).

Do **not** build now: OpenAI models (needs decision 5), live evaluation (needs a key), phase 2
tie-break, upper-tail reading (3.3). Keep the `consequence >= 7 && confidence < 0.7` thresholds
as named constants, marked provisional until the live evaluation.

Review fixes:
- Verify the SDK package exists (`npm view @typesafe-ai/sdk`). If it does not, or its types
  differ, call the REST endpoint with `fetch` directly; do not invent helper names.
- The 8 s timeout covers the whole attempt including the retry; total Jev budget must not exceed
  ~10 s before falling back.
- Gate: `npx tsc --noEmit`, `npm run lint`, and all three test scripts (`test-cases.ts`,
  `test-calibration.ts`, `test-regressions.ts`) pass; app works with no `TYPESAFE_API_KEY`.

## 9. Open decisions

1. **Recommend or run?** Recommend only (this plan) needs one key. Actually sending the task to the
   chosen Gemini/Claude/ChatGPT model needs three provider keys, streaming, and a spending cap.
2. **Who decides?** Plan assumes Jev supplies judgments and the engine picks the model. Letting Jev
   pick directly is possible (phase 2 does it only for close calls) but is harder to test and explain.
3. **Offline fallback:** plan keeps keyword matching when there is no key. Confirm.
4. **Data:** task text will be sent to TypeSafe. Acceptable for your tasks? If not, keep Jev opt-in
   per request with a visible notice.
5. **OpenAI models:** which ones to add, and where should their capability scores come from
   (benchmarks you trust, or your own history)?
