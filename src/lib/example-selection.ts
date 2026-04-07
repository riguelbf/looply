import path from "node:path";
import type { CatalogArtifact } from "./artifact-catalog.js";
import type { ExampleFrontmatter, TaskFrontmatter, WorkflowFrontmatter } from "./artifact-schema.js";
import type { ExamplePolicyMode } from "./example-policy.js";
import type { InteractionMode, OutputLocale, ProjectMode, SupportedHost } from "./host-publisher.js";

export interface SelectedExample {
  name: string;
  pack: string;
  file: string;
  summary?: string;
  kind: ExampleFrontmatter["kind"];
  quality: ExampleFrontmatter["quality"];
  score: number;
  reasons: string[];
}

export interface ExampleSelectionResult {
  mode: ExamplePolicyMode;
  selected: SelectedExample[];
  availableCount: number;
}

export function selectExamplesForWorkflow(input: {
  artifacts: CatalogArtifact[];
  pack: string;
  packClosure?: string[];
  workflowName: string;
  host: SupportedHost;
  outputLocale: OutputLocale;
  projectMode: ProjectMode;
  interactionMode: InteractionMode;
  mode: ExamplePolicyMode;
}): ExampleSelectionResult {
  const allowedPacks = new Set(input.packClosure ?? [input.pack]);
  const workflowArtifact = input.artifacts.find(
    (artifact) => artifact.type === "workflow" && artifact.name === input.workflowName && allowedPacks.has(artifact.pack)
  );

  if (!workflowArtifact) {
    return {
      mode: input.mode,
      selected: [],
      availableCount: 0
    };
  }

  const workflowFrontmatter = workflowArtifact.frontmatter as WorkflowFrontmatter;
  const taskNames = Array.from(new Set([
    ...(Array.isArray(workflowFrontmatter.tasks) ? workflowFrontmatter.tasks : []),
    ...workflowFrontmatter.stages.map((stage) => stage.task)
  ]));
  const agentNames = Array.from(new Set([
    ...workflowFrontmatter.stages.map((stage) => stage.agent),
    workflowFrontmatter.orchestrator ?? ""
  ].filter((value) => value !== "")));
  const handoffNames = Array.from(new Set(workflowFrontmatter.handoffs.map((handoff) => `${handoff.from}->${handoff.to}:${handoff.artifact}`)));
  const templateNames = Array.from(new Set(
    input.artifacts
      .filter((artifact) => artifact.type === "task" && allowedPacks.has(artifact.pack) && taskNames.includes(artifact.name))
      .flatMap((artifact) => (artifact.frontmatter as TaskFrontmatter).templates)
  ));

  const examples = input.artifacts
    .filter((artifact) => artifact.type === "example" && allowedPacks.has(artifact.pack))
    .map((artifact) => rankExample({
      artifact,
      workflowName: input.workflowName,
      taskNames,
      templateNames,
      agentNames,
      handoffNames,
      host: input.host,
      outputLocale: input.outputLocale,
      projectMode: input.projectMode,
      interactionMode: input.interactionMode
    }))
    .filter((entry): entry is RankedExample => entry !== null)
    .sort((left, right) =>
      right.score - left.score ||
      qualityRank(right.quality) - qualityRank(left.quality) ||
      left.name.localeCompare(right.name)
    );

  return {
    mode: input.mode,
    selected: pickExamplesForMode(examples, input.mode),
    availableCount: examples.length
  };
}

interface RankedExample extends SelectedExample {}

function rankExample(input: {
  artifact: CatalogArtifact;
  workflowName: string;
  taskNames: string[];
  templateNames: string[];
  agentNames: string[];
  handoffNames: string[];
  host: SupportedHost;
  outputLocale: OutputLocale;
  projectMode: ProjectMode;
  interactionMode: InteractionMode;
}): RankedExample | null {
  const frontmatter = input.artifact.frontmatter as ExampleFrontmatter;
  if (frontmatter.host_support.length > 0 && !frontmatter.host_support.includes(input.host)) {
    return null;
  }
  if (frontmatter.project_modes.length > 0 && !frontmatter.project_modes.includes(input.projectMode)) {
    return null;
  }
  if (frontmatter.interaction_modes.length > 0 && !frontmatter.interaction_modes.includes(input.interactionMode)) {
    return null;
  }
  if (frontmatter.locale && frontmatter.locale !== input.outputLocale) {
    return null;
  }

  let score = 0;
  const reasons: string[] = [];

  if (frontmatter.applies_to.workflows.includes(input.workflowName)) {
    score += 80;
    reasons.push(`workflow:${input.workflowName}`);
  }

  const matchedTasks = intersect(frontmatter.applies_to.tasks, input.taskNames);
  if (matchedTasks.length > 0) {
    score += Math.min(80, matchedTasks.length * 40);
    reasons.push(`tasks:${matchedTasks.join(",")}`);
  }

  const matchedTemplates = intersect(frontmatter.applies_to.templates, input.templateNames);
  if (matchedTemplates.length > 0) {
    score += Math.min(60, matchedTemplates.length * 30);
    reasons.push(`templates:${matchedTemplates.join(",")}`);
  }

  const matchedAgents = intersect(frontmatter.applies_to.agents, input.agentNames);
  if (matchedAgents.length > 0) {
    score += Math.min(40, matchedAgents.length * 20);
    reasons.push(`agents:${matchedAgents.join(",")}`);
  }

  const matchedHandoffs = intersect(frontmatter.applies_to.handoffs, input.handoffNames);
  if (matchedHandoffs.length > 0) {
    score += Math.min(30, matchedHandoffs.length * 15);
    reasons.push(`handoffs:${matchedHandoffs.join(",")}`);
  }

  if (score === 0) {
    return null;
  }

  score += qualityRank(frontmatter.quality) * 5;
  if (frontmatter.locale === input.outputLocale) {
    score += 5;
  }
  if (frontmatter.host_support.includes(input.host)) {
    score += 5;
  }

  return {
    name: input.artifact.name,
    pack: input.artifact.pack,
    file: input.artifact.file.replaceAll(path.sep, "/"),
    summary: input.artifact.summary,
    kind: frontmatter.kind,
    quality: frontmatter.quality,
    score,
    reasons
  };
}

function pickExamplesForMode(examples: RankedExample[], mode: ExamplePolicyMode): SelectedExample[] {
  if (mode === "off") {
    return [];
  }

  const limit = mode === "reduced" ? 1 : 2;
  const selected: RankedExample[] = [];
  const usedKinds = new Set<string>();

  for (const example of examples) {
    if (selected.length >= limit) {
      break;
    }

    if (!usedKinds.has(example.kind) || selected.length + 1 === limit) {
      selected.push(example);
      usedKinds.add(example.kind);
    }
  }

  return selected;
}

function intersect(left: string[], right: string[]): string[] {
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value));
}

function qualityRank(value: ExampleFrontmatter["quality"]): number {
  switch (value) {
    case "strong":
      return 3;
    case "reference":
      return 2;
    case "edge-case":
      return 1;
  }
}
