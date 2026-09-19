# ModelPilot

## 1. Product Definition

Build a polished web application called **ModelPilot** that recommends the appropriate **AI model, reasoning/effort level, and execution strategy** for a software/AI task.

The core user question is:

> **“Given this task, what is the cheapest AI configuration that is likely to complete it reliably?”**

The application must not simply map “hard task = Opus” and “easy task = Sonnet.” It should evaluate task characteristics such as complexity, ambiguity, risk, scope, context requirements, and verifiability, then produce an explainable recommendation.

The MVP is primarily a **decision-support tool**. It does not execute the user's task.

---

# 2. Primary User

Primary user:

* Developer using Claude Code, Codex, Gemini CLI, or similar coding agents.
* Wants to reduce expensive model usage without sacrificing reliability.
* Often works on greenfield applications and large existing repositories.
* Wants a quick answer before starting an AI coding task.

The experience should take less than one minute from opening the app to obtaining a recommendation.

---

# 3. Core User Flow

User:

1. Opens ModelPilot.
2. Pastes/describes the task.
3. Selects optional context such as:

   * New project
   * Existing codebase
   * Large/complex codebase
4. Selects their optimization priority:

   * Balanced
   * Lowest cost
   * Highest reliability
   * Lowest latency
5. Clicks **Analyze Task**.
6. App analyzes the task.
7. App displays:

   * Recommended model
   * Recommended effort
   * Confidence
   * Task profile
   * Explanation
   * Cheaper alternative
   * Higher-reliability alternative
   * Recommended workflow/strategy
8. User can copy the recommendation.

---

# 4. Product Principles

The implementation must follow these principles:

### 4.1 Cheapest reliable configuration

Do not optimize purely for maximum intelligence.

The recommendation should aim for:

> Minimum expected cost subject to acceptable reliability.

### 4.2 Task-driven, not phase-driven

Do not assume:

> Architecture = Opus
> Coding = Sonnet

Instead evaluate the actual task.

A simple architecture change may be fine with a cheaper model.

A highly ambiguous bug may require a stronger model despite being “coding.”

### 4.3 Model and effort are independent decisions

The application must separately determine:

* model tier
* effort level

Example:

> Sonnet + High

must be a valid recommendation.

### 4.4 Explainability

Every recommendation must tell the user why it was selected.

### 4.5 Escalation over over-provisioning

When appropriate, recommend:

> Start with cheaper model → verify → escalate if necessary

rather than immediately using the strongest configuration.

### 4.6 No permanent model ranking

Do not create a universal:

> Opus = 10/10
> Sonnet = 8/10

ranking and treat it as objective truth.

Model capabilities, prices, context windows, and supported effort levels must be stored as editable catalog data.

---

# 5. MVP Scope

## Included

* Task input
* Task classification
* Complexity/risk analysis
* Model recommendation
* Effort recommendation
* Confidence score
* Explainable reasoning
* Cost/reliability alternatives
* Execution strategy recommendation
* Model catalog
* Effort compatibility rules
* Local task history
* User feedback
* Basic analytics based on local data
* Responsive polished UI
* Dark/light theme support
* Copy recommendation button

## Not Included

Do not implement:

* Authentication
* Team accounts
* Payments
* Billing
* Cloud database
* Real Claude Code integration
* Automatic task execution
* Automatic repository scanning
* Browser extensions
* Mobile native applications
* Multi-user collaboration
* Complex admin panel

Keep the MVP self-contained.

---

# 6. Recommended Technology

Use:

* **Next.js**
* **TypeScript**
* **React**
* **Tailwind CSS**
* **shadcn/ui**
* **Lucide icons**
* **Recharts** only where charts are genuinely useful
* **localStorage** for persistence
* API route/server action for LLM analysis
* Zod for validating structured LLM output

Use clean modern TypeScript.

The application must run locally with:

```bash
npm install
npm run dev
```

---

# 7. Application Architecture

Use the following conceptual architecture:

```text
UI
 │
 ▼
Task Analyzer
 │
 ├── LLM Task Classifier
 │
 └── Deterministic Recommendation Engine
         │
         ├── Model Catalog
         ├── Effort Compatibility
         ├── Risk Rules
         ├── Cost Priority
         └── User History
 │
 ▼
Recommendation
 │
 ├── Primary recommendation
 ├── Cheaper alternative
 ├── Reliability alternative
 └── Execution strategy
 │
 ▼
Feedback / History
```

Important:

