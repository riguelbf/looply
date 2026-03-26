import path from "node:path";
import fs from "fs-extra";
import type { ProjectMode } from "./host-publisher.js";

export type InferencePolicy =
  | "codebase-first-with-artifact-acceleration"
  | "artifact-first-with-explicit-assumptions";

export interface ProjectContextDocument {
  mode: ProjectMode;
  primaryContextRoot: string;
  inferencePolicy: InferencePolicy;
}

export function detectProjectMode(currentWorkingDirectory: string): ProjectMode {
  const signals = [
    ".git",
    "package.json",
    "pyproject.toml",
    "go.mod",
    "Cargo.toml",
    "pom.xml",
    "README.md",
    "src"
  ];

  return signals.some((entry) => fs.existsSync(path.join(currentWorkingDirectory, entry)))
    ? "existing-project"
    : "greenfield";
}

export function resolveProjectContextFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "project-context.json");
}

export async function writeProjectContextFile(targetRoot: string, input: {
  mode: ProjectMode;
  primaryContextRoot: string;
}): Promise<string> {
  const file = resolveProjectContextFile(targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.writeJson(file, {
    mode: input.mode,
    primaryContextRoot: input.primaryContextRoot,
    inferencePolicy: inferInferencePolicy(input.mode)
  } satisfies ProjectContextDocument, { spaces: 2 });
  return file;
}

export async function readProjectContextFile(targetRoot: string): Promise<ProjectContextDocument | null> {
  const file = resolveProjectContextFile(targetRoot);
  if (!(await fs.pathExists(file))) {
    return null;
  }

  const raw = await fs.readJson(file);
  const mode = raw?.mode === "greenfield" ? "greenfield" : raw?.mode === "existing-project" ? "existing-project" : null;
  const primaryContextRoot = typeof raw?.primaryContextRoot === "string" ? raw.primaryContextRoot : null;
  if (!mode || !primaryContextRoot) {
    return null;
  }

  return {
    mode,
    primaryContextRoot,
    inferencePolicy: inferInferencePolicy(mode)
  };
}

export function inferInferencePolicy(mode: ProjectMode): InferencePolicy {
  return mode === "existing-project"
    ? "codebase-first-with-artifact-acceleration"
    : "artifact-first-with-explicit-assumptions";
}
