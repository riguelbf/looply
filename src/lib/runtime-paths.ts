import os from "node:os";
import path from "node:path";
import type { InstallScope } from "./host-publisher.js";

export function resolveProjectRoot(currentWorkingDirectory: string): string {
  return currentWorkingDirectory;
}

export function resolveGlobalHostRoot(host: "codex" | "claude"): string {
  const homeDirectory = os.homedir();
  return host === "codex"
    ? path.join(homeDirectory, ".codex")
    : path.join(homeDirectory, ".claude");
}

export function resolveTargetRoot(
  scope: InstallScope,
  currentWorkingDirectory: string,
  host: "codex" | "claude"
): string {
  return scope === "project"
    ? resolveProjectRoot(currentWorkingDirectory)
    : resolveGlobalHostRoot(host);
}