**The LLM must classify and interpret the task. It must not be trusted to directly invent the final model recommendation.**

The final recommendation should be produced by deterministic application logic using the structured task profile + model catalog.

---

# 8. Task Analysis Schema

When a task is analyzed, create the following structured profile:

```ts
type TaskProfile = {
  taskType:
    | "architecture"
    | "coding"
    | "debugging"
    | "research"
    | "security"
    | "writing"
    | "data"
    | "automation"
    | "review"
    | "other";

  complexity: number;      // 0-10
  ambiguity: number;       // 0-10
  consequence: number;     // 0-10
  novelty: number;         // 0-10
  contextDemand: number;   // 0-10
  scope: number;           // 0-10
  toolDemand: number;      // 0-10
  verifiability: number;   // 0-10

  existingCodebase: boolean;
  largeCodebase: boolean;
  securitySensitive: boolean;
  architectureChanging: boolean;

  summary: string;
  reasoning: string[];
};
```

The LLM should return ONLY structured JSON matching this schema.

Validate the result with Zod.

If parsing fails, retry once.

If it still fails, use a deterministic fallback profile.

---

# 9. Task Score

Calculate a normalized task score.

Use:

```text
complexity      × 0.20
ambiguity       × 0.15
consequence     × 0.20
novelty         × 0.10
contextDemand   × 0.15
scope           × 0.10
toolDemand      × 0.05
verifiability   × 0.05
```

Normalize to 0–100.

Note:

Higher verifiability should slightly reduce required reasoning because the result can be objectively tested.

Therefore internally use:

```text
effectiveVerifiability = 10 - verifiability
```

before applying its weight.

Also apply modifiers:

### Security sensitive

Add +10 risk.

### Architecture changing

Add +8.

### Large existing codebase

Add +5.

### Existing codebase with unknown conventions

Add +5.

Clamp final score to:

```text
0–100
```

---

# 10. Effort Recommendation

Use the abstract effort levels:

```text
LOW
MEDIUM
HIGH
VERY_HIGH
```

Then map to model-specific supported effort levels.

Base recommendation:

```text
0–29   → LOW
30–54  → MEDIUM
55–74  → HIGH
75–100 → VERY_HIGH
```

Additional overrides:

```text
securitySensitive && score >= 45 → HIGH minimum

architectureChanging && score >= 45 → HIGH minimum

ambiguity >= 8 → HIGH minimum

consequence >= 9 → HIGH minimum

complexity >= 9 && scope >= 8 → HIGH minimum
```

Use `VERY_HIGH` only for especially demanding tasks.

Do not recommend the maximum effort automatically.

---

# 11. Model Catalog

Create a typed model catalog.

Example:

```ts
type Model = {
  id: string;
  provider: string;
  displayName: string;

  tier: "budget" | "standard" | "frontier";

  strengths: string[];

  capabilities: {
    coding: number;
    architecture: number;
    debugging: number;
    research: number;
    reasoning: number;
    agentic: number;
  };

  inputPricePerMillion: number;
  outputPricePerMillion: number;

  supportedEfforts: (
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "VERY_HIGH"
  )[];

  contextWindow: number;
};
```

Seed the catalog with several representative models, including:

* a budget model
* a standard model
* a strong coding model
* a frontier reasoning model

Include Claude-family examples where appropriate, but make them configuration data rather than hard-coded application logic.

The catalog must be easy to modify in one file.

Do not rely on hardcoded model names throughout the UI.

---

# 12. Recommendation Engine

The recommendation engine receives:

```text
TaskProfile
+
TaskScore
+
ModelCatalog
+
UserPriority
```

and returns:

```ts
type Recommendation = {
  modelId: string;

  effort:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "VERY_HIGH";

  confidence: number;

  reason: string;

  taskScore: number;

  cheaperAlternative?: {
    modelId: string;
    effort: string;
    explanation: string;
  };

  reliabilityAlternative?: {
    modelId: string;
    effort: string;
    explanation: string;
  };

  strategy:
    | "single_pass"
    | "cheap_then_escalate"
    | "expert_first"
    | "expert_review"
    | "multi_stage";
};
```

---

# 13. Recommendation Logic

The algorithm should consider:

```text
model capability
task difficulty
task type
effort
cost
user priority
supported effort levels
```

Do NOT simply choose the highest-capability model.

For every eligible model/effort combination, calculate:

```text
capabilityFit
riskCoverage
costPenalty
latencyPenalty
```

Create an internal score:

```text
utility =
  capabilityFit
  + riskCoverage
  - costPenalty
  - latencyPenalty
```

