import path from "node:path";
import fs from "fs-extra";
import { loadArtifactCatalog } from "./artifact-catalog.js";
import { recordWorkflowContextMetrics } from "./perf/workflow.js";
import { setPerfMetadata, withPerfSpan } from "./perf/session.js";
import {
  readFeatureWorkflowMarkdownState,
  type FeatureWorkflowMarkdownState
} from "./feature-workflow-markdown.js";
import { resolveLooplySourceRoot } from "./source-root.js";

export type FeatureExecutionMode = "workflow" | "replay" | "manual-task" | "manual-agent";
export type FeatureInterventionType = "replay" | "task" | "agent" | "reconcile";

export interface FeatureWorkflowInterventionEntry {
  id: string;
  type: FeatureInterventionType;
  createdAt: string;
  summary: string;
  reason: string;
  agent: string;
  task: string;
  checkpoint: string;
  command: string;
  notes: string[];
  supersededOutputs: string[];
}

export interface FeatureWorkflowControlDocument {
  version: 1;
  feature: string;
  workflow: string;
  executionMode: FeatureExecutionMode;
  replayedFrom: string;
  supersededOutputs: string[];
  recommendedRecoveryCommand: string;
  recommendedRecoveryWorkflow: string;
  updatedAt: string;
  lastReconciledAt: string;
  interventions: FeatureWorkflowInterventionEntry[];
}

export interface RegisterReplayInput {
  targetRoot: string;
  feature: string;
  from: string;
  reason: string;
  notes: string[];
  sourceRoot?: string;
}

export interface RegisterTaskInterventionInput {
  targetRoot: string;
  feature: string;
  task: string;
  reason: string;
  notes: string[];
  sourceRoot?: string;
}

export interface RegisterAgentInterventionInput extends RegisterTaskInterventionInput {
  agent: string;
}

export function resolveFeatureWorkflowControlFile(targetRoot: string, feature: string): string {
  return path.join(targetRoot, ".looply", "custom", "features", feature, "workflow-control.json");
}

export async function readFeatureWorkflowControlDocument(
  targetRoot: string,
  feature: string
): Promise<FeatureWorkflowControlDocument | null> {
  const file = resolveFeatureWorkflowControlFile(targetRoot, feature);
  if (!(await fs.pathExists(file))) {
    return null;
  }

  const raw = await fs.readJson(file);
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const interventions = Array.isArray(record.interventions)
    ? record.interventions
        .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item) => ({
          id: String(item.id ?? ""),
          type: normalizeInterventionType(item.type),
          createdAt: String(item.createdAt ?? ""),
          summary: String(item.summary ?? ""),
          reason: String(item.reason ?? ""),
          agent: String(item.agent ?? ""),
          task: String(item.task ?? ""),
          checkpoint: String(item.checkpoint ?? ""),
          command: String(item.command ?? ""),
          notes: Array.isArray(item.notes) ? item.notes.map((entry) => String(entry)) : [],
          supersededOutputs: Array.isArray(item.supersededOutputs)
            ? item.supersededOutputs.map((entry) => String(entry))
            : []
        }))
        .filter((entry) => entry.id !== "")
    : [];

  return {
    version: 1,
    feature: String(record.feature ?? feature),
    workflow: String(record.workflow ?? ""),
    executionMode: normalizeExecutionMode(record.executionMode),
    replayedFrom: String(record.replayedFrom ?? ""),
    supersededOutputs: Array.isArray(record.supersededOutputs) ? record.supersededOutputs.map((entry) => String(entry)) : [],
    recommendedRecoveryCommand: String(record.recommendedRecoveryCommand ?? ""),
    recommendedRecoveryWorkflow: String(record.recommendedRecoveryWorkflow ?? ""),
    updatedAt: String(record.updatedAt ?? ""),
    lastReconciledAt: String(record.lastReconciledAt ?? ""),
    interventions
  };
}

