import {
  readFeatureWorkflowMarkdownStates,
  type FeatureWorkflowMarkdownState
} from "./feature-workflow-markdown.js";
import {
  readFeatureWorkflowControlDocument,
  type FeatureWorkflowInterventionEntry
} from "./workflow-interventions.js";
import { isContextPerfMode, setPerfMetadata, withPerfSpan } from "./perf/session.js";

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
  relevantFiles: string[];
  relevantModules: string[];
  relevantSymbols: string[];
  relatedTests: string[];
  file: string;
}

export async function readFeatureWorkflowStates(targetRoot: string): Promise<FeatureWorkflowState[]> {
  const entries: FeatureWorkflowState[] = [];
  const workflowStates = await withPerfSpan("feature-workflow-state.read-markdown-states", async () => readFeatureWorkflowMarkdownStates(targetRoot));
  for (const workflowState of workflowStates) {
    const control = await withPerfSpan("feature-workflow-state.read-control-document", async () => readFeatureWorkflowControlDocument(targetRoot, workflowState.feature), {
      feature: workflowState.feature
    });
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
      ,
      relevantFiles: [],
      relevantModules: [],
      relevantSymbols: [],
      relatedTests: []
    });
  }

  const sorted = entries.sort((left, right) => right.lastUpdated.localeCompare(left.lastUpdated));
  setPerfMetadata("feature-workflow-state.featureCount", sorted.length);
  setPerfMetadata(
    "feature-workflow-state.interventionCount",
    sorted.reduce((count, feature) => count + feature.interventionCount, 0)
  );
  if (isContextPerfMode()) {
    setPerfMetadata(
      "feature-workflow-state.blockedFeatureCount",
      sorted.filter((feature) => feature.blockedBy.length > 0).length
    );
    setPerfMetadata(
      "feature-workflow-state.estimatedContextChars",
      sorted.reduce((total, feature) => {
        return total + [
          feature.feature,
          feature.workflow,
          feature.currentStage,
          feature.currentGate,
          feature.activeArtifact,
          feature.nextAgent,
          feature.nextTask,
          feature.nextHandoff,
          feature.nextCommand,
          feature.decisionRationale,
          ...feature.blockedBy,
          ...feature.missingOutputs,
          ...feature.completedOutputs,
          ...feature.storyAcceptanceCriteria,
          ...feature.relatedIntegrations,
          ...feature.openQuestions,
          ...feature.constraints
        ].reduce((count, value) => count + value.length, 0);
      }, 0)
    );
  }

  return sorted;
}
