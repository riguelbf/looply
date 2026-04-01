import { isContextPerfMode, setPerfMetadata } from "./session.js";

export interface WorkflowPerfShape {
  feature: string;
  workflow?: string;
  currentStage?: string;
  currentGate?: string;
  activeArtifact?: string;
  nextAgent?: string;
  nextTask?: string;
  nextHandoff?: string;
  nextCommand?: string;
  blockedBy?: string[];
  missingOutputs?: string[];
  completedOutputs?: string[];
  openQuestions?: string[];
  constraints?: string[];
  relatedIntegrations?: string[];
  decisionRationale?: string;
}

export function recordWorkflowContextMetrics(prefix: string, state: WorkflowPerfShape): void {
  setPerfMetadata(`${prefix}.feature`, state.feature);
  if (state.workflow) {
    setPerfMetadata(`${prefix}.workflow`, state.workflow);
  }
  if (state.currentStage) {
    setPerfMetadata(`${prefix}.currentStage`, state.currentStage);
  }
  if (state.currentGate) {
    setPerfMetadata(`${prefix}.currentGate`, state.currentGate);
  }
  if (state.activeArtifact) {
    setPerfMetadata(`${prefix}.activeArtifact`, state.activeArtifact);
  }
  if (state.nextAgent) {
    setPerfMetadata(`${prefix}.nextAgent`, state.nextAgent);
  }
  if (state.nextTask) {
    setPerfMetadata(`${prefix}.nextTask`, state.nextTask);
  }

  const blockedBy = state.blockedBy ?? [];
  const missingOutputs = state.missingOutputs ?? [];
  const completedOutputs = state.completedOutputs ?? [];
  const openQuestions = state.openQuestions ?? [];
  const constraints = state.constraints ?? [];
  const relatedIntegrations = state.relatedIntegrations ?? [];

  setPerfMetadata(`${prefix}.blockedByCount`, blockedBy.length);
  setPerfMetadata(`${prefix}.missingOutputCount`, missingOutputs.length);
  setPerfMetadata(`${prefix}.completedOutputCount`, completedOutputs.length);

  if (!isContextPerfMode()) {
    return;
  }

  setPerfMetadata(`${prefix}.openQuestionCount`, openQuestions.length);
  setPerfMetadata(`${prefix}.constraintCount`, constraints.length);
  setPerfMetadata(`${prefix}.integrationCount`, relatedIntegrations.length);
  setPerfMetadata(`${prefix}.nextHandoffChars`, (state.nextHandoff ?? "").length);
  setPerfMetadata(`${prefix}.nextCommandChars`, (state.nextCommand ?? "").length);
  setPerfMetadata(`${prefix}.decisionRationaleChars`, (state.decisionRationale ?? "").length);
  setPerfMetadata(
    `${prefix}.estimatedContextChars`,
    estimateWorkflowContextChars({
      ...state,
      blockedBy,
      missingOutputs,
      completedOutputs,
      openQuestions,
      constraints,
      relatedIntegrations
    })
  );
}

function estimateWorkflowContextChars(state: Required<Pick<
  WorkflowPerfShape,
  "feature" | "blockedBy" | "missingOutputs" | "completedOutputs" | "openQuestions" | "constraints" | "relatedIntegrations"
>> & WorkflowPerfShape): number {
  const parts = [
    state.feature,
    state.workflow ?? "",
    state.currentStage ?? "",
    state.currentGate ?? "",
    state.activeArtifact ?? "",
    state.nextAgent ?? "",
    state.nextTask ?? "",
    state.nextHandoff ?? "",
    state.nextCommand ?? "",
    state.decisionRationale ?? "",
    ...state.blockedBy,
    ...state.missingOutputs,
    ...state.completedOutputs,
    ...state.openQuestions,
    ...state.constraints,
    ...state.relatedIntegrations
  ];

  return parts.reduce((total, part) => total + part.length, 0);
}

