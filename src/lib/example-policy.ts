import os from "node:os";
import path from "node:path";
import fs from "fs-extra";

export type ExamplePolicyMode = "on" | "reduced" | "off";
export type ExamplePolicySource = "project" | "global" | "default";

export interface ExamplePolicyDocument {
  mode: ExamplePolicyMode;
  updatedAt: string;
}

export interface EffectiveExamplePolicy {
  mode: ExamplePolicyMode;
  source: ExamplePolicySource;
  projectFile: string;
  globalFile: string;
  projectPolicy: ExamplePolicyDocument | null;
  globalPolicy: ExamplePolicyDocument | null;
}

export const defaultExamplePolicyMode: ExamplePolicyMode = "on";

export function resolveExamplePolicyFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "example-policy.json");
}

export function resolveGlobalExamplePolicyFile(): string {
  return path.join(os.homedir(), ".looply", "state", "example-policy.json");
}

export async function writeExamplePolicyFile(targetRoot: string, mode: ExamplePolicyMode): Promise<string> {
  const file = resolveExamplePolicyFile(targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.writeJson(file, buildExamplePolicy(mode), { spaces: 2 });
  return file;
}

export async function writeGlobalExamplePolicyFile(mode: ExamplePolicyMode): Promise<string> {
  const file = resolveGlobalExamplePolicyFile();
  await fs.ensureDir(path.dirname(file));
  await fs.writeJson(file, buildExamplePolicy(mode), { spaces: 2 });
  return file;
}

export async function readExamplePolicyFile(targetRoot: string): Promise<ExamplePolicyDocument | null> {
  return readExamplePolicyDocument(resolveExamplePolicyFile(targetRoot));
}

export async function readGlobalExamplePolicy(): Promise<ExamplePolicyDocument | null> {
  return readExamplePolicyDocument(resolveGlobalExamplePolicyFile());
}

export async function resolveEffectiveExamplePolicy(targetRoot: string): Promise<EffectiveExamplePolicy> {
  const [projectPolicy, globalPolicy] = await Promise.all([
    readExamplePolicyFile(targetRoot),
    readGlobalExamplePolicy()
  ]);

  if (projectPolicy) {
    return {
      mode: projectPolicy.mode,
      source: "project",
      projectFile: resolveExamplePolicyFile(targetRoot),
      globalFile: resolveGlobalExamplePolicyFile(),
      projectPolicy,
      globalPolicy
    };
  }

  if (globalPolicy) {
    return {
      mode: globalPolicy.mode,
      source: "global",
      projectFile: resolveExamplePolicyFile(targetRoot),
      globalFile: resolveGlobalExamplePolicyFile(),
      projectPolicy,
      globalPolicy
    };
  }

  return {
    mode: defaultExamplePolicyMode,
    source: "default",
    projectFile: resolveExamplePolicyFile(targetRoot),
    globalFile: resolveGlobalExamplePolicyFile(),
    projectPolicy,
    globalPolicy
  };
}

export function normalizeExamplePolicyMode(value: unknown): ExamplePolicyMode | null {
  if (value === "on" || value === "reduced" || value === "off") {
    return value;
  }

  return null;
}

function buildExamplePolicy(mode: ExamplePolicyMode): ExamplePolicyDocument {
  return {
    mode,
    updatedAt: new Date().toISOString()
  };
}

async function readExamplePolicyDocument(file: string): Promise<ExamplePolicyDocument | null> {
  if (!(await fs.pathExists(file))) {
    return null;
  }

  const raw = await fs.readJson(file);
  const mode = normalizeExamplePolicyMode(raw?.mode);
  if (!mode) {
    return null;
  }

  return {
    mode,
    updatedAt: typeof raw?.updatedAt === "string" ? raw.updatedAt : ""
  };
}
