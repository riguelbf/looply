import type { CatalogArtifact } from "./artifact-catalog.js";
import path from "node:path";
import fs from "fs-extra";

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

export function resolveExecutionHintsFile(targetRoot: string, host: string): string {
  return path.join(targetRoot, ".looply", "state", `execution-hints.${host}.json`);
}

export function buildExecutionHintsDocument(input: {
  host: string;
  pack: string;
  artifacts: CatalogArtifact[];
  packClosure?: string[];
}): ExecutionHintsDocument {
  const allowedPacks = new Set(input.packClosure ?? [input.pack]);
  const artifacts = input.artifacts
    .filter((artifact) => allowedPacks.has(artifact.pack))
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

export async function readExecutionHintsDocument(targetRoot: string, host: string): Promise<ExecutionHintsDocument | null> {
  const file = resolveExecutionHintsFile(targetRoot, host);
  if (!(await fs.pathExists(file))) {
    return null;
  }

  const raw = await fs.readJson(file);
  if (typeof raw !== "object" || raw === null || !Array.isArray((raw as { artifacts?: unknown }).artifacts)) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  return {
    version: 1,
    host: typeof record.host === "string" ? record.host : host,
    pack: typeof record.pack === "string" ? record.pack : "",
    note: typeof record.note === "string" ? record.note : "",
    artifacts: (record.artifacts as unknown[])
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        type: String(item.type ?? ""),
        name: String(item.name ?? ""),
        summary: typeof item.summary === "string" ? item.summary : undefined,
        execution: typeof item.execution === "object" && item.execution !== null
          ? item.execution as Record<string, unknown>
          : {},
        command: typeof item.command === "object" && item.command !== null
          ? {
              alias: String((item.command as Record<string, unknown>).alias ?? ""),
              argument_hint: String((item.command as Record<string, unknown>).argument_hint ?? "")
            }
          : undefined,
        workflow: typeof item.workflow === "object" && item.workflow !== null
          ? {
              phase: typeof (item.workflow as Record<string, unknown>).phase === "string"
                ? String((item.workflow as Record<string, unknown>).phase)
                : undefined,
              orchestrator: typeof (item.workflow as Record<string, unknown>).orchestrator === "string"
                ? String((item.workflow as Record<string, unknown>).orchestrator)
                : undefined,
              stage_count: Number((item.workflow as Record<string, unknown>).stage_count ?? 0),
              gate_count: Number((item.workflow as Record<string, unknown>).gate_count ?? 0),
              handoff_count: Number((item.workflow as Record<string, unknown>).handoff_count ?? 0),
              stage_names: Array.isArray((item.workflow as Record<string, unknown>).stage_names)
                ? ((item.workflow as Record<string, unknown>).stage_names as unknown[]).map((value) => String(value))
                : []
            }
          : undefined
      }))
      .filter((item) => item.type !== "" && item.name !== "")
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
