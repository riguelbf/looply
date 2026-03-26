export type FileOwnership = "managed" | "mergeable" | "custom";

export interface InstallManifestEntry {
  host: string;
  pack: string;
  scope: "project" | "global";
  managedFiles: string[];
  mergeableFiles: string[];
  customFiles: string[];
}

export interface InstallManifest {
  version: number;
  installs: InstallManifestEntry[];
}

export interface UninstallResult {
  host: string;
  scope: "project" | "global";
  targetRoot: string;
  removedFiles: string[];
  remainingInstalls: number;
}

export interface UpgradeHistoryEntry {
  timestamp: string;
  action: "sync" | "upgrade";
  host: string;
  scope: "project" | "global";
  pack: string;
  targetRoot: string;
  summary: {
    addedFiles: string[];
    changedFiles: string[];
    removedFiles: string[];
    impacts: string[];
    artifactChanges: string[];
  };
}

export interface UpgradeHistoryDocument {
  version: number;
  entries: UpgradeHistoryEntry[];
}
