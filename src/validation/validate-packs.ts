import path from "node:path";
import { globby } from "globby";
import {
  agentSchema,
  checklistSchema,
  exampleSchema,
  knowledgeSchema,
  packSchema,
  taskSchema,
  templateSchema,
  workflowSchema,
  type AgentFrontmatter,
  type ChecklistFrontmatter,
  type ExampleFrontmatter,
  type KnowledgeFrontmatter,
  type PackFrontmatter,
  type TaskFrontmatter,
  type TemplateFrontmatter,
  type WorkflowFrontmatter
} from "../lib/artifact-schema.js";
import { supportedHosts } from "../lib/host-publisher.js";
import { readMarkdownArtifact } from "../lib/markdown-artifact.js";

type ValidationSeverity = "error" | "warning";
type ArtifactType = "agent" | "task" | "workflow" | "knowledge" | "checklist" | "template" | "example" | "pack";

interface ValidationMessage {
  severity: ValidationSeverity;
  file: string;
  message: string;
}

interface NamedArtifact<TFrontmatter> {
  file: string;
  frontmatter: TFrontmatter;
}

interface PackRegistry {
  pack: NamedArtifact<PackFrontmatter> | null;
  agents: Map<string, NamedArtifact<AgentFrontmatter>>;
  tasks: Map<string, NamedArtifact<TaskFrontmatter>>;
  workflows: Map<string, NamedArtifact<WorkflowFrontmatter>>;
  knowledge: Map<string, NamedArtifact<KnowledgeFrontmatter>>;
  checklists: Map<string, NamedArtifact<ChecklistFrontmatter>>;
  templates: Map<string, NamedArtifact<TemplateFrontmatter>>;
  examples: Map<string, NamedArtifact<ExampleFrontmatter>>;
}

export interface ValidationReport {
  ok: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
}

export async function validateWorkspace(sourceRoot: string): Promise<ValidationReport> {
  const files = await globby("packs/**/*.md", {
    cwd: sourceRoot,
    absolute: true,
    onlyFiles: true
  });
  const packDefinitionFiles = await globby("packs/*/pack.md", {
    cwd: sourceRoot,
    onlyFiles: true
  });
  const activePackNames = new Set(
    packDefinitionFiles.map((file) => {
      const normalized = file.replaceAll("\\", "/");
      return normalized.split("/")[1];
    })
  );

  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];
  const registries = new Map<string, PackRegistry>();

  for (const file of files) {
    const relativeFile = path.relative(sourceRoot, file);
    const parsed = await readMarkdownArtifact(file);
    const packName = relativeFile.split(path.sep)[1];

    if (!activePackNames.has(packName)) {
      warnings.push({
        severity: "warning",
        file: relativeFile,
        message: "Pack directory is a placeholder and is not part of active validation"
      });
      continue;
    }

    const registry = getOrCreateRegistry(registries, packName);

    const artifactType = inferArtifactType(relativeFile);
    if (!artifactType) {
      warnings.push({
        severity: "warning",
        file: relativeFile,
        message: "Could not infer artifact type from path"
      });
      continue;
    }

    const schemaResult = parseByType(artifactType, parsed.frontmatter);
    if (!schemaResult.success) {
      errors.push({
        severity: "error",
        file: relativeFile,
        message: schemaResult.error.issues.map((issue) => issue.path.join(".") + ": " + issue.message).join("; ")
      });
      continue;
    }

    registerArtifact(registry, artifactType, relativeFile, schemaResult.data, errors);
    validateExecutionMetadata(relativeFile, schemaResult.data as { execution?: Record<string, unknown> }, errors, warnings);
  }

  for (const [packName, registry] of registries) {
    validateRegistry(packName, registry, registries, errors);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}

