import { Model } from "@/types";

export const DEFAULT_MODELS: Model[] = [
  // Budget Models
  {
    id: "gemini-3-8-flash",
    provider: "Google",
    displayName: "Gemini 3.8 Flash",
    tier: "budget",
    strengths: [
      "1M context window",
      "Near-instant throughput",
      "Ultra-low token cost",
      "Agentic task execution",
    ],
    capabilities: {
      coding: 9.0,
      architecture: 8.0,
      debugging: 8.8,
      research: 8.9,
      reasoning: 8.8,
      agentic: 9.0,
    },
    capabilityMetadata: {
      coding: { sourceType: "benchmark", confidence: "high", sourceName: "SWE-bench Verified / HumanEval", lastUpdated: "2026-03" },
      architecture: { sourceType: "observed", confidence: "medium", sourceName: "Large multi-file refactoring runs", lastUpdated: "2026-03" },
      debugging: { sourceType: "benchmark", confidence: "high", sourceName: "SWE-bench Lite", lastUpdated: "2026-03" },
      research: { sourceType: "observed", confidence: "high", sourceName: "Long-context retrieval evals", lastUpdated: "2026-03" },
      reasoning: { sourceType: "benchmark", confidence: "high", sourceName: "AIME 2025 / GPQA Diamond", lastUpdated: "2026-03" },
      agentic: { sourceType: "observed", confidence: "high", sourceName: "Tool-use & function calling benchmarks", lastUpdated: "2026-03" },
    },
    inputPricePerMillion: 0.75,
    outputPricePerMillion: 3.75,
    supportedEfforts: ["LOW", "MEDIUM", "HIGH"],
    contextWindow: 1048576,
    speedRating: 9.7,
    description: "Google's latest and most intelligent Flash model with advanced reasoning at flash speeds.",
    enabled: true,
  },
  {
    id: "claude-haiku-4-5",
    provider: "Anthropic",
    displayName: "Claude Haiku 4.5",
    tier: "budget",
    strengths: [
      "Ultra-fast execution",
      "Near-frontier intelligence",
      "Low cost",
      "Targeted edits",
    ],
    capabilities: {
      coding: 8.2,
      architecture: 6.5,
      debugging: 7.8,
      research: 7.6,
      reasoning: 7.8,
      agentic: 8.0,
    },
    capabilityMetadata: {
      coding: { sourceType: "benchmark", confidence: "high", sourceName: "SWE-bench Verified", lastUpdated: "2026-02" },
      architecture: { sourceType: "estimated", confidence: "medium", sourceName: "Multi-file structural evaluation", lastUpdated: "2026-02" },
      debugging: { sourceType: "benchmark", confidence: "high", sourceName: "SWE-bench Lite", lastUpdated: "2026-02" },
      research: { sourceType: "observed", confidence: "medium", sourceName: "RAG & doc lookup tests", lastUpdated: "2026-02" },
      reasoning: { sourceType: "benchmark", confidence: "high", sourceName: "GPQA Diamond", lastUpdated: "2026-02" },
      agentic: { sourceType: "observed", confidence: "medium", sourceName: "Agentic tool-loop trials", lastUpdated: "2026-02" },
    },
    inputPricePerMillion: 1.0,
    outputPricePerMillion: 5.0,
    supportedEfforts: ["LOW", "MEDIUM"],
    contextWindow: 200000,
    speedRating: 9.6,
    description: "Anthropic's latest high-speed model delivering near-frontier intelligence at low latency.",
    enabled: true,
  },

  // Standard Models
  {
    id: "claude-sonnet-5",
    provider: "Anthropic",
    displayName: "Claude Sonnet 5",
    tier: "standard",
    strengths: [
      "Frontier coding performance",
      "Adaptive thinking",
      "Complex architecture",
      "Multi-file refactoring",
    ],
    capabilities: {
      coding: 9.9,
      architecture: 9.6,
      debugging: 9.7,
      research: 9.5,
      reasoning: 9.8,
      agentic: 9.7,
    },
    capabilityMetadata: {
      coding: { sourceType: "benchmark", confidence: "high", sourceName: "SWE-bench Verified (72.8%)", lastUpdated: "2026-03" },
      architecture: { sourceType: "observed", confidence: "high", sourceName: "Monorepo refactoring & schema designs", lastUpdated: "2026-03" },
      debugging: { sourceType: "benchmark", confidence: "high", sourceName: "SWE-bench Verified", lastUpdated: "2026-03" },
      research: { sourceType: "observed", confidence: "high", sourceName: "Deep documentation synthesis", lastUpdated: "2026-03" },
      reasoning: { sourceType: "benchmark", confidence: "high", sourceName: "AIME 2025 / GPQA Diamond", lastUpdated: "2026-03" },
      agentic: { sourceType: "benchmark", confidence: "high", sourceName: "WebArena / ToolBench", lastUpdated: "2026-03" },
    },
    inputPricePerMillion: 2.0,
    outputPricePerMillion: 10.0,
    supportedEfforts: ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
    contextWindow: 1000000,
    speedRating: 8.0,
    description: "Anthropic's latest Sonnet-class model with 1M context and adaptive hybrid thinking.",
    enabled: true,
  },

  // Frontier Models
  {
    id: "gemini-3-1-pro-preview",
    provider: "Google",
    displayName: "Gemini 3.1 Pro Preview",
    tier: "frontier",
    strengths: [
      "1M+ context window",
      "Frontier multi-step reasoning",
      "Deep software engineering",
      "Multimodal master",
    ],
    capabilities: {
      coding: 9.7,
      architecture: 9.5,
      debugging: 9.6,
      research: 9.8,
      reasoning: 9.8,
      agentic: 9.5,
    },
    capabilityMetadata: {
      coding: { sourceType: "benchmark", confidence: "high", sourceName: "SWE-bench Verified / HumanEval", lastUpdated: "2026-03" },
      architecture: { sourceType: "observed", confidence: "high", sourceName: "System architecture benchmarks", lastUpdated: "2026-03" },
      debugging: { sourceType: "benchmark", confidence: "high", sourceName: "SWE-bench Lite", lastUpdated: "2026-03" },
      research: { sourceType: "benchmark", confidence: "high", sourceName: "Needle in a Haystack (1M+ tokens)", lastUpdated: "2026-03" },
      reasoning: { sourceType: "benchmark", confidence: "high", sourceName: "AIME 2025 / MATH-500", lastUpdated: "2026-03" },
      agentic: { sourceType: "observed", confidence: "high", sourceName: "Google Agentic evaluation suite", lastUpdated: "2026-03" },
    },
    inputPricePerMillion: 2.0,
    outputPricePerMillion: 12.0,
    supportedEfforts: ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
    contextWindow: 1048576,
    speedRating: 7.6,
    description: "Google's latest flagship reasoning model delivering state-of-the-art software engineering intelligence.",
    enabled: true,
  },
  {
    id: "claude-opus-5",
    provider: "Anthropic",
    displayName: "Claude Opus 5",
    tier: "frontier",
    strengths: [
      "1M context window",
      "Highest reasoning depth",
      "Mission-critical architecture",
      "Deep security audit",
    ],
    capabilities: {
      coding: 9.8,
      architecture: 9.9,
      debugging: 9.8,
      research: 9.9,
      reasoning: 9.9,
      agentic: 9.7,
    },
    capabilityMetadata: {
      coding: { sourceType: "benchmark", confidence: "high", sourceName: "SWE-bench Verified", lastUpdated: "2026-03" },
      architecture: { sourceType: "observed", confidence: "high", sourceName: "Enterprise system design reviews", lastUpdated: "2026-03" },
      debugging: { sourceType: "benchmark", confidence: "high", sourceName: "SWE-bench Verified", lastUpdated: "2026-03" },
      research: { sourceType: "benchmark", confidence: "high", sourceName: "GPQA Diamond (Highest Tier)", lastUpdated: "2026-03" },
      reasoning: { sourceType: "benchmark", confidence: "high", sourceName: "AIME 2025 / Frontier Reasoning", lastUpdated: "2026-03" },
      agentic: { sourceType: "observed", confidence: "high", sourceName: "Multi-turn long-horizon task execution", lastUpdated: "2026-03" },
    },
    inputPricePerMillion: 5.0,
    outputPricePerMillion: 25.0,
    supportedEfforts: ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
    contextWindow: 1000000,
    speedRating: 6.5,
    description: "Anthropic's premier frontier model with 1M context for mission-critical software and security.",
    enabled: true,
  },
];

export function getModelById(models: Model[], id: string): Model | undefined {
  return models.find((m) => m.id === id);
}

export function formatPricePerMillion(inputPrice: number, outputPrice: number): string {
  return `$${inputPrice.toFixed(2)} / $${outputPrice.toFixed(2)}`;
}

export function getPriceTierSymbol(inputPrice: number): "$" | "$$" | "$$$" | "$$$$" {
  if (inputPrice < 0.5) return "$";
  if (inputPrice < 2.0) return "$$";
  if (inputPrice < 10.0) return "$$$";
  return "$$$$";
}
