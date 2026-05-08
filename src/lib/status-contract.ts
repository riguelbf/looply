import path from "node:path";
import fs from "fs-extra";
import type { ProjectSnapshotDocument } from "./project-snapshot.js";

export type HostStatusRiskLevel = "low" | "medium" | "high";

export interface HostStatusContractDocument {
  version: 1;
  generatedAt: string;
  targetRoot: string;
  project: {
    installed: boolean;
    locale: string;
    projectMode: string;
    interactionMode: string;
    inferencePolicy: string;
    primaryContextRoot: string;
  };
  summary: {
    installCount: number;
    featureCount: number;
    blockedFeatureCount: number;
    readyFeatureCount: number;
    interventionCount: number;
    sessionCount: number;
    historyCount: number;
  };
  primary: {
    feature: string;
    workflow: string;
    currentStage: string;
    currentGate: string;
    gateStatus: string;
    executionMode: string;
    nextAgent: string;
    nextTask: string;
    nextCommand: string;
    recommendedRecoveryCommand: string;
    nextHandoff: string;
    decisionRationale: string;
    blockers: string[];
    missingOutputs: string[];
    completedOutputs: string[];
    recommendedNextWorkflow: string;
    shouldUseAutonomy: boolean;
    autonomyCommand: string;
    approvalRequired: boolean;
    riskLevel: HostStatusRiskLevel;
    nextAction: string;
  };
  featureSummaries: Array<{
    feature: string;
    workflow: string;
    currentStage: string;
    currentGate: string;
    gateStatus: string;
    executionMode: string;
    nextCommand: string;
    recommendedRecoveryCommand: string;
    lastUpdated: string;
  }>;
  references: {
    projectSnapshotFile: string;
    statusContractFile: string;
    workflowStateFile: string;
    contextSnapshotFile: string;
    codeContextFile: string;
  };
}

export function resolveHostStatusContractFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "host-status-contract.json");
}

export function buildHostStatusContract(
  snapshot: ProjectSnapshotDocument,
  projectSnapshotFile: string
): HostStatusContractDocument {
  const primaryFeature = selectPrimaryFeature(snapshot);
  const nextCommand = resolveNextCommand(snapshot, primaryFeature);
  const nextAction = nextCommand;
  const autonomyCommand = primaryFeature ? `looply autonomy ${primaryFeature.feature}` : "";
  const actionType = classifyActionType(nextCommand);
  const riskLevel = classifyRiskLevel(actionType);
  const approvalRequired = actionType !== "reconcile" && riskLevel !== "low" && snapshot.project.interactionMode !== "autonomous";
  const statusContractFile = resolveHostStatusContractFile(snapshot.targetRoot);

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    targetRoot: snapshot.targetRoot,
    project: {
      installed: snapshot.project.installed,
      locale: snapshot.project.locale,
      projectMode: snapshot.project.projectMode,
      interactionMode: snapshot.project.interactionMode,
      inferencePolicy: snapshot.project.inferencePolicy,
      primaryContextRoot: snapshot.project.primaryContextRoot
    },
    summary: {
      installCount: snapshot.summary.installCount,
      featureCount: snapshot.summary.featureCount,
      blockedFeatureCount: snapshot.summary.blockedFeatureCount,
      readyFeatureCount: snapshot.summary.readyFeatureCount,
      interventionCount: snapshot.summary.interventionCount,
      sessionCount: snapshot.summary.sessionCount,
      historyCount: snapshot.summary.historyCount
    },
    primary: {
      feature: primaryFeature?.feature ?? "",
      workflow: primaryFeature?.workflow ?? "",
      currentStage: primaryFeature?.currentStage ?? "",
      currentGate: primaryFeature?.currentGate ?? "",
      gateStatus: primaryFeature?.gateStatus ?? "",
      executionMode: primaryFeature?.executionMode ?? "",
      nextAgent: primaryFeature?.nextAgent ?? "",
      nextTask: primaryFeature?.nextTask ?? "",
      nextCommand,
      recommendedRecoveryCommand: primaryFeature?.recommendedRecoveryCommand ?? "",
      nextHandoff: primaryFeature?.nextHandoff ?? "",
      decisionRationale: primaryFeature?.decisionRationale ?? "",
      blockers: primaryFeature?.blockedBy ?? [],
      missingOutputs: primaryFeature?.missingOutputs ?? [],
      completedOutputs: primaryFeature?.completedOutputs ?? [],
      recommendedNextWorkflow: primaryFeature?.recommendedNextWorkflow ?? "",
      shouldUseAutonomy: primaryFeature ? shouldSuggestAutonomy(snapshot, primaryFeature) : false,
      autonomyCommand,
      approvalRequired,
      riskLevel,
      nextAction
    },
    featureSummaries: snapshot.features.slice(0, 3).map((feature) => ({
      feature: feature.feature,
      workflow: feature.workflow,
      currentStage: feature.currentStage,
      currentGate: feature.currentGate,
      gateStatus: feature.gateStatus,
      executionMode: feature.executionMode,
      nextCommand: feature.nextCommand,
      recommendedRecoveryCommand: feature.recommendedRecoveryCommand,
      lastUpdated: feature.lastUpdated
    })),
    references: {
      projectSnapshotFile,
      statusContractFile,
      workflowStateFile: primaryFeature?.file ?? "",
      contextSnapshotFile: snapshot.context.snapshotFile,
      codeContextFile: snapshot.codeContext.file
    }
  };
}

