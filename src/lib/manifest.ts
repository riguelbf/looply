import path from "node:path";
import fs from "fs-extra";
import type { InstallManifest } from "./publishing-model.js";

export function resolveInstallManifestFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "install-manifest.json");
}

export async function readInstallManifestFromTarget(targetRoot: string): Promise<InstallManifest | null> {
  const manifestFile = resolveInstallManifestFile(targetRoot);
  if (!(await fs.pathExists(manifestFile))) {
    return null;
  }

  return normalizeInstallManifest(await fs.readJson(manifestFile));
}

export function createInstallManifest(input: {
  pack: string;
  scope: "project" | "global";
  host: string;
  managedFiles: string[];
  mergeableFiles: string[];
  customFiles?: string[];
}): InstallManifest {
  return {
    version: 1,
    installs: [
      {
        host: input.host,
        pack: input.pack,
        scope: input.scope,
        managedFiles: input.managedFiles,
        mergeableFiles: input.mergeableFiles,
        customFiles: input.customFiles ?? []
      }
    ]
  };
}

export function upsertInstallManifest(
  currentManifest: InstallManifest | null,
  input: {
    pack: string;
    scope: "project" | "global";
    host: string;
    managedFiles: string[];
    mergeableFiles: string[];
    customFiles?: string[];
  }
): InstallManifest {
  const nextEntry = {
    host: input.host,
    pack: input.pack,
    scope: input.scope,
    managedFiles: input.managedFiles,
    mergeableFiles: input.mergeableFiles,
    customFiles: input.customFiles ?? []
  };

  if (!currentManifest) {
    return {
      version: 1,
      installs: [nextEntry]
    };
  }

  const installs = currentManifest.installs.filter((entry) => !(entry.host === input.host && entry.scope === input.scope));
  installs.push(nextEntry);

  return {
    version: currentManifest.version,
    installs
  };
}

export function normalizeInstallManifest(value: unknown): InstallManifest | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (Array.isArray(record.installs)) {
    return {
      version: typeof record.version === "number" ? record.version : 1,
      installs: record.installs
        .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item) => ({
          host: String(item.host ?? ""),
          pack: String(item.pack ?? ""),
          scope: normalizeScope(item.scope),
          managedFiles: toStringArray(item.managedFiles),
          mergeableFiles: toStringArray(item.mergeableFiles),
          customFiles: toStringArray(item.customFiles)
        }))
        .filter((item) => item.host !== "" && item.pack !== "")
    };
  }

  if (typeof record.host === "string" && typeof record.pack === "string") {
    return {
      version: typeof record.version === "number" ? record.version : 1,
      installs: [
        {
          host: record.host,
          pack: record.pack,
          scope: normalizeScope(record.scope),
          managedFiles: toStringArray(record.managedFiles),
          mergeableFiles: toStringArray(record.mergeableFiles),
          customFiles: toStringArray(record.customFiles)
        }
      ]
    };
  }

  return null;
}

export function removeInstallManifestEntry(
  currentManifest: InstallManifest,
  input: { host: string; scope: "project" | "global" }
): InstallManifest {
  return {
    version: currentManifest.version,
    installs: currentManifest.installs.filter((entry) => !(entry.host === input.host && entry.scope === input.scope))
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item))
    .filter((item) => item !== "");
}

function normalizeScope(value: unknown): "project" | "global" {
  return value === "global" ? "global" : "project";
}
