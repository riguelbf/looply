import os from "node:os";
import path from "node:path";
import type { InstallScope } from "./host-publisher.js";

export function resolveProjectRoot(currentWorkingDirectory: string): string {
  return currentWorkingDirectory;
}

export function resolveGlobalHostRoot(host: "codex" | "claude" | "opencode"): string {
  const homeDirectory = os.homedir();
  return host === "codex"
    ? path.join(homeDirectory, ".codex")
    : host === "claude"
      ? path.join(homeDirectory, ".claude")
      : path.join(homeDirectory, ".opencode");
}

export function resolveGlobalCodexSkillsRoot(): string {
  return path.join(os.homedir(), ".agents", "skills");
}

export function resolveTargetRoot(
  scope: InstallScope,
  currentWorkingDirectory: string,
  host: "codex" | "claude" | "opencode"
): string {
  return scope === "project"
    ? resolveProjectRoot(currentWorkingDirectory)
    : resolveGlobalHostRoot(host);
}