function validateExecutionMetadata(
  file: string,
  frontmatter: { execution?: Record<string, unknown> },
  errors: ValidationMessage[],
  warnings: ValidationMessage[]
): void {
  const execution = frontmatter.execution;
  if (!execution) {
    return;
  }

  const profile = String(execution.profile ?? "");
  const reasoningEffort = String(execution.reasoning_effort ?? "");
  const contextBudget = String(execution.context_budget ?? "");
  const latencyPriority = String(execution.latency_priority ?? "");
  const preferredHosts = Array.isArray(execution.preferred_hosts)
    ? execution.preferred_hosts.map((host) => String(host))
    : [];
  const modelHint = execution.model_hint as { provider?: string; family?: string } | undefined;

  for (const host of preferredHosts) {
    if (!supportedHosts.includes(host as (typeof supportedHosts)[number])) {
      errors.push({
        severity: "error",
        file,
        message: `Execution metadata references unsupported host: ${host}`
      });
    }
  }

  if (preferredHosts.length === 0) {
    warnings.push({
      severity: "warning",
      file,
      message: "Execution metadata does not declare preferred_hosts"
    });
  }

  if (modelHint) {
    const provider = String(modelHint.provider ?? "").toLowerCase();
    const family = String(modelHint.family ?? "").toLowerCase();

    if (provider === "openai" && family.includes("claude")) {
      errors.push({
        severity: "error",
        file,
        message: "Execution model_hint mixes provider openai with a claude family"
      });
    }

    if (provider === "anthropic" && (family.includes("gpt") || family.includes("o1") || family.includes("o3"))) {
      errors.push({
        severity: "error",
        file,
        message: "Execution model_hint mixes provider anthropic with an OpenAI family"
      });
    }

    if (preferredHosts.length === 1 && preferredHosts[0] === "claude" && provider === "openai") {
      warnings.push({
        severity: "warning",
        file,
        message: "Execution prefers only claude host but model_hint points to openai"
      });
    }

    if (preferredHosts.length === 1 && preferredHosts[0] === "codex" && provider === "anthropic") {
      warnings.push({
        severity: "warning",
        file,
        message: "Execution prefers only codex host but model_hint points to anthropic"
      });
    }
  }

  switch (profile) {
    case "implementation":
      if (reasoningEffort !== "high") {
        warnings.push({
          severity: "warning",
          file,
          message: "Implementation profile usually expects reasoning_effort: high"
        });
      }
      if (contextBudget !== "large") {
        warnings.push({
          severity: "warning",
          file,
          message: "Implementation profile usually expects context_budget: large"
        });
      }
      break;

    case "structured-analysis":
      if (rankOf(reasoningEffort) < rankOf("medium")) {
        warnings.push({
          severity: "warning",
          file,
          message: "Structured-analysis profile usually expects reasoning_effort at least medium"
        });
      }
      if (rankOf(contextBudget) < rankOf("medium")) {
        warnings.push({
          severity: "warning",
          file,
          message: "Structured-analysis profile usually expects context_budget at least medium"
        });
      }
      break;

    case "review":
      if (rankOf(reasoningEffort) < rankOf("medium")) {
        warnings.push({
          severity: "warning",
          file,
          message: "Review profile usually expects reasoning_effort at least medium"
        });
      }
      break;

    case "publishing":
      if (reasoningEffort === "high") {
        warnings.push({
          severity: "warning",
          file,
          message: "Publishing profile is usually cheaper with reasoning_effort below high"
        });
      }
      if (contextBudget === "large") {
        warnings.push({
          severity: "warning",
          file,
          message: "Publishing profile usually does not need context_budget: large"
        });
      }
      if (latencyPriority === "high") {
        warnings.push({
          severity: "warning",
          file,
          message: "Publishing profile usually does not prioritize high latency sensitivity"
        });
      }
      break;

    default:
      warnings.push({
        severity: "warning",
        file,
        message: `Execution profile is custom and has no semantic rules yet: ${profile}`
      });
      break;
  }
}

function rankOf(value: string): number {
  switch (value) {
    case "low":
    case "small":
      return 1;
    case "medium":
      return 2;
    case "high":
    case "large":
      return 3;
    default:
      return 0;
  }
}

function inferArtifactType(relativeFile: string): ArtifactType | null {
  if (relativeFile.endsWith("/pack.md")) {
    return "pack";
  }

  if (relativeFile.includes("/agents/")) {
    return "agent";
  }

  if (relativeFile.includes("/tasks/")) {
    return "task";
  }

  if (relativeFile.includes("/workflows/")) {
    return "workflow";
  }

  if (relativeFile.includes("/knowledge/")) {
    return "knowledge";
  }

  if (relativeFile.includes("/checklists/")) {
    return "checklist";
  }

  if (relativeFile.includes("/examples/")) {
    return "example";
  }

  if (relativeFile.includes("/templates/")) {
    return "template";
  }

  return null;
}

