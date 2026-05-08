import path from "node:path";
import fs from "fs-extra";
import type { ProjectSnapshotDocument } from "./project-snapshot.js";

export type AutonomyActionType =
  | "install"
  | "refresh-context"
  | "refresh-code-context"
  | "reconcile"
  | "run-task"
  | "run-agent"
  | "replay"
  | "status";

export interface AutonomyCycleDocument {
  version: 1;
  generatedAt: string;
  targetRoot: string;
  feature: string;
  host: string;
  workflow: string;
  phase: string;
  currentStage: string;
  currentGate: string;
  gateStatus: string;
  executionMode: string;
  projectMode: string;
  interactionMode: string;
  contextStatus: string;
  contextCoverage: string;
  actionType: AutonomyActionType;
  approvalRequired: boolean;
  riskLevel: "low" | "medium" | "high";
  nextCommand: string;
  nextAction: string;
  reason: string;
  blockers: string[];
  missingOutputs: string[];
  completedOutputs: string[];
  recommendedNextWorkflow: string;
  nextAgent: string;
  nextTask: string;
  nextHandoff: string;
  workflowStateFile: string;
  projectSnapshotFile: string;
  autonomyStateFile: string;
}

export function resolveAutonomyStateFile(targetRoot: string, feature: string): string {
  return path.join(targetRoot, ".looply", "state", "autonomy", `${feature}.json`);
}

export function deriveAutonomyCycle(input: {
  snapshot: ProjectSnapshotDocument;
  featureName: string;
  host?: string;
}): AutonomyCycleDocument {
  const feature = input.snapshot.features.find((entry) => entry.feature === input.featureName);
  if (!feature) {
    throw new Error(`Feature not found in project snapshot: ${input.featureName}`);
  }

  const host = normalizeHost(input.host ?? input.snapshot.hosts[0]?.host ?? "codex");
  const commandDecision = selectNextCommand(input.snapshot, input.featureName, feature.workflow, feature);
  const actionType = classifyActionType(commandDecision.command);
  const riskLevel = classifyRiskLevel(actionType);
  const approvalRequired = actionType !== "reconcile" && riskLevel !== "low" && input.snapshot.project.interactionMode !== "autonomous";

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    targetRoot: input.snapshot.targetRoot,
    feature: feature.feature,
    host,
    workflow: feature.workflow,
    phase: feature.phase,
    currentStage: feature.currentStage,
    currentGate: feature.currentGate,
    gateStatus: feature.gateStatus,
    executionMode: feature.executionMode,
    projectMode: input.snapshot.project.projectMode,
    interactionMode: input.snapshot.project.interactionMode,
    contextStatus: input.snapshot.context.snapshot?.contextStatus ?? "unknown",
    contextCoverage: input.snapshot.context.snapshot?.contextCoverage ?? "unknown",
    actionType,
    approvalRequired,
    riskLevel,
    nextCommand: commandDecision.command,
    nextAction: commandDecision.label,
    reason: commandDecision.reason,
    blockers: feature.blockedBy,
    missingOutputs: feature.missingOutputs,
    completedOutputs: feature.completedOutputs,
    recommendedNextWorkflow: feature.recommendedNextWorkflow,
    nextAgent: feature.nextAgent,
    nextTask: feature.nextTask,
    nextHandoff: feature.nextHandoff,
    workflowStateFile: feature.file,
    projectSnapshotFile: path.join(input.snapshot.targetRoot, ".looply", "state", "project-snapshot.json"),
    autonomyStateFile: resolveAutonomyStateFile(input.snapshot.targetRoot, feature.feature)
  };
}

export async function writeAutonomyCycle(targetRoot: string, document: AutonomyCycleDocument): Promise<string> {
  const file = resolveAutonomyStateFile(targetRoot, document.feature);
  await fs.ensureDir(path.dirname(file));
  await fs.writeJson(file, document, { spaces: 2 });
  return file;
}

function normalizeHost(value: string): string {
  return value === "claude" ? "claude" : "codex";
}

function selectNextCommand(
  snapshot: ProjectSnapshotDocument,
  featureName: string,
  workflowName: string,
  feature: ProjectSnapshotDocument["features"][number]
): { command: string; label: string; reason: string } {
  if (!snapshot.project.installed) {
    return {
      command: "looply install --host codex,claude,opencode --scope project --pack software-delivery-suite --project-mode existing-project",
      label: "Initialize the project installation",
      reason: "The project is not installed yet, so the autonomous cycle should bootstrap the looply surfaces first."
    };
  }

  if (!snapshot.context.snapshot) {
    return {
      command: "looply refresh-context",
      label: "Refresh the project context",
      reason: "No project context snapshot is available yet."
    };
  }

  if (!snapshot.codeContext.snapshot) {
    return {
      command: "looply refresh-code-context",
      label: "Refresh the code-context snapshot",
      reason: "The multi-language code-context snapshot is missing."
    };
  }

  if (feature.executionMode !== "workflow") {
    return {
      command: `looply reconcile ${featureName}`,
      label: "Reconcile the feature back to workflow mode",
      reason: `Feature ${featureName} is currently in ${feature.executionMode} mode and should be reconciled before continuing.`
    };
  }

  if (feature.nextCommand) {
    return {
      command: feature.nextCommand,
      label: `Continue with the workflow's next command: ${feature.nextCommand}`,
      reason: `Workflow ${workflowName} already resolved the next command for the current stage.`
    };
  }

  if (feature.nextAgent && feature.nextTask) {
    return {
      command: `looply run-agent ${featureName} ${feature.nextAgent} --task ${feature.nextTask}`,
      label: `Run ${feature.nextAgent} for ${feature.nextTask}`,
      reason: "The workflow state still exposes a next agent and task, so the autonomous cycle can continue from them."
    };
  }

  if (feature.nextTask) {
    return {
      command: `looply run-task ${featureName} ${feature.nextTask}`,
      label: `Run the next task: ${feature.nextTask}`,
      reason: "The workflow state exposes a next task but no explicit agent command."
    };
  }

  return {
    command: "looply status",
    label: "Inspect the current status before deciding",
    reason: "The current workflow state does not expose a clear next command."
  };
}

function classifyActionType(command: string): AutonomyActionType {
  if (command.startsWith("looply install")) {
    return "install";
  }
  if (command.startsWith("looply refresh-context")) {
    return "refresh-context";
  }
  if (command.startsWith("looply refresh-code-context")) {
    return "refresh-code-context";
  }
  if (command.startsWith("looply reconcile")) {
    return "reconcile";
  }
  if (command.startsWith("looply run-agent")) {
    return "run-agent";
  }
  if (command.startsWith("looply run-task")) {
    return "run-task";
  }
  if (command.startsWith("looply replay")) {
    return "replay";
  }

  return "status";
}

function classifyRiskLevel(actionType: AutonomyActionType): "low" | "medium" | "high" {
  if (actionType === "status" || actionType === "refresh-context" || actionType === "refresh-code-context") {
    return "low";
  }

  if (actionType === "reconcile") {
    return "medium";
  }

  return actionType === "install" ? "high" : "medium";
}
