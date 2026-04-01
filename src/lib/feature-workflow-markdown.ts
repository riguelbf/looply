import path from "node:path";
import fs from "fs-extra";
import matter from "gray-matter";
import { globby } from "globby";
import { isContextPerfMode, setPerfMetadata, withPerfSpan } from "./perf/session.js";

export interface FeatureWorkflowMarkdownState {
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
  file: string;
}

export function resolveFeatureWorkflowStatusFile(targetRoot: string, feature: string): string {
  return path.join(targetRoot, ".looply", "custom", "features", feature, "workflow-status.md");
}

export async function readFeatureWorkflowMarkdownStates(targetRoot: string): Promise<FeatureWorkflowMarkdownState[]> {
  const files = await withPerfSpan("workflow-markdown.discover-files", async () => globby(".looply/custom/features/*/workflow-status.md", {
    cwd: targetRoot,
    absolute: true
  }));

  const entries = await withPerfSpan("workflow-markdown.read-files", async () => Promise.all(files.map((file) => readFeatureWorkflowMarkdownFile(file))), {
    fileCount: files.length
  });
  const sorted = entries.sort((left, right) => right.lastUpdated.localeCompare(left.lastUpdated));

  setPerfMetadata("workflow-markdown.fileCount", files.length);
  setPerfMetadata("workflow-markdown.featureCount", sorted.length);
  if (isContextPerfMode()) {
    setPerfMetadata(
      "workflow-markdown.estimatedChars",
      sorted.reduce((total, entry) => total + estimateWorkflowStateChars(entry), 0)
    );
  }

  return sorted;
}

export async function readFeatureWorkflowMarkdownState(
  targetRoot: string,
  feature: string
): Promise<FeatureWorkflowMarkdownState | null> {
  const file = resolveFeatureWorkflowStatusFile(targetRoot, feature);
  const exists = await withPerfSpan("workflow-markdown.check-file", async () => fs.pathExists(file), { feature });
  if (!exists) {
    return null;
  }

  const entry = await withPerfSpan("workflow-markdown.read-single-file", async () => readFeatureWorkflowMarkdownFile(file), { feature });
  if (isContextPerfMode()) {
    setPerfMetadata("workflow-markdown.singleFeatureChars", estimateWorkflowStateChars(entry));
  }
  return entry;
}

async function readFeatureWorkflowMarkdownFile(file: string): Promise<FeatureWorkflowMarkdownState> {
  const source = await fs.readFile(file, "utf8");
  const parsed = matter(source);
  const body = parsed.content;

  return {
    feature: extractSection(body, "Feature") || path.basename(path.dirname(file)),
    workflow: extractSection(body, "Workflow"),
    phase: extractSection(body, "Phase"),
    currentStage: extractSection(body, "Current Stage"),
    currentGate: extractSection(body, "Current Gate"),
    gateStatus: extractSection(body, "Gate Status"),
    activeArtifact: extractSection(body, "Active Artifact"),
    selectedStory: extractSection(body, "Selected Story"),
    readyForNextGate: extractSection(body, "Ready For Next Gate"),
    recommendedNextWorkflow: extractSection(body, "Recommended Next Workflow"),
    host: extractSection(body, "Host"),
    nextAgent: extractSection(body, "Next Agent"),
    nextTask: extractSection(body, "Next Task"),
    nextCommand: extractSection(body, "Next Command"),
    nextHandoff: extractSection(body, "Next Handoff"),
    projectMode: extractSection(body, "Project Mode"),
    primaryContextRoot: extractSection(body, "Primary Context Root"),
    inferencePolicy: extractSection(body, "Inference Policy"),
    contextStatus: extractSection(body, "Context Status"),
    contextCoverage: extractSection(body, "Context Coverage"),
    blockedBy: extractListSection(body, "Blocked By"),
    missingOutputs: extractListSection(body, "Missing Outputs"),
    completedOutputs: extractListSection(body, "Completed Outputs"),
    storyAcceptanceCriteria: extractListSection(body, "Story Acceptance Criteria"),
    relatedIntegrations: extractListSection(body, "Related Integrations"),
    openQuestions: extractListSection(body, "Open Questions"),
    constraints: extractListSection(body, "Constraints"),
    decisionRationale: extractSection(body, "Decision Rationale"),
    lastUpdated: extractSection(body, "Last Updated"),
    file
  };
}

function extractSection(body: string, title: string): string {
  const section = extractSectionRaw(body, title);
  if (!section) {
    return "";
  }

  return section
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .join(" ");
}

function extractSectionRaw(body: string, title: string): string {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = body.match(new RegExp(`(?:^|\\n)## ${escaped}\\n\\n([\\s\\S]*?)(?=\\n## |$)`));
  if (!match) {
    return "";
  }

  return match[1];
}

function extractListSection(body: string, title: string): string[] {
  const section = extractSectionRaw(body, title);
  if (!section) {
    return [];
  }

  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter((item) => item !== "");
}

function estimateWorkflowStateChars(state: FeatureWorkflowMarkdownState): number {
  const parts = [
    state.feature,
    state.workflow,
    state.phase,
    state.currentStage,
    state.currentGate,
    state.gateStatus,
    state.activeArtifact,
    state.selectedStory,
    state.readyForNextGate,
    state.recommendedNextWorkflow,
    state.host,
    state.nextAgent,
    state.nextTask,
    state.nextCommand,
    state.nextHandoff,
    state.projectMode,
    state.primaryContextRoot,
    state.inferencePolicy,
    state.contextStatus,
    state.contextCoverage,
    state.decisionRationale,
    state.lastUpdated,
    ...state.blockedBy,
    ...state.missingOutputs,
    ...state.completedOutputs,
    ...state.storyAcceptanceCriteria,
    ...state.relatedIntegrations,
    ...state.openQuestions,
    ...state.constraints
  ];

  return parts.reduce((total, part) => total + part.length, 0);
}