export async function registerReplayIntervention(
  input: RegisterReplayInput
): Promise<{ file: string; document: FeatureWorkflowControlDocument }> {
  const featureState = await withPerfSpan("workflow-interventions.load-feature-state", async () => requireFeatureState(input.targetRoot, input.feature));
  recordWorkflowContextMetrics("workflow", featureState);
  const workflowMetadata = await withPerfSpan("workflow-interventions.resolve-workflow-metadata", async () => resolveWorkflowMetadata(featureState, input.sourceRoot));
  const supersededOutputs = computeSupersededOutputs(workflowMetadata, input.from);
  setPerfMetadata("workflow.supersededOutputCount", supersededOutputs.length);
  const control = await withPerfSpan("workflow-interventions.ensure-control-document", async () => ensureFeatureWorkflowControlDocument(input.targetRoot, featureState));
  const updated = withIntervention(control, {
    type: "replay",
    summary: `Replay from ${input.from}`,
    reason: input.reason,
    checkpoint: input.from,
    task: "",
    agent: "",
    command: "",
    notes: input.notes,
    supersededOutputs
  });

  updated.executionMode = "replay";
  updated.replayedFrom = input.from;
  updated.supersededOutputs = supersededOutputs;
  updated.recommendedRecoveryWorkflow = featureState.workflow || featureState.recommendedNextWorkflow;
  updated.recommendedRecoveryCommand = buildResumeCommand(featureState);

  return withPerfSpan("workflow-interventions.write-control-document", async () => writeFeatureWorkflowControlDocument(input.targetRoot, input.feature, updated));
}

export async function registerTaskIntervention(
  input: RegisterTaskInterventionInput
): Promise<{ file: string; document: FeatureWorkflowControlDocument }> {
  const featureState = await withPerfSpan("workflow-interventions.load-feature-state", async () => requireFeatureState(input.targetRoot, input.feature));
  recordWorkflowContextMetrics("workflow", featureState);
  const sourceRoot = resolveLooplySourceRoot(input.sourceRoot);
  const catalog = await withPerfSpan("workflow-interventions.load-artifact-catalog", async () => loadArtifactCatalog(sourceRoot));
  const taskArtifact = catalog.find((artifact) => artifact.type === "task" && artifact.name === input.task);

  if (!taskArtifact) {
    throw new Error(`Task not found: ${input.task}`);
  }

  setPerfMetadata("workflow.catalogArtifactCount", catalog.length);
  const control = await withPerfSpan("workflow-interventions.ensure-control-document", async () => ensureFeatureWorkflowControlDocument(input.targetRoot, featureState));
  const updated = withIntervention(control, {
    type: "task",
    summary: `Manual task ${input.task}`,
    reason: input.reason,
    checkpoint: featureState.currentStage,
    task: input.task,
    agent: String(taskArtifact.frontmatter.agent ?? ""),
    command: "",
    notes: input.notes,
    supersededOutputs: []
  });

  updated.executionMode = "manual-task";
  updated.recommendedRecoveryWorkflow = featureState.workflow || featureState.recommendedNextWorkflow;
  updated.recommendedRecoveryCommand = featureState.nextCommand || buildStatusCommand(featureState);

  return withPerfSpan("workflow-interventions.write-control-document", async () => writeFeatureWorkflowControlDocument(input.targetRoot, input.feature, updated));
}