function parseByType(type: ArtifactType, frontmatter: Record<string, unknown>) {
  switch (type) {
    case "agent":
      return agentSchema.safeParse(frontmatter);
    case "task":
      return taskSchema.safeParse(frontmatter);
    case "workflow":
      return workflowSchema.safeParse(frontmatter);
    case "knowledge":
      return knowledgeSchema.safeParse(frontmatter);
    case "checklist":
      return checklistSchema.safeParse(frontmatter);
    case "template":
      return templateSchema.safeParse(frontmatter);
    case "example":
      return exampleSchema.safeParse(frontmatter);
    case "pack":
      return packSchema.safeParse(frontmatter);
  }
}

function getOrCreateRegistry(registries: Map<string, PackRegistry>, packName: string): PackRegistry {
  const existing = registries.get(packName);
  if (existing) {
    return existing;
  }

  const created: PackRegistry = {
    pack: null,
    agents: new Map(),
    tasks: new Map(),
    workflows: new Map(),
    knowledge: new Map(),
    checklists: new Map(),
    templates: new Map(),
    examples: new Map()
  };

  registries.set(packName, created);
  return created;
}

function registerArtifact(
  registry: PackRegistry,
  type: ArtifactType,
  file: string,
  frontmatter:
    | AgentFrontmatter
    | TaskFrontmatter
    | WorkflowFrontmatter
    | KnowledgeFrontmatter
    | ChecklistFrontmatter
    | TemplateFrontmatter
    | ExampleFrontmatter
    | PackFrontmatter,
  errors: ValidationMessage[]
): void {
  if (type === "pack") {
    if (registry.pack) {
      errors.push({
        severity: "error",
        file,
        message: "Duplicate pack definition"
      });
      return;
    }

    registry.pack = { file, frontmatter: frontmatter as PackFrontmatter };
    return;
  }

  const map = getRegistryMap(registry, type);
  const name = frontmatter.name;

  if (map.has(name)) {
    errors.push({
      severity: "error",
      file,
      message: `Duplicate ${type} name: ${name}`
    });
    return;
  }

  map.set(name, { file, frontmatter: frontmatter as never });
}

function getRegistryMap(registry: PackRegistry, type: Exclude<ArtifactType, "pack">) {
  switch (type) {
    case "agent":
      return registry.agents;
    case "task":
      return registry.tasks;
    case "workflow":
      return registry.workflows;
    case "knowledge":
      return registry.knowledge;
    case "checklist":
      return registry.checklists;
    case "template":
      return registry.templates;
    case "example":
      return registry.examples;
  }
}

function validateRegistry(
  packName: string,
  registry: PackRegistry,
  registries: Map<string, PackRegistry>,
  errors: ValidationMessage[]
): void {
  if (!registry.pack) {
    errors.push({
      severity: "error",
      file: `packs/${packName}`,
      message: "Missing pack.md"
    });
    return;
  }

  validatePackIncludes(registry, registries, errors);
  validateAgents(registry, errors);
  validateTasks(registry, errors);
  validateWorkflows(registry, errors);
}

function validatePackIncludes(
  registry: PackRegistry,
  registries: Map<string, PackRegistry>,
  errors: ValidationMessage[]
): void {
  const includes = registry.pack?.frontmatter.includes;
  if (!includes) {
    return;
  }

  for (const pack of includes.packs) {
    if (!registries.has(pack)) {
      errors.push({
        severity: "error",
        file: registry.pack!.file,
        message: `Pack includes missing nested pack: ${pack}`
      });
    }
  }

  for (const agent of includes.agents) {
    if (!registry.agents.has(agent)) {
      errors.push({
        severity: "error",
        file: registry.pack!.file,
        message: `Pack includes missing agent: ${agent}`
      });
    }
  }

  for (const task of includes.tasks) {
    if (!registry.tasks.has(task)) {
      errors.push({
        severity: "error",
        file: registry.pack!.file,
        message: `Pack includes missing task: ${task}`
      });
    }
  }

  for (const workflow of includes.workflows) {
    if (!registry.workflows.has(workflow)) {
      errors.push({
        severity: "error",
        file: registry.pack!.file,
        message: `Pack includes missing workflow: ${workflow}`
      });
    }
  }
}