The exact weights should depend on the user's selected priority.

---

# 14. User Priorities

Support:

### Balanced

Balance cost, speed and reliability.

### Lowest Cost

Favor cheaper configurations as long as task requirements are adequately covered.

### Highest Reliability

Allow more expensive models and higher effort.

### Lowest Latency

Favor lower effort and faster models.

Use the priority to modify the recommendation engine rather than creating entirely separate algorithms.

---

# 15. Execution Strategy

The app should recommend not only:

> “Use Opus High.”

but sometimes:

> “Use Sonnet Medium → run tests → escalate to Opus High if unresolved.”

Supported strategies:

### Single Pass

For straightforward tasks.

```text
Model → complete task
```

### Cheap Then Escalate

```text
Cheap model
     ↓
Verification
     ↓
Success → done
     ↓
Failure
     ↓
Stronger model
```

### Expert First

For high-risk architecture/security work.

```text
Frontier model
     ↓
Design / analysis
     ↓
Standard model
     ↓
Implementation
```

### Expert Review

```text
Standard model
     ↓
Implementation
     ↓
Frontier model
     ↓
Audit
```

### Multi-stage

For large projects:

```text
Architecture
↓
Implementation
↓
Testing
↓
Review
```

The recommended strategy should be determined from the task profile.

---

# 16. Main Dashboard

Build a polished dashboard with these areas:

```text
┌─────────────────────────────────────────────────────────┐
│ ModelPilot                         History   Settings   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ What are you asking the AI to do?                       │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Paste your task here...                             │ │
│ │                                                     │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Context                                                 │
│ [ New Project ] [ Existing Codebase ] [ Large Repo ]    │
│                                                         │
│ Priority                                                │
│ [ Balanced ] [ Lowest Cost ] [ Reliability ] [ Speed ]  │
│                                                         │
│                 [ Analyze Task ]                        │
└─────────────────────────────────────────────────────────┘
```

Use visual hierarchy, excellent spacing, restrained animations, and a premium developer-tool aesthetic.

Avoid excessive gradients, unnecessary cards, or gimmicky animations.

---

# 17. Recommendation Screen

After analysis:

```text
┌──────────────────────────────────────────────────────────┐
│                    RECOMMENDED                           │
│                                                          │
│              Claude Sonnet                              │
│              MEDIUM EFFORT                              │
│                                                          │
│              Confidence 91%                             │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Task profile                                            │
│                                                          │
│  Complexity       ███████░░░  7                         │
│  Ambiguity       ███░░░░░░░  3                         │
│  Risk             ████░░░░░░  4                         │
│  Scope            ██████░░░░  6                         │
│                                                          │
│  WHY                                                    │
│  This is a clearly defined implementation task with     │
│  moderate scope and good testability.                   │
│                                                          │
│  CHEAPER OPTION                                          │
│  Sonnet · Low                                            │
│  Probably sufficient if the implementation is           │
│  straightforward.                                       │
│                                                          │
│  MORE RELIABLE                                           │
│  Opus · Medium                                           │
│  Useful when failure would be expensive.                │
│                                                          │
│  RECOMMENDED WORKFLOW                                    │
│  Sonnet Medium → Tests → Escalate if necessary          │
│                                                          │
│                 [ Copy Recommendation ]                  │
└──────────────────────────────────────────────────────────┘
```

---

# 18. Confidence

Confidence is NOT confidence that the model will succeed.

It is:

> Confidence that ModelPilot has correctly classified the task and selected the recommendation based on available information.

Display:

```text
High confidence
Medium confidence
Low confidence
```

Do not present false precision such as:

> “91.37% chance Claude will succeed.”

---

# 19. Why Explanation

Generate explanations from the structured task profile.

Example:

```text
This task has moderate complexity and scope, but low ambiguity.
Because the result can be validated with tests, maximum reasoning
is unlikely to provide enough additional value to justify its cost.
```

Avoid generic text such as:

> “Opus is better because it is more powerful.”

The explanation must reference actual task characteristics.

---

# 20. History

Store analyzed tasks in localStorage.

Each record:

```ts
type HistoryItem = {
  id: string;
  timestamp: string;

  taskText: string;

  recommendation: Recommendation;

  userFeedback?: {
    outcome:
      | "excellent"
      | "good"
      | "acceptable"
      | "poor"
      | "failed";

    recommendationQuality:
      | "too_expensive"
      | "too_weak"
      | "about_right";
  };
};
```

