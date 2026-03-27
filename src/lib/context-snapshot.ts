import path from "node:path";
import fs from "fs-extra";
import type { ProjectContextRefreshData } from "./context-documents.js";
import type { InteractionMode, OutputLocale, ProjectMode } from "./host-publisher.js";
import type { InferencePolicy } from "./project-context.js";

export interface ContextSnapshotDocument {
  version: 1;
  generatedAt: string;
  targetRoot: string;
  primaryContextRoot: string;
  projectMode: ProjectMode;
  outputLocale: OutputLocale;
  interactionMode: InteractionMode;
  inferencePolicy: InferencePolicy;
  contextStatus: ProjectContextRefreshData["status"];
  contextCoverage: ProjectContextRefreshData["coverage"];
  lastValidatedAt: string;
  repositorySummary: string[];
  languages: string[];
  frameworks: string[];
  keyDirectories: string[];
  moduleHints: string[];
  integrationHints: string[];
  apiSignals: string[];
  dataSignals: string[];
  authSignals: string[];
  messagingSignals: string[];
  observabilitySignals: string[];
  workspaceHints: string[];
  testingSignals: string[];
  infrastructureSignals: string[];
  automationSignals: string[];
  architectureNotes: string[];
  domainNotes: string[];
  riskNotes: string[];
}

export function resolveContextSnapshotFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "context-snapshot.json");
}

export async function writeContextSnapshot(input: {
  targetRoot: string;
  primaryContextRoot: string;
  projectMode: ProjectMode;
  outputLocale: OutputLocale;
  interactionMode: InteractionMode;
  inferencePolicy: InferencePolicy;
  data: ProjectContextRefreshData;
}): Promise<string> {
  const file = resolveContextSnapshotFile(input.targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.writeJson(file, {
    version: 1,
    generatedAt: new Date().toISOString(),
    targetRoot: input.targetRoot,
    primaryContextRoot: input.primaryContextRoot,
    projectMode: input.projectMode,
    outputLocale: input.outputLocale,
    interactionMode: input.interactionMode,
    inferencePolicy: input.inferencePolicy,
    contextStatus: input.data.status,
    contextCoverage: input.data.coverage,
    lastValidatedAt: input.data.lastValidatedAt,
    repositorySummary: input.data.repositorySummary,
    languages: input.data.languages,
    frameworks: input.data.frameworks,
    keyDirectories: input.data.keyDirectories,
    moduleHints: input.data.moduleHints,
    integrationHints: input.data.integrationHints,
    apiSignals: input.data.apiSignals,
    dataSignals: input.data.dataSignals,
    authSignals: input.data.authSignals,
    messagingSignals: input.data.messagingSignals,
    observabilitySignals: input.data.observabilitySignals,
    workspaceHints: input.data.workspaceHints,
    testingSignals: input.data.testingSignals,
    infrastructureSignals: input.data.infrastructureSignals,
    automationSignals: input.data.automationSignals,
    architectureNotes: input.data.architectureNotes,
    domainNotes: input.data.domainNotes,
    riskNotes: input.data.riskNotes
  } satisfies ContextSnapshotDocument, { spaces: 2 });
  return file;
}

export async function readContextSnapshot(targetRoot: string): Promise<ContextSnapshotDocument | null> {
  const file = resolveContextSnapshotFile(targetRoot);
  if (!(await fs.pathExists(file))) {
    return null;
  }

  const raw = await fs.readJson(file);
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  return {
    version: 1,
    generatedAt: typeof record.generatedAt === "string" ? record.generatedAt : "",
    targetRoot: typeof record.targetRoot === "string" ? record.targetRoot : targetRoot,
    primaryContextRoot: typeof record.primaryContextRoot === "string" ? record.primaryContextRoot : targetRoot,
    projectMode: record.projectMode === "greenfield" ? "greenfield" : "existing-project",
    outputLocale: record.outputLocale === "pt-BR" ? "pt-BR" : "en",
    interactionMode: record.interactionMode === "guided"
      ? "guided"
      : record.interactionMode === "autonomous"
        ? "autonomous"
        : "balanced",
    inferencePolicy: record.inferencePolicy === "artifact-first-with-explicit-assumptions"
      ? "artifact-first-with-explicit-assumptions"
      : "codebase-first-with-artifact-acceleration",
    contextStatus: normalizeContextStatus(record.contextStatus),
    contextCoverage: normalizeContextCoverage(record.contextCoverage),
    lastValidatedAt: typeof record.lastValidatedAt === "string" ? record.lastValidatedAt : "",
    repositorySummary: toStringArray(record.repositorySummary),
    languages: toStringArray(record.languages),
    frameworks: toStringArray(record.frameworks),
    keyDirectories: toStringArray(record.keyDirectories),
    moduleHints: toStringArray(record.moduleHints),
    integrationHints: toStringArray(record.integrationHints),
    apiSignals: toStringArray(record.apiSignals),
    dataSignals: toStringArray(record.dataSignals),
    authSignals: toStringArray(record.authSignals),
    messagingSignals: toStringArray(record.messagingSignals),
    observabilitySignals: toStringArray(record.observabilitySignals),
    workspaceHints: toStringArray(record.workspaceHints),
    testingSignals: toStringArray(record.testingSignals),
    infrastructureSignals: toStringArray(record.infrastructureSignals),
    automationSignals: toStringArray(record.automationSignals),
    architectureNotes: toStringArray(record.architectureNotes),
    domainNotes: toStringArray(record.domainNotes),
    riskNotes: toStringArray(record.riskNotes)
  };
}

function normalizeContextStatus(value: unknown): ProjectContextRefreshData["status"] {
  return value === "empty" || value === "draft" || value === "stale" || value === "active" ? value : "draft";
}

function normalizeContextCoverage(value: unknown): ProjectContextRefreshData["coverage"] {
  return value === "low" || value === "medium" || value === "high" ? value : "low";
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item)).filter((item) => item !== "");
}