function validateAgents(registry: PackRegistry, errors: ValidationMessage[]): void {
  for (const agent of registry.agents.values()) {
    for (const taskName of agent.frontmatter.supported_tasks) {
      if (!registry.tasks.has(taskName)) {
        errors.push({
          severity: "error",
          file: agent.file,
          message: `Agent references missing task: ${taskName}`
        });
      }
    }

    for (const knowledgeSource of agent.frontmatter.knowledge_sources) {
      const normalizedName = path.basename(knowledgeSource, ".md");
      if (!registry.knowledge.has(normalizedName)) {
        errors.push({
          severity: "error",
          file: agent.file,
          message: `Agent references missing knowledge source: ${knowledgeSource}`
        });
      }
    }
  }
}

function validateTasks(registry: PackRegistry, errors: ValidationMessage[]): void {
  for (const task of registry.tasks.values()) {
    if (!registry.agents.has(task.frontmatter.agent)) {
      errors.push({
        severity: "error",
        file: task.file,
        message: `Task references missing agent: ${task.frontmatter.agent}`
      });
    }

    for (const knowledgeName of task.frontmatter.context) {
      if (!registry.knowledge.has(knowledgeName)) {
        errors.push({
          severity: "error",
          file: task.file,
          message: `Task references missing knowledge context: ${knowledgeName}`
        });
      }
    }

    for (const templateName of task.frontmatter.templates) {
      if (!registry.templates.has(templateName)) {
        errors.push({
          severity: "error",
          file: task.file,
          message: `Task references missing template: ${templateName}`
        });
      }
    }

    for (const checklistName of task.frontmatter.checklists) {
      if (!registry.checklists.has(checklistName)) {
        errors.push({
          severity: "error",
          file: task.file,
          message: `Task references missing checklist: ${checklistName}`
        });
      }
    }

    for (const dependencyName of task.frontmatter.dependencies) {
      if (!registry.tasks.has(dependencyName)) {
        errors.push({
          severity: "error",
          file: task.file,
          message: `Task references missing dependency: ${dependencyName}`
        });
      }
    }
  }
}