History UI:

```text
Recent analyses

Database redesign
Sonnet High
2 minutes ago

Authentication audit
Opus High
Yesterday

UI component
Sonnet Low
Yesterday
```

Clicking an item reopens the complete analysis.

---

# 21. Feedback

After displaying a recommendation:

```text
Was this recommendation useful?

[ Excellent ] [ Good ] [ Acceptable ] [ Poor ] [ Failed ]
```

Then optionally:

```text
Was the configuration:

[ Too expensive ]
[ Too weak ]
[ About right ]
```

Persist this locally.

---

# 22. Personal Optimization

Add a simple analytics screen based entirely on local history.

Display:

```text
Your Usage

Tasks analyzed             47

Recommendations followed   39

Too expensive               5
Too weak                    2
About right                32
```

Then show simple observations.

Example:

> “You frequently use high effort for straightforward coding tasks.”

Do not claim statistically meaningful conclusions until sufficient history exists.

Use language such as:

> “Based on your recent analyses…”

---

# 23. LLM Integration

The task classifier should support an OpenAI-compatible API endpoint.

Environment variables:

```env
LLM_BASE_URL=
LLM_API_KEY=
LLM_MODEL=
```

Provide a development fallback/mock mode so the application works without an API key.

The classifier system instruction should require:

```text
You are a task-analysis engine.

Analyze the user's task.

Do not recommend models.

Do not recommend effort levels.

Do not make pricing assumptions.

Return only valid JSON matching the supplied schema.

Evaluate:
- task type
- complexity
- ambiguity
- consequence of failure
- novelty
- context demand
- scope
- tool demand
- verifiability
- security sensitivity
- architecture changes
- existing codebase characteristics

Base scores on the actual task description.
Do not assume that difficult-looking words necessarily mean a difficult task.
```

---

# 24. Fallback Mode

If LLM analysis is unavailable:

Use a lightweight deterministic classifier.

Examples:

Keywords suggesting:

### Security

```text
auth
authentication
authorization
RBAC
permissions
JWT
OAuth
tenant
security
payment
webhook
```

### Architecture

```text
architecture
schema
database
redesign
migration
system design
event-driven
microservices
```

### Debugging

```text
bug
crash
error
race condition
intermittent
fails
broken
```

This fallback does not need to be extremely sophisticated.

Its purpose is ensuring the app remains functional.

---

# 25. Copy Recommendation

The user should be able to copy a concise recommendation:

```text
Model: Claude Sonnet
Effort: Medium

Why:
Moderate complexity, clear requirements, limited security risk,
and strong testability.

Workflow:
Use Sonnet Medium → run tests → escalate to a stronger model if
the implementation reveals architectural ambiguity.
```

Include a copy button with success feedback.

---

# 26. Model Catalog UI

Settings should contain:

```text
Model Catalog

Provider      Model          Tier       Cost
Anthropic     Sonnet         Standard   $$$
Anthropic     Opus           Frontier   $$$$
Provider X    Model X        Budget     $
```

Each model can be viewed/edited.

For MVP, edits can be persisted in localStorage.

Do not require an admin backend.

---

# 27. Visual Design

Design language:

* modern developer tool
* premium but minimal
* dark-first
* excellent typography
* high information density without feeling cramped
* subtle borders
* muted backgrounds
* strong emphasis on the recommendation
* restrained animation
* responsive desktop/mobile layout

Primary visual hierarchy:

```text
Recommendation
      ↓
Confidence
      ↓
Why
      ↓
Task profile
      ↓
Alternatives
      ↓
Strategy
```

Avoid making every section equally visually prominent.

---

# 28. Important UX Behavior

### Empty state

Explain the product in one sentence:

> “Tell ModelPilot what you're about to ask an AI agent to do.”

### Loading

Show meaningful progress:

```text
Understanding task…
Evaluating complexity…
Comparing configurations…
Building recommendation…
```

Do not fake long waits.

### Error

Use concise actionable errors:

> “Task analysis failed. Try again or use fallback analysis.”

### Long task descriptions

Allow large multiline input.

### Keyboard shortcut

Support:

```text
Ctrl/Cmd + Enter
```

to analyze.

---

# 29. Example Test Cases

The application must behave sensibly for at least these inputs.

### Test 1

```text
Rename a variable across three files.
```

Expected:

* coding
* low complexity
* low risk
* low effort
* inexpensive model acceptable

### Test 2

```text
Build a reusable dashboard component using our existing
design system.
```

