import path from "node:path";
import fs from "fs-extra";
import {
  resolveArchitectureContextMarkdownFile,
  resolveContextIndexFile,
  resolveProjectInventoryMarkdownFile,
  resolveProjectContextMarkdownFile
} from "./context-documents.js";
import { deriveFeatureCodeImpact } from "./code-context/feature-impact.js";
import { type CodeContextDocument } from "./code-context/schema.js";
import { readCodeContext, resolveCodeContextFile } from "./code-context/storage.js";
import { readContextSnapshot, resolveContextSnapshotFile, type ContextSnapshotDocument } from "./context-snapshot.js";
import { readExecutionHintsDocument } from "./execution-hints.js";
import { readFeatureWorkflowStates, type FeatureWorkflowState } from "./feature-workflow-state.js";
import { readInteractionPolicyFile } from "./interaction-policy.js";
import { readLocaleFile } from "./locale.js";
import { readInstallManifestFromTarget } from "./manifest.js";
import { readProjectContextFile } from "./project-context.js";
import { readSessionLinks } from "./session-links.js";
import { readUpgradeHistoryFromTarget } from "./upgrade-history.js";

export interface ProjectSnapshotDocument {
  version: 3;
  generatedAt: string;
  targetRoot: string;
  summary: {
    installCount: number;
    featureCount: number;
    blockedFeatureCount: number;
    readyFeatureCount: number;
    interventionCount: number;
    replayedFeatureCount: number;
    sessionCount: number;
    historyCount: number;
  };
  project: {
    installed: boolean;
    locale: string;
    projectMode: string;
    interactionMode: string;
    primaryContextRoot: string;
    inferencePolicy: string;
  };
  installation: {
    installs: Array<{
      host: string;
      scope: string;
      pack: string;
      managedFiles: number;
      mergeableFiles: number;
      customFiles: number;
    }>;
  };
  hosts: Array<{
    host: string;
    scope: string;
    pack: string;
    workflowCount: number;
    aliases: string[];
  }>;
  context: {
    snapshotFile: string;
    indexFile: string;
    projectContextFile: string;
    architectureContextFile: string;
    projectInventoryFile: string;
    snapshot: ContextSnapshotDocument | null;
  };
  codeContext: {
    file: string;
    snapshot: CodeContextDocument | null;
  };
  sessions: Array<{
    label: string;
    feature: string;
    workflow?: string;
    lastCommand?: string;
    lastUpdatedAt?: string;
  }>;
  features: FeatureWorkflowState[];
  history: Array<{
    timestamp: string;
    action: string;
    host: string;
    scope: string;
    pack: string;
    impacts: string[];
    artifactChanges: string[];
  }>;
}

export function resolveProjectSnapshotFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "project-snapshot.json");
}

export async function buildProjectSnapshot(targetRoot: string): Promise<ProjectSnapshotDocument> {
  const [manifest, locale, projectContext, interactionPolicy, sessions, history, features, contextSnapshot, codeContext] = await Promise.all([
    readInstallManifestFromTarget(targetRoot),
    readLocaleFile(targetRoot),
    readProjectContextFile(targetRoot),
    readInteractionPolicyFile(targetRoot),
    readSessionLinks(targetRoot),
    readUpgradeHistoryFromTarget(targetRoot),
    readFeatureWorkflowStates(targetRoot),
    readContextSnapshot(targetRoot),
    readCodeContext(targetRoot)
  ]);
  const executionHintsByHost = manifest
    ? await Promise.all(
        manifest.installs.map(async (entry) => ({
          host: entry.host,
          scope: entry.scope,
          pack: entry.pack,
          hints: await readExecutionHintsDocument(targetRoot, entry.host)
        }))
      )
    : [];

  return {
    version: 3,
    generatedAt: new Date().toISOString(),
    targetRoot,
    summary: {
      installCount: manifest?.installs.length ?? 0,
      featureCount: features.length,
      blockedFeatureCount: features.filter((feature) => feature.blockedBy.length > 0).length,
      readyFeatureCount: features.filter((feature) => feature.readyForNextGate.toLowerCase() === "yes").length,
      interventionCount: features.reduce((count, feature) => count + feature.interventionCount, 0),
      replayedFeatureCount: features.filter((feature) => feature.replayedFrom !== "").length,
      sessionCount: sessions.sessions.length,
      historyCount: history.entries.length
    },
    project: {
      installed: Boolean(manifest),
      locale: locale?.outputLocale ?? contextSnapshot?.outputLocale ?? "unknown",
      projectMode: projectContext?.mode ?? contextSnapshot?.projectMode ?? "unknown",
      interactionMode: interactionPolicy?.mode ?? contextSnapshot?.interactionMode ?? "unknown",
      primaryContextRoot: projectContext?.primaryContextRoot ?? contextSnapshot?.primaryContextRoot ?? targetRoot,
      inferencePolicy: projectContext?.inferencePolicy ?? contextSnapshot?.inferencePolicy ?? "unknown"
    },
    installation: {
      installs: (manifest?.installs ?? []).map((entry) => ({
        host: entry.host,
        scope: entry.scope,
        pack: entry.pack,
        managedFiles: entry.managedFiles.length,
        mergeableFiles: entry.mergeableFiles.length,
        customFiles: entry.customFiles.length
      }))
    },
    hosts: executionHintsByHost.map((entry) => ({
      host: entry.host,
      scope: entry.scope,
      pack: entry.pack,
      workflowCount: entry.hints?.artifacts.filter((artifact) => artifact.type === "workflow").length ?? 0,
      aliases: (entry.hints?.artifacts ?? [])
        .filter((artifact) => artifact.type === "workflow" && artifact.command?.alias)
        .map((artifact) => String(artifact.command?.alias ?? ""))
        .filter((alias) => alias !== "")
    })),
    context: {
      snapshotFile: resolveContextSnapshotFile(targetRoot),
      indexFile: resolveContextIndexFile(targetRoot),
      projectContextFile: resolveProjectContextMarkdownFile(targetRoot),
      architectureContextFile: resolveArchitectureContextMarkdownFile(targetRoot),
      projectInventoryFile: resolveProjectInventoryMarkdownFile(targetRoot),
      snapshot: contextSnapshot
    },
    codeContext: {
      file: resolveCodeContextFile(targetRoot),
      snapshot: codeContext
    },
    sessions: sessions.sessions,
    features: features.map((feature) => ({
      ...feature,
      ...deriveFeatureCodeImpact(feature, codeContext)
    })),
    history: history.entries.map((entry) => ({
      timestamp: entry.timestamp,
      action: entry.action,
      host: entry.host,
      scope: entry.scope,
      pack: entry.pack,
      impacts: entry.summary.impacts,
      artifactChanges: entry.summary.artifactChanges
    }))
  };
}

export async function writeProjectSnapshot(targetRoot: string): Promise<string> {
  const file = resolveProjectSnapshotFile(targetRoot);
  const snapshot = await buildProjectSnapshot(targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.writeJson(file, snapshot, { spaces: 2 });
  return file;
}