function validateWorkflows(registry: PackRegistry, errors: ValidationMessage[]): void {
  const commandNames = new Map<string, string>();

  for (const workflow of registry.workflows.values()) {
    const stageNames = new Set(workflow.frontmatter.stages.map((stage) => stage.name));
    const stagedTasks = new Set(workflow.frontmatter.stages.map((stage) => stage.task));
    const producedOutputs = new Set<string>();

    if (stageNames.size !== workflow.frontmatter.stages.length) {
      errors.push({
        severity: "error",
        file: workflow.file,
        message: "Workflow stages must have unique names"
      });
    }

    if (workflow.frontmatter.command) {
      const previousFile = commandNames.get(workflow.frontmatter.command.name);
      if (previousFile) {
        errors.push({
          severity: "error",
          file: workflow.file,
          message: `Workflow command name must be unique within the pack: ${workflow.frontmatter.command.name}`
        });
      } else {
        commandNames.set(workflow.frontmatter.command.name, workflow.file);
      }

      const variadicArguments = workflow.frontmatter.command.arguments.filter((argument) => argument.variadic);
      if (variadicArguments.length > 1) {
        errors.push({
          severity: "error",
          file: workflow.file,
          message: "Workflow command can declare at most one variadic argument"
        });
      }

      const variadicArgument = workflow.frontmatter.command.arguments.find((argument) => argument.variadic);
      if (variadicArgument && workflow.frontmatter.command.arguments.at(-1)?.name !== variadicArgument.name) {
        errors.push({
          severity: "error",
          file: workflow.file,
          message: "Workflow command variadic argument must be the last declared argument"
        });
      }
    }

    if (!workflow.frontmatter.orchestrator) {
      errors.push({
        severity: "error",
        file: workflow.file,
        message: "Workflow must declare an orchestrator agent"
      });
    } else if (!registry.agents.has(workflow.frontmatter.orchestrator)) {
      errors.push({
        severity: "error",
        file: workflow.file,
        message: `Workflow references missing orchestrator agent: ${workflow.frontmatter.orchestrator}`
      });
    } else {
      const orchestratorAgent = registry.agents.get(workflow.frontmatter.orchestrator);
      if (orchestratorAgent && orchestratorAgent.frontmatter.supported_tasks.length === 0) {
        errors.push({
          severity: "error",
          file: workflow.file,
          message: `Workflow orchestrator agent must declare at least one supported task: ${workflow.frontmatter.orchestrator}`
        });
      }
    }

    if (workflow.frontmatter.phase === "status") {
      if (workflow.frontmatter.stages.length !== 1) {
        errors.push({
          severity: "error",
          file: workflow.file,
          message: "Status workflows must declare exactly one reconciliation stage"
        });
      }
    }

    for (const taskName of workflow.frontmatter.tasks) {
      if (!registry.tasks.has(taskName)) {
        errors.push({
          severity: "error",
          file: workflow.file,
          message: `Workflow references missing task: ${taskName}`
        });
      }

      if (!stagedTasks.has(taskName)) {
        errors.push({
          severity: "error",
          file: workflow.file,
          message: `Workflow task list includes task without explicit stage: ${taskName}`
        });
      }
    }

    for (const stage of workflow.frontmatter.stages) {
      if (!workflow.frontmatter.tasks.includes(stage.task)) {
        errors.push({
          severity: "error",
          file: workflow.file,
          message: `Workflow stage ${stage.name} references task not declared in tasks list: ${stage.task}`
        });
      }

      if (!registry.tasks.has(stage.task)) {
        errors.push({
          severity: "error",
          file: workflow.file,
          message: `Workflow stage references missing task: ${stage.task}`
        });
      }

      if (!registry.agents.has(stage.agent)) {
        errors.push({
          severity: "error",
          file: workflow.file,
          message: `Workflow stage references missing agent: ${stage.agent}`
        });
      }

      const task = registry.tasks.get(stage.task);
      if (task && task.frontmatter.agent !== stage.agent) {
        errors.push({
          severity: "error",
          file: workflow.file,
          message: `Workflow stage ${stage.name} assigns agent ${stage.agent} but task ${stage.task} belongs to ${task.frontmatter.agent}`
        });
      }

      for (const dependency of stage.depends_on) {
        if (!stageNames.has(dependency)) {
          errors.push({
            severity: "error",
            file: workflow.file,
            message: `Workflow stage ${stage.name} depends on missing stage: ${dependency}`
          });
        }
      }

      for (const output of stage.outputs) {
        producedOutputs.add(output);
      }
    }

    for (const handoff of workflow.frontmatter.handoffs) {
      if (!registry.agents.has(handoff.from)) {
        errors.push({
          severity: "error",
          file: workflow.file,
          message: `Workflow handoff references missing source agent: ${handoff.from}`
        });
      }

      if (!registry.agents.has(handoff.to)) {
        errors.push({
          severity: "error",
          file: workflow.file,
          message: `Workflow handoff references missing target agent: ${handoff.to}`
        });
      }

      if (!producedOutputs.has(handoff.artifact)) {
        errors.push({
          severity: "error",
          file: workflow.file,
          message: `Workflow handoff artifact is not produced by any stage: ${handoff.artifact}`
        });
      }
    }

    for (const gate of workflow.frontmatter.gates) {
      if (!stageNames.has(gate.after_stage)) {
        errors.push({
          severity: "error",
          file: workflow.file,
          message: `Workflow gate ${gate.name} references missing stage: ${gate.after_stage}`
        });
      }

      if (!registry.agents.has(gate.owner)) {
        errors.push({
          severity: "error",
          file: workflow.file,
          message: `Workflow gate ${gate.name} references missing owner agent: ${gate.owner}`
        });
      }

      if (gate.checklist && !registry.checklists.has(gate.checklist)) {
        errors.push({
          severity: "error",
          file: workflow.file,
          message: `Workflow gate ${gate.name} references missing checklist: ${gate.checklist}`
        });
      }

      for (const requiredOutput of gate.requires_outputs) {
        if (!producedOutputs.has(requiredOutput)) {
          errors.push({
            severity: "error",
            file: workflow.file,
            message: `Workflow gate ${gate.name} requires missing output: ${requiredOutput}`
          });
        }
      }
    }

    if (workflow.frontmatter.stages.length === 0) {
      errors.push({
        severity: "error",
        file: workflow.file,
        message: "Workflow must declare explicit stages"
      });
    }

    if (workflow.frontmatter.gates.length === 0) {
      errors.push({
        severity: "error",
        file: workflow.file,
        message: "Workflow must declare explicit gates"
      });
    }
  }
}
