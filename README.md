# ModelPilot

> **"Given this task, what is the cheapest AI configuration that is likely to complete it reliably?"**

ModelPilot is a developer decision-support tool that analyzes software development tasks across 8 core dimensions (complexity, ambiguity, consequence/risk, novelty, context demand, scope, tool demand, verifiability) and recommends the optimal **AI model, reasoning effort level, and execution strategy**.

---

## Key Features

- **Cheapest Reliable Configuration**: Rather than defaulting to expensive frontier models, ModelPilot calculates the minimum expected cost configuration subject to acceptable reliability.
- **Independent Model & Effort Decisions**: Separates model tier selection from reasoning effort (e.g. *Standard + High Effort* or *Budget + Low Effort*).
- **Explainable Reasoning**: Explanations explicitly ground why a model/effort was chosen based on actual task metrics (e.g. high testability reducing reasoning demand, or security sensitivity escalating effort).
- **Execution Strategies**: Recommends strategic workflows such as *Single Pass*, *Cheap Then Escalate*, *Expert First*, *Expert Review*, and *Multi-Stage Phased Execution*.
- **Alternatives Comparison**: Displays both a cheaper alternative (with estimated token savings) and a higher-reliability fallback option.
- **Editable Model Catalog**: Model tiers, capabilities, pricing per million tokens, and supported effort levels are configurable in the Settings page and persist locally.
- **Local-First History & Analytics**: All past evaluations and feedback are stored in `localStorage` with search, filtering, and usage pattern diagnostics.
- **Zero-Setup Fallback / Mock Mode**: Runs immediately offline with deterministic rule-based profiling, or connects to any OpenAI-compatible API endpoint.
- **Dark-First Modern Aesthetic**: Polished developer tool UI with seamless Dark and Light theme support.
- **Keyboard Shortcuts**: `Ctrl + Enter` / `Cmd + Enter` to trigger analysis from the prompt area.

---

## Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (Strict typing, no avoidable `any`)
- **Styling**: Tailwind CSS v4 with dark/light mode support
- **Validation**: Zod (Structured LLM output validation)
- **Icons**: Lucide React
- **Storage**: Browser `localStorage` (Privacy-focused, zero backend database needed)
- **Testing**: `tsx test-cases.ts` (Automated suite verifying all 6 benchmark cases)

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Automated Tests

```bash
npm test
```

Verifies all 6 benchmark test cases from `Plan.md Section 29`:
1. *Rename a variable across three files* (Coding, Budget tier, Low effort, Single pass)
2. *Build a reusable dashboard component using our existing design system* (Coding, Standard tier, Medium effort)
3. *Redesign our database to support multi-tenancy without breaking existing customer data* (Architecture, Frontier tier, High/Very High effort, Expert first)
4. *Payment webhook occasionally processes duplicate payments* (Debugging, High consequence, High effort, Expert review)
5. *Write a button component matching the existing style* (Coding, Budget tier, Low effort)
6. *Security audit of authentication and authorization system* (Security, High consequence, Frontier tier, Expert review)

---

## Configuration (Optional)

ModelPilot operates completely offline out of the box using its deterministic rule-based classifier.

If you wish to connect an OpenAI-compatible endpoint for LLM task classification, configure either via the **Settings** page or through environment variables:

```env
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```

Even when an LLM is configured, the LLM is only used to extract structured task profiles. The final recommendation is always produced by deterministic application logic.

---

## Architecture Overview

```text
User Task Input
     │
     ▼
Task Analyzer
     │
     ├── LLM Task Classifier (or Deterministic Rule-Based Fallback)
     │       └── Validated with Zod Schema (TaskProfile)
     │
     └── Deterministic Recommendation Engine
             ├── Task Scoring (Weights + Modifiers)
             ├── Effort Compatibility Rules
             ├── Model Catalog (Pricing, Capabilities, Tiers)
             └── Optimization Priority (Balanced / Cost / Reliability / Speed)
     │
     ▼
Recommendation Output
     ├── Primary Model & Effort Level
     ├── Confidence Score (High / Medium / Low)
     ├── Diagnostic Dimensions (Complexity, Risk, Verifiability, etc.)
     ├── Explainable 'Why' Breakdown
     ├── Cheaper & Higher-Reliability Alternatives
     └── Step-by-Step Execution Strategy
     │
     ▼
Local Persistence
     ├── Searchable Task History
     ├── Quality & Sizing Feedback Loop
     └── Personal Optimization & Usage Analytics
```
