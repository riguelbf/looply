import path from "node:path";
import fs from "fs-extra";
import type { UpgradeHistoryDocument, UpgradeHistoryEntry } from "./publishing-model.js";

export async function appendUpgradeHistory(input: {
  targetRoot: string;
  entry: UpgradeHistoryEntry;
}): Promise<string> {
  const historyFile = path.join(input.targetRoot, ".looply", "state", "upgrade-history.json");
  const current = await readUpgradeHistory(historyFile);
  const next: UpgradeHistoryDocument = {
    version: 1,
    entries: [input.entry, ...current.entries].slice(0, 100)
  };

  await fs.ensureDir(path.dirname(historyFile));
  await fs.writeJson(historyFile, next, { spaces: 2 });
  return historyFile;
}

export function resolveUpgradeHistoryFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "upgrade-history.json");
}

export async function readUpgradeHistoryFromTarget(targetRoot: string): Promise<UpgradeHistoryDocument> {
  return readUpgradeHistory(resolveUpgradeHistoryFile(targetRoot));
}

async function readUpgradeHistory(historyFile: string): Promise<UpgradeHistoryDocument> {
  if (!(await fs.pathExists(historyFile))) {
    return {
      version: 1,
      entries: []
    };
  }

  const raw = await fs.readJson(historyFile);
  if (typeof raw !== "object" || raw === null || !Array.isArray((raw as { entries?: unknown }).entries)) {
    return {
      version: 1,
      entries: []
    };
  }

  const record = raw as { version?: unknown; entries: unknown[] };
  return {
    version: typeof record.version === "number" ? record.version : 1,
    entries: record.entries
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        timestamp: String(item.timestamp ?? ""),
        action: normalizeAction(item.action),
        host: String(item.host ?? ""),
        scope: normalizeScope(item.scope),
        pack: String(item.pack ?? ""),
        targetRoot: String(item.targetRoot ?? ""),
        summary: {
          addedFiles: toStringArray(item.summary, "addedFiles"),
          changedFiles: toStringArray(item.summary, "changedFiles"),
          removedFiles: toStringArray(item.summary, "removedFiles"),
          impacts: toStringArray(item.summary, "impacts"),
          artifactChanges: toStringArray(item.summary, "artifactChanges")
        }
      }))
      .filter((entry) => entry.timestamp !== "" && entry.host !== "" && entry.pack !== "")
  };
}

function normalizeAction(value: unknown): "sync" | "upgrade" {
  return value === "sync" ? "sync" : "upgrade";
}

function normalizeScope(value: unknown): "project" | "global" {
  return value === "global" ? "global" : "project";
}

function toStringArray(value: unknown, key: string): string[] {
  if (typeof value !== "object" || value === null) {
    return [];
  }

  const candidate = (value as Record<string, unknown>)[key];
  if (!Array.isArray(candidate)) {
    return [];
  }

  return candidate.map((item) => String(item)).filter((item) => item !== "");
}