export async function registerAgentIntervention(
  input: RegisterAgentInterventionInput
): Promise<{ file: string; document: FeatureWorkflowControlDocument }> {
  const featureState = await withPerfSpan("workflow-interventions.load-feature-state", async () => requireFeatureState(input.targetRoot, input.feature));
  recordWorkflowContextMetrics("workflow", featureState);
  const sourceRoot = resolveLooplySourceRoot(input.sourceRoot);
  const catalog = await withPerfSpan("workflow-interventions.load-artifact-catalog", async () => loadArtifactCatalog(sourceRoot));
  const agentArtifact = catalog.find((artifact) => artifact.type === "agent" && artifact.name === input.agent);
  const taskArtifact = catalog.find((artifact) => artifact.type === "task" && artifact.name === input.task);

  if (!agentArtifact) {
    throw new Error(`Agent not found: ${input.agent}`);
  }

  if (!taskArtifact) {
    throw new Error(`Task not found: ${input.task}`);
  }

  const supportedTasks = Array.isArray(agentArtifact.frontmatter.supported_tasks)
    ? agentArtifact.frontmatter.supported_tasks.map((entry) => String(entry))
    : [];
  if (supportedTasks.length > 0 && !supportedTasks.includes(input.task)) {
    throw new Error(`Agent ${input.agent} does not support task ${input.task}`);
  }

  setPerfMetadata("workflow.catalogArtifactCount", catalog.length);
  const control = await withPerfSpan("workflow-interventions.ensure-control-document", async () => ensureFeatureWorkflowControlDocument(input.targetRoot, featureState));
  const updated = withIntervention(control, {
    type: "agent",
    summary: `Manual agent ${input.agent} -> ${input.task}`,
    reason: input.reason,
    checkpoint: featureState.currentStage,
    task: input.task,
    agent: input.agent,
    command: "",
    notes: input.notes,
    supersededOutputs: []
  });

  updated.executionMode = "manual-agent";
  updated.recommendedRecoveryWorkflow = featureState.workflow || featureState.recommendedNextWorkflow;
  updated.recommendedRecoveryCommand = featureState.nextCommand || buildStatusCommand(featureState);

  return withPerfSpan("workflow-interventions.write-control-document", async () => writeFeatureWorkflowControlDocument(input.targetRoot, input.feature, updated));
}

export async function reconcileFeatureWorkflowControl(
  targetRoot: string,
  feature: string
): Promise<{ file: string; document: FeatureWorkflowControlDocument }> {
  const featureState = await withPerfSpan("workflow-interventions.load-feature-state", async () => requireFeatureState(targetRoot, feature));
  recordWorkflowContextMetrics("workflow", featureState);
  const control = await withPerfSpan("workflow-interventions.ensure-control-document", async () => ensureFeatureWorkflowControlDocument(targetRoot, featureState));
  const updated = withIntervention(control, {
    type: "reconcile",
    summary: "Reconcile workflow state",
    reason: "Recalculate next recommended path after interventions",
    checkpoint: featureState.currentStage,
    task: featureState.nextTask,
    agent: featureState.nextAgent,
    command: featureState.nextCommand,
    notes: [],
    supersededOutputs: control.supersededOutputs
  });

  updated.executionMode = "workflow";
  updated.recommendedRecoveryWorkflow = featureState.recommendedNextWorkflow || featureState.workflow;
  updated.recommendedRecoveryCommand = featureState.nextCommand || buildStatusCommand(featureState);
  updated.lastReconciledAt = new Date().toISOString();

  return withPerfSpan("workflow-interventions.write-control-document", async () => writeFeatureWorkflowControlDocument(targetRoot, feature, updated));
}

async function ensureFeatureWorkflowControlDocument(
  targetRoot: string,
  featureState: FeatureWorkflowMarkdownState
): Promise<FeatureWorkflowControlDocument> {
  const existing = await readFeatureWorkflowControlDocument(targetRoot, featureState.feature);
  if (existing) {
    return existing;
  }

  return {
    version: 1,
    feature: featureState.feature,
    workflow: featureState.workflow,
    executionMode: "workflow",
    replayedFrom: "",
    supersededOutputs: [],
    recommendedRecoveryCommand: featureState.nextCommand || buildStatusCommand(featureState),
    recommendedRecoveryWorkflow: featureState.recommendedNextWorkflow || featureState.workflow,
    updatedAt: new Date().toISOString(),
    lastReconciledAt: "",
    interventions: []
  };
}

async function requireFeatureState(targetRoot: string, feature: string): Promise<FeatureWorkflowMarkdownState> {
  const featureState = await readFeatureWorkflowMarkdownState(targetRoot, feature);
  if (!featureState) {
    throw new Error(`Feature workflow state not found: ${feature}`);
  }

  return featureState;
}

async function writeFeatureWorkflowControlDocument(
  targetRoot: string,
  feature: string,
  document: FeatureWorkflowControlDocument
): Promise<{ file: string; document: FeatureWorkflowControlDocument }> {
  const file = resolveFeatureWorkflowControlFile(targetRoot, feature);
  await fs.ensureDir(path.dirname(file));
  await fs.writeJson(file, document, { spaces: 2 });
  return { file, document };
}