Expected:

* coding/UI
* moderate complexity
* medium effort
* standard coding model

### Test 3

```text
Redesign our database to support multi-tenancy without
breaking existing customer data.
```

Expected:

* architecture/database
* high consequence
* high scope
* high effort
* strong reasoning model
* likely expert-first strategy

### Test 4

```text
Our payment webhook occasionally processes the same payment twice.
Find the root cause and fix it.
```

Expected:

* debugging
* high consequence
* ambiguity potentially high
* high effort
* strong model
* verification-heavy strategy

### Test 5

```text
Write a button component matching the existing style.
```

Expected:

* low complexity
* low consequence
* low effort
* cheaper model sufficient

### Test 6

```text
Perform a security audit of our authentication and authorization
system and identify paths to privilege escalation.
```

Expected:

* security
* very high consequence
* high effort
* frontier/strong reasoning model
* expert review strategy

---

# 30. Acceptance Criteria

The implementation is complete only when:

### Functional

* User can enter a task.
* User can analyze it.
* Structured task classification works.
* Recommendation is generated.
* Effort is generated.
* Alternatives are generated.
* Strategy is generated.
* Explanations reference task characteristics.
* Results can be copied.
* History persists after refresh.
* Feedback persists after refresh.
* Model catalog is configurable.
* Application works without an LLM API key using fallback/mock mode.

### Technical

* TypeScript has no avoidable `any`.
* LLM output is schema-validated.
* Invalid LLM output is handled gracefully.
* Recommendation logic is deterministic once TaskProfile exists.
* Model names/prices are not scattered throughout the codebase.
* No secrets are exposed to the browser.
* Responsive layout works on desktop and mobile.
* No console errors in normal usage.

### UX

* First analysis should be possible in one screen.
* Recommendation is immediately visually obvious.
* Reasoning is understandable to a developer.
* User can understand why a more expensive configuration was or was not selected.
* The UI does not require knowledge of AI terminology.

---

# 31. Suggested Project Structure

```text
src/
├── app/
│   ├── page.tsx
│   ├── history/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── api/
│       └── analyze/
│           └── route.ts
│
├── components/
│   ├── analyzer/
│   │   ├── task-input.tsx
│   │   ├── context-selector.tsx
│   │   ├── priority-selector.tsx
│   │   └── analyze-button.tsx
│   │
│   ├── recommendation/
│   │   ├── recommendation-card.tsx
│   │   ├── task-profile.tsx
│   │   ├── alternatives.tsx
│   │   ├── strategy-card.tsx
│   │   └── confidence.tsx
│   │
│   ├── history/
│   │   └── history-list.tsx
│   │
│   └── ui/
│
├── lib/
│   ├── analyzer/
│   │   ├── classifier.ts
│   │   ├── fallback-classifier.ts
│   │   └── schema.ts
│   │
│   ├── recommendation/
│   │   ├── engine.ts
│   │   ├── scoring.ts
│   │   └── strategies.ts
│   │
│   ├── models/
│   │   ├── catalog.ts
│   │   └── types.ts
│   │
│   └── storage/
│       └── local-storage.ts
│
└── types/
    └── index.ts
```

---

# 32. Implementation Instructions to the LLM

Implement the entire application in one pass.

Do not ask clarifying questions.

Make reasonable engineering decisions when minor details are unspecified.

Prioritize:

1. Functional correctness
2. Recommendation quality
3. Clean architecture
4. Excellent UX
5. Visual polish

Do not over-engineer the MVP.

Do not add authentication, payments, databases, or unnecessary integrations.

The recommendation engine must remain deterministic and inspectable.

Separate:

```text
LLM interpretation
```

from:

```text
recommendation logic
```

Do not allow the LLM to bypass the recommendation engine.

Use mocked LLM responses when environment variables are missing so that the application is immediately runnable after installation.

Create sensible seed model data and make it easy to edit.

Add enough sample tasks internally to manually test the recommendation engine.

Build the complete UI, not a wireframe.

The final result must feel like a finished developer tool rather than a prototype.

---

# 33. Definition of Done

A developer should be able to clone the repository, run:

```bash
npm install
npm run dev
```

and immediately:

1. Enter a task.
2. Analyze it.
3. Receive a model + effort recommendation.
4. Understand why it was recommended.
5. Compare cheaper and more reliable alternatives.
6. Copy the result.
7. See the analysis in history.
8. Provide feedback.
9. View basic personal optimization statistics.

No additional backend setup should be required for the basic application experience.
