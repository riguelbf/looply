import {
  readFeatureWorkflowMarkdownStates,
  type FeatureWorkflowMarkdownState
} from "./feature-workflow-markdown.js";
import {
  readFeatureWorkflowControlDocument,
  type FeatureWorkflowInterventionEntry
} from "./workflow-interventions.js";

export interface FeatureWorkflowState {
  feature: string;
  workflow: string;
  phase: string;
  currentStage: string;
  currentGate: string;
  gateStatus: string;
  activeArtifact: string;
  selectedStory: string;
  readyForNextGate: string;
  recommendedNextWorkflow: string;
  host: string;
  nextAgent: string;
  nextTask: string;
  nextCommand: string;
  nextHandoff: string;
  projectMode: string;
  primaryContextRoot: string;
  inferencePolicy: string;
  contextStatus: string;
  contextCoverage: string;
  blockedBy: string[];
  missingOutputs: string[];
  completedOutputs: string[];
  storyAcceptanceCriteria: string[];
  relatedIntegrations: string[];
  openQuestions: string[];
  constraints: string[];
  decisionRationale: string;
  lastUpdated: string;
  executionMode: string;
  replayedFrom: string;
  supersededOutputs: string[];
  recommendedRecoveryCommand: string;
  recommendedRecoveryWorkflow: string;
  interventionCount: number;
  lastInterventionAt: string;
  lastInterventionSummary: string;
  interventions: FeatureWorkflowInterventionEntry[];
  file: string;
}

export async function readFeatureWorkflowStates(targetRoot: string): Promise<FeatureWorkflowState[]> {
  const entries: FeatureWorkflowState[] = [];
  const workflowStates = await readFeatureWorkflowMarkdownStates(targetRoot);
  for (const workflowState of workflowStates) {
    const control = await readFeatureWorkflowControlDocument(targetRoot, workflowState.feature);
    const lastIntervention = control?.interventions.at(-1);
    entries.push({
      ...workflowState,
      executionMode: control?.executionMode ?? "workflow",
      replayedFrom: control?.replayedFrom ?? "",
      supersededOutputs: control?.supersededOutputs ?? [],
      recommendedRecoveryCommand: control?.recommendedRecoveryCommand ?? "",
      recommendedRecoveryWorkflow: control?.recommendedRecoveryWorkflow ?? "",
      interventionCount: control?.interventions.length ?? 0,
      lastInterventionAt: lastIntervention?.createdAt ?? "",
      lastInterventionSummary: lastIntervention?.summary ?? "",
      interventions: control?.interventions ?? []
    });
  }

  return entries.sort((left, right) => right.lastUpdated.localeCompare(left.lastUpdated));
}
