import type { CatalogArtifact } from "./artifact-catalog.js";

interface ExecutionHintsArtifactEntry {
  type: string;
  name: string;
  summary?: string;
  execution: Record<string, unknown>;
  command?: {
    alias: string;
    argument_hint: string;
  };
  workflow?: {
    phase?: string;
    orchestrator?: string;
    stage_count: number;
    gate_count: number;
    handoff_count: number;
    stage_names: string[];
  };
}

export interface ExecutionHintsDocument {
  version: 1;
  host: string;
  pack: string;
  note: string;
  artifacts: ExecutionHintsArtifactEntry[];
}

export function buildExecutionHintsDocument(input: {
  host: string;
  pack: string;
  artifacts: CatalogArtifact[];
}): ExecutionHintsDocument {
  const artifacts = input.artifacts
    .filter((artifact) => artifact.pack === input.pack)
    .filter((artifact) => artifact.type === "agent" || artifact.type === "task" || artifact.type === "workflow")
    .map((artifact) => ({
      type: artifact.type,
      name: artifact.name,
      summary: artifact.summary,
      execution: typeof artifact.frontmatter.execution === "object" && artifact.frontmatter.execution !== null
        ? (artifact.frontmatter.execution as Record<string, unknown>)
        : {},
      command: artifact.type === "workflow" ? toWorkflowCommandHint(artifact.frontmatter.command) : undefined,
      workflow: artifact.type === "workflow" ? toWorkflowHints(artifact.frontmatter) : undefined
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    version: 1,
    host: input.host,
    pack: input.pack,
    note: "Execution hints are advisory metadata for host-side model selection.",
    artifacts
  };
}

function toWorkflowCommandHint(value: unknown) {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name : "";
  if (!name) {
    return undefined;
  }

  return {
    alias: `looply:${name}`,
    argument_hint: typeof record.argument_hint === "string" ? record.argument_hint : ""
  };
}

function toWorkflowHints(frontmatter: Record<string, unknown>) {
  const stages = toRecordArray(frontmatter.stages);
  const gates = toRecordArray(frontmatter.gates);
  const handoffs = toRecordArray(frontmatter.handoffs);

  return {
    phase: typeof frontmatter.phase === "string" ? frontmatter.phase : undefined,
    orchestrator: typeof frontmatter.orchestrator === "string" ? frontmatter.orchestrator : undefined,
    stage_count: stages.length,
    gate_count: gates.length,
    handoff_count: handoffs.length,
    stage_names: stages.map((stage) => String(stage.name ?? "")).filter((name) => name !== "")
  };
}

function toRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
}
