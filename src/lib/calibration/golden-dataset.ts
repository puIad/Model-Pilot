import { BenchmarkCase } from "./types";

export const GOLDEN_BENCHMARK_SUITE: BenchmarkCase[] = [
  // =========================================================================
  // Category 1: Trivial / Deterministic Tasks (Tests 01 - 03)
  // =========================================================================
  {
    id: "test-01",
    name: "Test 01: Typo Fix in Landing Page Navbar",
    task: "Fix typo in landing page navbar: 'Compnay' -> 'Company'",
    expected: {
      taskTypes: ["coding"],
      complexity: { min: 1, max: 2 },
      ambiguity: { min: 1, max: 2 },
      consequence: { min: 1, max: 2 },
      scope: { min: 1, max: 2 },
      effort: { min: 1, max: 1 }, // LOW
      minimumModelTier: "budget",
      rationale: "Single string literal change, zero branching, trivial verifiability.",
    },
  },
  {
    id: "test-02",
    name: "Test 02: Add an Icon in Footer",
    task: "Add a Github icon next to the Twitter icon in the footer",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["coding"],
      complexity: { min: 1, max: 3 },
      ambiguity: { min: 1, max: 2 },
      consequence: { min: 1, max: 2 },
      scope: { min: 1, max: 2 },
      effort: { min: 1, max: 1 }, // LOW
      minimumModelTier: "budget",
      rationale: "Standard UI icon addition in footer, straightforward markup change.",
    },
  },
  {
    id: "test-03",
    name: "Test 03: Unit Test for Pure Function",
    task: "Write unit tests for a slugify(string) function covering edge cases: spaces, special chars, unicode, empty strings",
    expected: {
      taskTypes: ["coding"],
      complexity: { min: 2, max: 4 },
      ambiguity: { min: 1, max: 3 },
      consequence: { min: 1, max: 3 },
      scope: { min: 2, max: 3 },
      effort: { min: 1, max: 2 }, // LOW to MEDIUM
      minimumModelTier: "budget",
      rationale: "Deterministic input-output mapping, pure unit tests with high verifiability.",
    },
  },

  // =========================================================================
  // Category 2: Low Complexity, High Verifiability Tasks (Tests 04 - 06)
  // =========================================================================
  {
    id: "test-04",
    name: "Test 04: Standard REST Endpoint",
    task: "Add a GET /api/users/:id endpoint that returns user profile from PostgreSQL via Prisma, with 404 handling",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["coding"],
      complexity: { min: 3, max: 5 },
      ambiguity: { min: 1, max: 3 },
      consequence: { min: 3, max: 5 },
      scope: { min: 3, max: 5 },
      effort: { min: 2, max: 3 }, // MEDIUM to HIGH
      minimumModelTier: "budget",
      rationale: "Standard CRUD endpoint with established database patterns and clear status codes.",
    },
  },
  {
    id: "test-05",
    name: "Test 05: Form Component with Validation",
    task: "Build a user registration form in React with react-hook-form and Zod: email, password (min 8 chars, 1 number), confirm password",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["coding"],
      complexity: { min: 3, max: 5 },
      ambiguity: { min: 1, max: 3 },
      consequence: { min: 2, max: 4 },
      scope: { min: 3, max: 5 },
      effort: { min: 2, max: 3 }, // MEDIUM to HIGH
      minimumModelTier: "budget",
      rationale: "Well-documented libraries (react-hook-form + zod), clear validation requirements.",
    },
  },
  {
    id: "test-06",
    name: "Test 06: Data Transformation Function",
    task: "Write a TypeScript function that transforms an array of flat transaction objects into a monthly summary grouped by category",
    expected: {
      taskTypes: ["coding"],
      complexity: { min: 3, max: 5 },
      ambiguity: { min: 1, max: 3 },
      consequence: { min: 2, max: 4 },
      scope: { min: 2, max: 4 },
      effort: { min: 1, max: 2 }, // LOW to MEDIUM
      minimumModelTier: "budget",
      rationale: "Pure functional transform, highly verifiable with mock datasets.",
    },
  },

  // =========================================================================
  // Category 3: Ambiguous Tasks / Vague Prompts (Tests 07 - 09)
  // =========================================================================
  {
    id: "test-07",
    name: "Test 07: Vague Scalability Task",
    task: "Make the application more scalable",
    expected: {
      taskTypes: ["architecture", "coding"],
      complexity: { min: 7, max: 10 },
      ambiguity: { min: 8, max: 10 },
      consequence: { min: 6, max: 9 },
      scope: { min: 7, max: 10 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "frontier",
      rationale: "Extreme ambiguity, undefined architecture scope, requires strategic multi-step planning.",
    },
  },
  {
    id: "test-08",
    name: "Test 08: Vague Bug Report",
    task: "The app sometimes doesn't work. Fix it.",
    expected: {
      taskTypes: ["debugging"],
      complexity: { min: 6, max: 9 },
      ambiguity: { min: 8, max: 10 },
      consequence: { min: 5, max: 8 },
      scope: { min: 5, max: 9 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "standard",
      rationale: "Zero reproduction steps or logs, high ambiguity necessitates diagnostic reasoning.",
    },
  },
  {
    id: "test-09",
    name: "Test 09: Vague UX Improvement",
    task: "Improve the user experience of the checkout flow",
    expected: {
      taskTypes: ["coding", "architecture", "review"],
      complexity: { min: 6, max: 9 },
      ambiguity: { min: 8, max: 10 },
      consequence: { min: 6, max: 9 },
      scope: { min: 6, max: 9 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "standard",
      rationale: "Broad UX goals directly impacting checkout conversion without explicit specifications.",
    },
  },

  // =========================================================================
  // Category 4: High-Risk / High-Consequence Tasks (Tests 10 - 12)
  // =========================================================================
  {
    id: "test-10",
    name: "Test 10: Auth Token Validation Rewrite",
    task: "Rewrite the JWT token validation middleware to support key rotation and RS256 while maintaining backwards compatibility with HS256 during migration",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["security", "coding"],
      complexity: { min: 7, max: 9 },
      ambiguity: { min: 3, max: 5 },
      consequence: { min: 8, max: 10 },
      scope: { min: 5, max: 8 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "frontier",
      rationale: "Security-critical token parsing, authentication flaw risks entire system.",
    },
  },
  {
    id: "test-11",
    name: "Test 11: Payment Webhook Handler",
    task: "Implement Stripe webhook handler for invoice.payment_succeeded and invoice.payment_failed with idempotency, signature verification, and database transaction",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["coding", "security"],
      complexity: { min: 6, max: 8 },
      ambiguity: { min: 2, max: 4 },
      consequence: { min: 8, max: 10 },
      scope: { min: 4, max: 7 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "frontier",
      rationale: "Financial transaction processing, replay vulnerabilities and duplicate billing risk.",
    },
  },
  {
    id: "test-12",
    name: "Test 12: Destructive Database Migration",
    task: "Write a migration that drops the legacy user_metadata table, migrating non-null fields to the users table with zero downtime and rollback support",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["architecture", "coding"],
      complexity: { min: 7, max: 9 },
      ambiguity: { min: 3, max: 5 },
      consequence: { min: 8, max: 10 },
      scope: { min: 6, max: 8 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "frontier",
      rationale: "Permanent data loss risk during column dropping and zero-downtime constraints.",
    },
  },

  // =========================================================================
  // Category 5: Large-Scope / Multi-File Tasks (Tests 13 - 15)
  // =========================================================================
  {
    id: "test-13",
    name: "Test 13: State Management Migration",
    task: "Migrate our React state management from Redux to Zustand across 35 components and 8 slices",
    context: { existingCodebase: true, largeCodebase: true },
    expected: {
      taskTypes: ["architecture", "coding"],
      complexity: { min: 6, max: 8 },
      ambiguity: { min: 3, max: 5 },
      consequence: { min: 5, max: 7 },
      scope: { min: 7, max: 9 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "standard",
      rationale: "Large multi-file refactoring touching dozens of components.",
    },
  },
  {
    id: "test-14",
    name: "Test 14: Framework Migration",
    task: "Migrate our Next.js application from Pages Router to App Router, including 40 pages, API routes, and custom _app / _document",
    context: { existingCodebase: true, largeCodebase: true },
    expected: {
      taskTypes: ["architecture", "coding"],
      complexity: { min: 7, max: 9 },
      ambiguity: { min: 4, max: 6 },
      consequence: { min: 6, max: 8 },
      scope: { min: 8, max: 10 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "frontier",
      rationale: "Massive architectural overhaul of routing, server components, and layout hierarchies.",
    },
  },
  {
    id: "test-15",
    name: "Test 15: Multi-Tenant Architecture",
    task: "Refactor our single-tenant Postgres schema and API middleware to support multi-tenancy with tenant isolation via row-level security",
    context: { existingCodebase: true, largeCodebase: true },
    expected: {
      taskTypes: ["architecture", "security"],
      complexity: { min: 8, max: 10 },
      ambiguity: { min: 3, max: 6 },
      consequence: { min: 8, max: 10 },
      scope: { min: 7, max: 10 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "frontier",
      rationale: "Cross-tenant data leakage risk and system-wide isolation rewrite.",
    },
  },

  // =========================================================================
  // Category 6: Novel / Low-Precedent Tasks (Tests 16 - 18)
  // =========================================================================
  {
    id: "test-16",
    name: "Test 16: Custom Binary Protocol Parser",
    task: "Implement a streaming parser for a custom binary protocol that uses variable-length integers and bitpacked flags",
    expected: {
      taskTypes: ["coding"],
      complexity: { min: 7, max: 9 },
      ambiguity: { min: 3, max: 5 },
      consequence: { min: 4, max: 7 },
      scope: { min: 4, max: 7 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "standard",
      rationale: "Low public training precedent, bitwise operations and streaming state machines.",
    },
  },
  {
    id: "test-17",
    name: "Test 17: In-Memory Spatial Index",
    task: "Build an in-memory 2D spatial index (R-tree or quadtree) in TypeScript that supports point insertion and bounding-box range queries",
    expected: {
      taskTypes: ["coding"],
      complexity: { min: 7, max: 9 },
      ambiguity: { min: 3, max: 5 },
      consequence: { min: 3, max: 6 },
      scope: { min: 4, max: 7 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "standard",
      rationale: "Complex data structure implementation with algorithmic bounding box logic.",
    },
  },
  {
    id: "test-18",
    name: "Test 18: Domain-Specific Language Compiler",
    task: "Write an interpreter for a small domain-specific query language that compiles to SQL with AST validation and type checking",
    expected: {
      taskTypes: ["coding", "architecture"],
      complexity: { min: 8, max: 10 },
      ambiguity: { min: 4, max: 6 },
      consequence: { min: 6, max: 8 },
      scope: { min: 6, max: 9 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "frontier",
      rationale: "Compiler engineering with AST traversal, type checking, and SQL injection prevention.",
    },
  },

  // =========================================================================
  // Category 7: Counterexample / Anti-Cheating Tasks (Tests 19 - 22)
  // =========================================================================
  {
    id: "test-19",
    name: "Test 19: Small change in huge repo",
    task: "Change the placeholder text in the search bar from 'Search...' to 'Search products...' (in a repository with 2,000 files)",
    context: { existingCodebase: true, largeCodebase: true },
    expected: {
      taskTypes: ["coding"],
      complexity: { min: 1, max: 3 },
      ambiguity: { min: 1, max: 2 },
      consequence: { min: 1, max: 3 },
      scope: { min: 1, max: 3 },
      effort: { min: 1, max: 2 }, // LOW to MEDIUM
      minimumModelTier: "budget",
      rationale: "Counterexample: Large repo must not fool engine into recommending expensive frontier model.",
    },
  },
  {
    id: "test-20",
    name: "Test 20: Well-known architecture pattern",
    task: "Add JWT authentication to our Express API following standard practices",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["coding", "security", "architecture"],
      complexity: { min: 4, max: 6 },
      ambiguity: { min: 2, max: 4 },
      consequence: { min: 5, max: 7 },
      scope: { min: 4, max: 6 },
      effort: { min: 2, max: 3 }, // MEDIUM to HIGH
      minimumModelTier: "standard",
      rationale: "Counterexample: Standard textbook architecture pattern does not require frontier or extreme effort.",
    },
  },
  {
    id: "test-21",
    name: "Test 21: Highly verifiable algorithmic task",
    task: "Write a function that converts Celsius to Fahrenheit and include comprehensive unit tests",
    expected: {
      taskTypes: ["coding"],
      complexity: { min: 1, max: 3 },
      ambiguity: { min: 1, max: 2 },
      consequence: { min: 1, max: 3 },
      scope: { min: 1, max: 3 },
      effort: { min: 1, max: 1 }, // LOW
      minimumModelTier: "budget",
      rationale: "Counterexample: High verifiability enables budget model and low effort.",
    },
  },
  {
    id: "test-22",
    name: "Test 22: Architecture review of tiny project",
    task: "Review the architecture of this 5-file CLI tool and suggest improvements",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["review", "architecture"],
      complexity: { min: 3, max: 5 },
      ambiguity: { min: 3, max: 5 },
      consequence: { min: 2, max: 4 },
      scope: { min: 2, max: 4 },
      effort: { min: 1, max: 2 }, // LOW to MEDIUM
      minimumModelTier: "budget",
      rationale: "Counterexample: Architecture keyword on tiny scope shouldn't trigger frontier maximums.",
    },
  },

  // =========================================================================
  // Category 8: Subtle Debugging Tasks (Tests 23 - 25)
  // =========================================================================
  {
    id: "test-23",
    name: "Test 23: Race Condition in Real-Time Sync",
    task: "Fix an intermittent race condition where concurrent WebSocket messages sometimes cause duplicate state updates in our collaborative canvas",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["debugging"],
      complexity: { min: 7, max: 9 },
      ambiguity: { min: 6, max: 8 },
      consequence: { min: 6, max: 8 },
      scope: { min: 5, max: 7 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "standard",
      rationale: "Non-deterministic timing bug in distributed real-time messaging.",
    },
  },
  {
    id: "test-24",
    name: "Test 24: Memory Leak in Background Worker",
    task: "Debug a slow memory leak in our Node.js BullMQ worker process that crashes every 36-48 hours under sustained load",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["debugging"],
      complexity: { min: 7, max: 9 },
      ambiguity: { min: 6, max: 8 },
      consequence: { min: 6, max: 8 },
      scope: { min: 5, max: 7 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "standard",
      rationale: "Subtle heap retention / event listener leak occurring over multi-day period.",
    },
  },
  {
    id: "test-25",
    name: "Test 25: CSS Stacking Context Issue",
    task: "Fix an issue where a modal dropdown menu appears behind a sticky header only in Safari on iOS",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["debugging", "coding"],
      complexity: { min: 3, max: 6 },
      ambiguity: { min: 4, max: 6 },
      consequence: { min: 2, max: 4 },
      scope: { min: 2, max: 4 },
      effort: { min: 2, max: 3 }, // MEDIUM to HIGH
      minimumModelTier: "budget",
      rationale: "WebKit stacking context quirk; bounded scope but requires knowledge of 3D transform isolation bugs.",
    },
  },

  // =========================================================================
  // Category 9: Production Edge Cases (Tests 26 - 28)
  // =========================================================================
  {
    id: "test-26",
    name: "Test 26: Graceful Shutdown in Distributed System",
    task: "Implement graceful shutdown for our Node.js microservice: drain in-flight HTTP requests, complete active queue jobs, close DB pools, and exit cleanly within a 30s deadline",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["coding", "architecture"],
      complexity: { min: 6, max: 8 },
      ambiguity: { min: 3, max: 5 },
      consequence: { min: 7, max: 9 },
      scope: { min: 5, max: 7 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "standard",
      rationale: "Process lifecycle handling in production; high consequence for dropped jobs.",
    },
  },
  {
    id: "test-27",
    name: "Test 27: Zero-Downtime Database Failover",
    task: "Write a connection pool wrapper that handles PostgreSQL failover events without dropping user requests, implementing retry with exponential backoff and read-only fallback",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["coding", "architecture"],
      complexity: { min: 7, max: 9 },
      ambiguity: { min: 3, max: 5 },
      consequence: { min: 8, max: 10 },
      scope: { min: 5, max: 8 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "frontier",
      rationale: "Mission-critical connection pooling during database primary transitions.",
    },
  },
  {
    id: "test-28",
    name: "Test 28: Distributed Rate Limiter",
    task: "Implement a distributed sliding-window rate limiter using Redis and Lua scripts that handles 10,000 req/sec across multiple API instances",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["coding", "architecture"],
      complexity: { min: 7, max: 9 },
      ambiguity: { min: 2, max: 4 },
      consequence: { min: 7, max: 9 },
      scope: { min: 4, max: 7 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "standard",
      rationale: "High throughput distributed locking and atomic Lua execution.",
    },
  },

  // =========================================================================
  // Category 10: Prompt-Only / Context-Constrained Tasks (Tests 29 - 30)
  // =========================================================================
  {
    id: "test-29",
    name: "Test 29: System Prompt Engineering",
    task: "Design a system prompt for a customer support AI agent that enforces strict brand tone, handles out-of-scope requests gracefully, and prevents prompt injection attempts",
    expected: {
      taskTypes: ["coding", "security", "research"],
      complexity: { min: 5, max: 8 },
      ambiguity: { min: 4, max: 7 },
      consequence: { min: 6, max: 8 },
      scope: { min: 3, max: 6 },
      effort: { min: 2, max: 4 }, // MEDIUM to VERY_HIGH
      minimumModelTier: "standard",
      rationale: "Security considerations against adversarial jailbreaks combined with tone nuance.",
    },
  },
  {
    id: "test-30",
    name: "Test 30: SQL Query Optimization",
    task: "Optimize a slow analytical SQL query that joins 6 tables with 10M+ rows, currently taking 45 seconds to run, reducing it to under 2 seconds",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["coding", "architecture", "debugging"],
      complexity: { min: 6, max: 8 },
      ambiguity: { min: 3, max: 5 },
      consequence: { min: 5, max: 8 },
      scope: { min: 3, max: 6 },
      effort: { min: 2, max: 3 }, // MEDIUM to HIGH
      minimumModelTier: "standard",
      rationale: "Database query planner optimization, index strategy, and execution plan analysis.",
    },
  },

  // =========================================================================
  // Category 11: Expanded Engineering & Agentic Domains (Tests 31 - 45)
  // =========================================================================
  {
    id: "test-31",
    name: "Test 31: Multi-Region Distributed Transactions",
    task: "Design a cross-region active-active database schema and consensus transaction coordinator with two-phase commit and serializable isolation",
    context: { existingCodebase: true, largeCodebase: true },
    expected: {
      taskTypes: ["architecture", "database", "security"],
      complexity: { min: 8, max: 10 },
      ambiguity: { min: 3, max: 5 },
      consequence: { min: 8, max: 10 },
      scope: { min: 7, max: 10 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "frontier",
      rationale: "Distributed systems consensus with high blast radius on data consistency.",
    },
  },
  {
    id: "test-32",
    name: "Test 32: High-Throughput Parquet ETL Pipeline",
    task: "Build a high-throughput Parquet ETL pipeline aggregating 50GB hourly telemetry with schema evolution and deduplication",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["data", "coding"],
      complexity: { min: 6, max: 8 },
      ambiguity: { min: 3, max: 5 },
      consequence: { min: 5, max: 7 },
      scope: { min: 5, max: 7 },
      effort: { min: 2, max: 3 }, // MEDIUM to HIGH
      minimumModelTier: "standard",
      rationale: "Data engineering pipeline with well-defined tabular transformations and deduplication.",
    },
  },
  {
    id: "test-33",
    name: "Test 33: Blue/Green Deployment with Canary Rollback",
    task: "Implement Kubernetes blue/green deployment controller that monitors Prometheus error rates and triggers automated canary rollbacks within 15 seconds",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["automation", "architecture"],
      complexity: { min: 7, max: 9 },
      ambiguity: { min: 3, max: 5 },
      consequence: { min: 8, max: 10 },
      scope: { min: 6, max: 8 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "frontier",
      rationale: "Mission-critical infrastructure automation with direct production uptime impact.",
    },
  },
  {
    id: "test-34",
    name: "Test 34: Public API V2 Deprecation RFC",
    task: "Author a comprehensive technical RFC detailing breaking changes, SDK codemods, and a 12-month deprecation timeline for our public REST API V2",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["writing", "architecture"],
      complexity: { min: 5, max: 7 },
      ambiguity: { min: 3, max: 5 },
      consequence: { min: 4, max: 6 },
      scope: { min: 5, max: 7 },
      effort: { min: 2, max: 3 }, // MEDIUM to HIGH
      minimumModelTier: "standard",
      rationale: "Technical communication and API contract governance requiring structured clarity.",
    },
  },
  {
    id: "test-35",
    name: "Test 35: Autonomous Multi-Tool Security Patching Loop",
    task: "Implement an agentic loop that inspects AST vulnerabilities, applies code patches, runs linter and test suite, and iterates autonomously until clean",
    context: { existingCodebase: true, largeCodebase: true },
    expected: {
      taskTypes: ["automation", "security", "coding"],
      complexity: { min: 8, max: 10 },
      ambiguity: { min: 4, max: 6 },
      consequence: { min: 8, max: 10 },
      scope: { min: 7, max: 9 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "frontier",
      rationale: "High-level agentic code repair requiring multi-tool orchestration and security verification.",
    },
  },
  {
    id: "test-36",
    name: "Test 36: OAuth2 PKCE Authorization Server Implementation",
    task: "Implement complete OAuth2 Authorization Code flow with RFC 7636 PKCE code challenge verification and anti-replay protection",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["security", "coding"],
      complexity: { min: 7, max: 9 },
      ambiguity: { min: 2, max: 4 },
      consequence: { min: 8, max: 10 },
      scope: { min: 5, max: 7 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "frontier",
      rationale: "Core security protocol implementation where flaws lead to token theft or session hijack.",
    },
  },
  {
    id: "test-37",
    name: "Test 37: Event-Driven CQRS with Kafka",
    task: "Design an event-driven CQRS architecture using Kafka, event sourcing with immutable event store, and asynchronous read model projection rebuilds",
    context: { existingCodebase: true, largeCodebase: true },
    expected: {
      taskTypes: ["architecture", "coding"],
      complexity: { min: 8, max: 10 },
      ambiguity: { min: 3, max: 5 },
      consequence: { min: 7, max: 9 },
      scope: { min: 7, max: 10 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "frontier",
      rationale: "Enterprise architectural pattern requiring deep distributed consistency modeling.",
    },
  },
  {
    id: "test-38",
    name: "Test 38: WebGL Shader for Real-Time Heatmap",
    task: "Write an optimized WebGL GLSL fragment shader that dynamically renders 100,000 continuous data points with bicubic interpolation",
    expected: {
      taskTypes: ["coding"],
      complexity: { min: 6, max: 8 },
      ambiguity: { min: 2, max: 4 },
      consequence: { min: 3, max: 5 },
      scope: { min: 3, max: 5 },
      effort: { min: 2, max: 3 }, // MEDIUM to HIGH
      minimumModelTier: "standard",
      rationale: "Low-level graphics programming with mathematical coordinate transformations.",
    },
  },
  {
    id: "test-39",
    name: "Test 39: Deadlock in Multi-Threaded Go Worker Pool",
    task: "Diagnose and fix an intermittent deadlock in our multi-threaded Go worker pool caused by mutex lock inversion between sync.RWMutex and channel buffer",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["debugging"],
      complexity: { min: 8, max: 10 },
      ambiguity: { min: 6, max: 8 },
      consequence: { min: 7, max: 9 },
      scope: { min: 5, max: 7 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "frontier",
      rationale: "Complex concurrency synchronization bug with non-obvious mutex lock hierarchy.",
    },
  },
  {
    id: "test-40",
    name: "Test 40: Vector Embeddings Benchmark (HNSW vs IVF)",
    task: "Conduct an empirical benchmark comparing HNSW vs IVF vector indexing algorithms on recall@10, QPS, and memory footprint across 5M 1536-dim embeddings",
    expected: {
      taskTypes: ["research"],
      complexity: { min: 6, max: 8 },
      ambiguity: { min: 3, max: 5 },
      consequence: { min: 3, max: 5 },
      scope: { min: 4, max: 6 },
      effort: { min: 2, max: 3 }, // MEDIUM to HIGH
      minimumModelTier: "standard",
      rationale: "Empirical algorithmic research and statistical performance evaluation.",
    },
  },
  {
    id: "test-41",
    name: "Test 41: Incident Post-Mortem and Root Cause Analysis",
    task: "Write a blameless post-mortem RCA report for yesterday's 45-minute database connection pool starvation incident with five-whys analysis",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["writing"],
      complexity: { min: 4, max: 6 },
      ambiguity: { min: 2, max: 4 },
      consequence: { min: 4, max: 6 },
      scope: { min: 3, max: 5 },
      effort: { min: 2, max: 3 }, // MEDIUM to HIGH
      minimumModelTier: "budget",
      rationale: "Structured operational writing with clear incident timeline and remediation items.",
    },
  },
  {
    id: "test-42",
    name: "Test 42: Time-Series Anomaly Detection with STL",
    task: "Build an automated pipeline to detect sudden payment failure anomalies using STL seasonal decomposition and adaptive rolling z-score bands",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["data", "coding"],
      complexity: { min: 6, max: 8 },
      ambiguity: { min: 3, max: 5 },
      consequence: { min: 6, max: 8 },
      scope: { min: 4, max: 6 },
      effort: { min: 2, max: 3 }, // MEDIUM to HIGH
      minimumModelTier: "standard",
      rationale: "Statistical data pipeline balancing noise reduction with quick alerting.",
    },
  },
  {
    id: "test-43",
    name: "Test 43: Automated Dependency Vulnerability Remediation",
    task: "Create a CLI tool that parses package-lock.json, computes non-breaking semver updates for reported CVEs, and runs regression test suites",
    context: { existingCodebase: true },
    expected: {
      taskTypes: ["automation", "coding"],
      complexity: { min: 5, max: 7 },
      ambiguity: { min: 2, max: 4 },
      consequence: { min: 5, max: 7 },
      scope: { min: 4, max: 6 },
      effort: { min: 2, max: 3 }, // MEDIUM to HIGH
      minimumModelTier: "standard",
      rationale: "Software engineering automation with dependency tree parsing and validation.",
    },
  },
  {
    id: "test-44",
    name: "Test 44: Zero-Downtime Sharding Strategy for 10TB Table",
    task: "Design a zero-downtime hash-sharding migration strategy for our 10TB orders table, including dual-write proxy, backfill reconciliation, and switchover",
    context: { existingCodebase: true, largeCodebase: true },
    expected: {
      taskTypes: ["architecture", "database"],
      complexity: { min: 8, max: 10 },
      ambiguity: { min: 3, max: 5 },
      consequence: { min: 9, max: 10 },
      scope: { min: 8, max: 10 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "frontier",
      rationale: "Extreme data volume sharding with catastrophic business consequences upon corruption.",
    },
  },
  {
    id: "test-45",
    name: "Test 45: WebAssembly Module for Client-Side Cryptographic Hashing",
    task: "Write a Rust module compiled to WebAssembly providing SIMD-accelerated Blake3 and SHA-256 stream hashing for large client-side file uploads",
    expected: {
      taskTypes: ["coding"],
      complexity: { min: 7, max: 9 },
      ambiguity: { min: 2, max: 4 },
      consequence: { min: 5, max: 7 },
      scope: { min: 4, max: 6 },
      effort: { min: 3, max: 4 }, // HIGH to VERY_HIGH
      minimumModelTier: "standard",
      rationale: "Systems programming with WebAssembly bindings, SIMD intrinsics, and streaming chunk hashing.",
    },
  },
];
