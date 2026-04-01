import path from "node:path";
import fs from "fs-extra";

export interface PerfWorkflowTraceEvent {
  version: 1;
  event: "start" | "checkpoint" | "finish";
  timestamp: string;
  targetRoot: string;
  source: string;
  host?: string;
  feature?: string;
  workflow?: string;
  alias?: string;
  stage?: string;
  task?: string;
  artifact?: string;
  status?: string;
  notes?: string;
}

interface PerfWorkflowActiveTrace {
  feature?: string;
  workflow?: string;
  alias?: string;
  host?: string;
  source?: string;
  startedAt: string;
  updatedAt: string;
}

export function resolvePerfWorkflowTraceFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "perf-workflow-events.jsonl");
}

export function resolvePerfWorkflowActiveFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "perf-workflow-active.json");
}

export async function appendPerfWorkflowTraceEvent(targetRoot: string, event: PerfWorkflowTraceEvent): Promise<string> {
  const file = resolvePerfWorkflowTraceFile(targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.appendFile(file, `${JSON.stringify(event)}\n`, "utf8");
  return file;
}

export async function startPerfWorkflowTrace(input: {
  targetRoot: string;
  source: string;
  host?: string;
  feature?: string;
  workflow?: string;
  alias?: string;
  stage?: string;
  task?: string;
  artifact?: string;
  notes?: string;
}): Promise<{ eventFile: string; activeFile: string }> {
  const timestamp = new Date().toISOString();
  const eventFile = await appendPerfWorkflowTraceEvent(input.targetRoot, {
    version: 1,
    event: "start",
    timestamp,
    targetRoot: input.targetRoot,
    source: input.source,
    host: input.host,
    feature: input.feature,
    workflow: input.workflow,
    alias: input.alias,
    stage: input.stage,
    task: input.task,
    artifact: input.artifact,
    notes: input.notes
  });

  const activeFile = resolvePerfWorkflowActiveFile(input.targetRoot);
  await fs.ensureDir(path.dirname(activeFile));
  await fs.writeJson(activeFile, {
    feature: input.feature,
    workflow: input.workflow,
    alias: input.alias,
    host: input.host,
    source: input.source,
    startedAt: timestamp,
    updatedAt: timestamp
  } satisfies PerfWorkflowActiveTrace, { spaces: 2 });

  return { eventFile, activeFile };
}

export async function checkpointPerfWorkflowTrace(input: {
  targetRoot: string;
  source: string;
  host?: string;
  feature?: string;
  workflow?: string;
  alias?: string;
  stage?: string;
  task?: string;
  artifact?: string;
  status?: string;
  notes?: string;
}): Promise<{ eventFile: string; activeFile: string | null }> {
  const active = await readPerfWorkflowActiveTrace(input.targetRoot);
  const timestamp = new Date().toISOString();
  const eventFile = await appendPerfWorkflowTraceEvent(input.targetRoot, {
    version: 1,
    event: "checkpoint",
    timestamp,
    targetRoot: input.targetRoot,
    source: input.source || active?.source || "manual",
    host: input.host || active?.host,
    feature: input.feature || active?.feature,
    workflow: input.workflow || active?.workflow,
    alias: input.alias || active?.alias,
    stage: input.stage,
    task: input.task,
    artifact: input.artifact,
    status: input.status,
    notes: input.notes
  });

  const activeFile = resolvePerfWorkflowActiveFile(input.targetRoot);
  if (active) {
    await fs.writeJson(activeFile, {
      ...active,
      feature: input.feature || active.feature,
      workflow: input.workflow || active.workflow,
      alias: input.alias || active.alias,
      host: input.host || active.host,
      source: input.source || active.source,
      updatedAt: timestamp
    } satisfies PerfWorkflowActiveTrace, { spaces: 2 });
    return { eventFile, activeFile };
  }

  return { eventFile, activeFile: null };
}

export async function finishPerfWorkflowTrace(input: {
  targetRoot: string;
  source: string;
  host?: string;
  feature?: string;
  workflow?: string;
  alias?: string;
  stage?: string;
  task?: string;
  artifact?: string;
  status?: string;
  notes?: string;
}): Promise<{ eventFile: string; activeFile: string | null }> {
  const active = await readPerfWorkflowActiveTrace(input.targetRoot);
  const eventFile = await appendPerfWorkflowTraceEvent(input.targetRoot, {
    version: 1,
    event: "finish",
    timestamp: new Date().toISOString(),
    targetRoot: input.targetRoot,
    source: input.source || active?.source || "manual",
    host: input.host || active?.host,
    feature: input.feature || active?.feature,
    workflow: input.workflow || active?.workflow,
    alias: input.alias || active?.alias,
    stage: input.stage,
    task: input.task,
    artifact: input.artifact,
    status: input.status,
    notes: input.notes
  });

  const activeFile = resolvePerfWorkflowActiveFile(input.targetRoot);
  if (await fs.pathExists(activeFile)) {
    await fs.remove(activeFile);
    return { eventFile, activeFile };
  }

  return { eventFile, activeFile: null };
}

export async function readPerfWorkflowTraceEvents(targetRoot: string): Promise<PerfWorkflowTraceEvent[]> {
  const file = resolvePerfWorkflowTraceFile(targetRoot);
  if (!(await fs.pathExists(file))) {
    return [];
  }

  const source = await fs.readFile(file, "utf8");
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as PerfWorkflowTraceEvent];
      } catch {
        return [];
      }
    });
}

async function readPerfWorkflowActiveTrace(targetRoot: string): Promise<PerfWorkflowActiveTrace | null> {
  const file = resolvePerfWorkflowActiveFile(targetRoot);
  if (!(await fs.pathExists(file))) {
    return null;
  }

  return fs.readJson(file) as Promise<PerfWorkflowActiveTrace>;
}