export async function writeHostStatusContract(targetRoot: string, document: HostStatusContractDocument): Promise<string> {
  const file = resolveHostStatusContractFile(targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.writeJson(file, document, { spaces: 2 });
  return file;
}

function selectPrimaryFeature(snapshot: ProjectSnapshotDocument): ProjectSnapshotDocument["features"][number] | null {
  return snapshot.features.find((feature) => feature.executionMode !== "workflow")
    ?? snapshot.features.find((feature) => feature.nextCommand !== "" || feature.recommendedRecoveryCommand !== "")
    ?? snapshot.features[0]
    ?? null;
}

function resolveNextCommand(
  snapshot: ProjectSnapshotDocument,
  feature: ProjectSnapshotDocument["features"][number] | null
): string {
  if (!snapshot.project.installed) {
    return "looply install --host codex,claude,opencode --scope project --pack software-delivery-suite --project-mode existing-project";
  }

  if (!snapshot.context.snapshot) {
    return "looply refresh-context";
  }

  if (!snapshot.codeContext.snapshot) {
    return "looply refresh-code-context";
  }

  if (!feature) {
    return "looply inspect workflow story-to-production";
  }

  if (feature.executionMode !== "workflow") {
    return `looply reconcile ${feature.feature}`;
  }

  if (feature.recommendedRecoveryCommand) {
    return feature.recommendedRecoveryCommand;
  }

  if (feature.nextCommand) {
    return feature.nextCommand;
  }

  if (feature.nextTask) {
    return `looply run-task ${feature.feature} ${feature.nextTask}`;
  }

  return "looply status";
}

function shouldSuggestAutonomy(
  snapshot: ProjectSnapshotDocument,
  feature: ProjectSnapshotDocument["features"][number]
): boolean {
  return snapshot.project.interactionMode === "autonomous" || feature.nextCommand !== "" || feature.recommendedRecoveryCommand !== "";
}

function classifyActionType(command: string): "install" | "refresh-context" | "refresh-code-context" | "reconcile" | "run-task" | "run-agent" | "replay" | "status" {
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

function classifyRiskLevel(actionType: "install" | "refresh-context" | "refresh-code-context" | "reconcile" | "run-task" | "run-agent" | "replay" | "status"): HostStatusRiskLevel {
  if (actionType === "status" || actionType === "refresh-context" || actionType === "refresh-code-context") {
    return "low";
  }

  if (actionType === "reconcile") {
    return "medium";
  }

  return actionType === "install" ? "high" : "medium";
}
