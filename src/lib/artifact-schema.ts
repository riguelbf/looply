import { z } from "zod";

export const executionSchema = z.object({
  profile: z.string().min(1),
  reasoning_effort: z.enum(["low", "medium", "high"]),
  context_budget: z.enum(["small", "medium", "large"]),
  latency_priority: z.enum(["low", "medium", "high"]),
  preferred_hosts: z.array(z.string()).default([]),
  model_hint: z
    .object({
      provider: z.string().min(1),
      family: z.string().min(1)
    })
    .optional()
});

export const artifactSchema = z.object({
  schema: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1).optional(),
  execution: executionSchema.optional()
});

export const agentSchema = artifactSchema.extend({
  role: z.string().min(1),
  mission: z.string().min(1),
  parent_agent: z.string().min(1).optional(),
  specialization: z.string().min(1).optional(),
  supported_tasks: z.array(z.string()).default([]),
  knowledge_sources: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  escalation_rules: z.array(z.string()).default([])
});

export const taskSchema = artifactSchema.extend({
  agent: z.string().min(1),
  inputs: z.array(z.string()).default([]),
  context: z.array(z.string()).default([]),
  outputs: z.array(z.string()).default([]),
  templates: z.array(z.string()).default([]),
  checklists: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([])
});

export const workflowHandoffSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  artifact: z.string().min(1)
});

export const workflowStageSchema = z.object({
  name: z.string().min(1),
  task: z.string().min(1),
  agent: z.string().min(1),
  depends_on: z.array(z.string()).default([]),
  inputs: z.array(z.string()).default([]),
  outputs: z.array(z.string()).default([])
});

export const workflowGateSchema = z.object({
  name: z.string().min(1),
  after_stage: z.string().min(1),
  owner: z.string().min(1),
  requires_outputs: z.array(z.string()).default([]),
  checklist: z.string().min(1).optional(),
  blocks_on_failure: z.boolean().default(true)
});

export const workflowCommandArgumentSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  required: z.boolean().default(false),
  variadic: z.boolean().default(false)
});

export const workflowCommandSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/),
  aliases: z.array(z.string().regex(/^[a-z0-9-]+$/)).default([]),
  description: z.string().min(1),
  argument_hint: z.string().min(1),
  arguments: z.array(workflowCommandArgumentSchema).default([])
});

export const workflowPhaseSchema = z.enum(["discovery", "planning", "delivery", "status"]);

export const workflowSchema = artifactSchema.extend({
  inputs: z.array(z.string()).default([]),
  phase: workflowPhaseSchema,
  orchestrator: z.string().min(1).optional(),
  stages: z.array(workflowStageSchema).default([]),
  handoffs: z.array(workflowHandoffSchema).default([]),
  gates: z.array(workflowGateSchema).default([]),
  command: workflowCommandSchema.optional(),
  outputs: z.array(z.string()).default([]),
  tasks: z.array(z.string()).default([])
});

export const knowledgeSchema = artifactSchema.extend({
  audience: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([])
});

export const checklistSchema = artifactSchema;

export const templateSchema = artifactSchema;

export const packSchema = artifactSchema.extend({
  pack_version: z.string().min(1),
  domains: z.array(z.string()).default([]),
  includes: z.object({
    packs: z.array(z.string()).default([]),
    agents: z.array(z.string()).default([]),
    tasks: z.array(z.string()).default([]),
    workflows: z.array(z.string()).default([])
  })
});

export type AgentFrontmatter = z.infer<typeof agentSchema>;
export type TaskFrontmatter = z.infer<typeof taskSchema>;
export type WorkflowFrontmatter = z.infer<typeof workflowSchema>;
export type KnowledgeFrontmatter = z.infer<typeof knowledgeSchema>;
export type ChecklistFrontmatter = z.infer<typeof checklistSchema>;
export type TemplateFrontmatter = z.infer<typeof templateSchema>;
export type PackFrontmatter = z.infer<typeof packSchema>;