function withIntervention(
  control: FeatureWorkflowControlDocument,
  input: Omit<FeatureWorkflowInterventionEntry, "id" | "createdAt">
): FeatureWorkflowControlDocument {
  const entry: FeatureWorkflowInterventionEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...input
  };

  return {
    ...control,
    updatedAt: entry.createdAt,
    interventions: [...control.interventions, entry],
    supersededOutputs: dedupeStrings([...control.supersededOutputs, ...entry.supersededOutputs])
  };
}

async function resolveWorkflowMetadata(
  featureState: FeatureWorkflowMarkdownState,
  sourceRootOverride?: string
): Promise<{
  stages: Array<{ name: string; task: string; agent: string; outputs: string[] }>;
  outputs: string[];
}> {
  const sourceRoot = resolveLooplySourceRoot(sourceRootOverride);
  const catalog = await loadArtifactCatalog(sourceRoot);
  const workflowArtifact = catalog.find((artifact) => artifact.type === "workflow" && artifact.name === featureState.workflow);
  const frontmatter = workflowArtifact?.frontmatter ?? {};
  const rawStages = Array.isArray(frontmatter.stages) ? frontmatter.stages : [];
  const stages = rawStages
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      name: String(entry.name ?? ""),
      task: String(entry.task ?? ""),
      agent: String(entry.agent ?? ""),
      outputs: Array.isArray(entry.outputs) ? entry.outputs.map((output) => String(output)) : []
    }));
  const outputs = Array.isArray(frontmatter.outputs) ? frontmatter.outputs.map((output) => String(output)) : [];
  return { stages, outputs };
}

function computeSupersededOutputs(
  metadata: {
    stages: Array<{ name: string; task: string; agent: string; outputs: string[] }>;
    outputs: string[];
  },
  checkpoint: string
): string[] {
  const normalizedCheckpoint = normalizeKey(checkpoint);
  if (normalizedCheckpoint === "") {
    return [];
  }

  const stageIndex = metadata.stages.findIndex(
    (stage) =>
      normalizeKey(stage.name) === normalizedCheckpoint ||
      normalizeKey(stage.task) === normalizedCheckpoint ||
      normalizeKey(stage.agent) === normalizedCheckpoint
  );
  if (stageIndex >= 0) {
    return dedupeStrings(metadata.stages.slice(stageIndex).flatMap((stage) => stage.outputs));
  }

  for (const [index, stage] of metadata.stages.entries()) {
    const outputIndex = stage.outputs.findIndex((output) => normalizeKey(output) === normalizedCheckpoint);
    if (outputIndex >= 0) {
      const currentStageTrailingOutputs = stage.outputs.slice(outputIndex + 1);
      const followingOutputs = metadata.stages.slice(index + 1).flatMap((item) => item.outputs);
      return dedupeStrings([...currentStageTrailingOutputs, ...followingOutputs]);
    }
  }

  const workflowOutputIndex = metadata.outputs.findIndex((output) => normalizeKey(output) === normalizedCheckpoint);
  if (workflowOutputIndex >= 0) {
    return dedupeStrings(metadata.outputs.slice(workflowOutputIndex + 1));
  }

  return [];
}

function buildResumeCommand(featureState: FeatureWorkflowMarkdownState): string {
  return featureState.nextCommand || buildStatusCommand(featureState);
}

function buildStatusCommand(featureState: FeatureWorkflowMarkdownState): string {
  const host = normalizeHost(featureState.host);
  return host === "claude"
    ? `/looply:workflow-status ${featureState.feature}`.trim()
    : `$looply-workflow-status ${featureState.feature}`.trim();
}

function normalizeExecutionMode(value: unknown): FeatureExecutionMode {
  if (value === "replay" || value === "manual-task" || value === "manual-agent") {
    return value;
  }

  return "workflow";
}

function normalizeInterventionType(value: unknown): FeatureInterventionType {
  if (value === "replay" || value === "task" || value === "agent" || value === "reconcile") {
    return value;
  }

  return "reconcile";
}

function normalizeHost(value: string): "codex" | "claude" | "opencode" {
  const normalized = value.trim().toLowerCase();
  if (normalized === "claude") return "claude";
  if (normalized === "opencode") return "opencode";
  return "codex";
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim() !== ""))];
}
