import { z } from "zod";

export const TaskTypeSchema = z.enum([
  "architecture",
  "coding",
  "debugging",
  "research",
  "security",
  "writing",
  "data",
  "automation",
  "review",
  "other",
]);

export const TaskProfileSchema = z.object({
  taskType: TaskTypeSchema,
  complexity: z.number().min(0).max(10),
  ambiguity: z.number().min(0).max(10),
  consequence: z.number().min(0).max(10),
  novelty: z.number().min(0).max(10),
  contextDemand: z.number().min(0).max(10),
  scope: z.number().min(0).max(10),
  toolDemand: z.number().min(0).max(10),
  verifiability: z.number().min(0).max(10),

  existingCodebase: z.boolean(),
  largeCodebase: z.boolean(),
  securitySensitive: z.boolean(),
  architectureChanging: z.boolean(),

  summary: z.string().min(1),
  reasoning: z.array(z.string()).min(1),
});

export type TaskProfileSchemaType = z.infer<typeof TaskProfileSchema>;
