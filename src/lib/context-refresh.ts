import path from "node:path";
import fs from "fs-extra";
import {
  refreshProjectContextMarkdown,
  writeContextIndexMarkdown,
  writeProjectInventoryMarkdown
} from "./context-documents.js";
import { inferInferencePolicy, readProjectContextFile } from "./project-context.js";
import { readInteractionPolicyFile } from "./interaction-policy.js";
import { readLocaleFile } from "./locale.js";
import type { InteractionMode, OutputLocale, ProjectMode } from "./host-publisher.js";

export interface RefreshContextResult {
  targetRoot: string;
  projectMode: ProjectMode;
  outputLocale: OutputLocale;
  interactionMode: InteractionMode;
  contextIndexFile: string;
  projectContextFile: string;
  projectInventoryFile: string;
  detectedLanguages: string[];
  detectedFrameworks: string[];
  keyDirectories: string[];
  moduleHints: string[];
  integrationHints: string[];
}

export async function refreshContext(targetRoot: string): Promise<RefreshContextResult> {
  const [projectContext, locale, interactionPolicy] = await Promise.all([
    readProjectContextFile(targetRoot),
    readLocaleFile(targetRoot),
    readInteractionPolicyFile(targetRoot)
  ]);

  const projectMode = projectContext?.mode ?? "existing-project";
  const outputLocale = locale?.outputLocale ?? "en";
  const interactionMode = interactionPolicy?.mode ?? "balanced";
  const inferencePolicy = inferInferencePolicy(projectMode);
  const primaryContextRoot = projectContext?.primaryContextRoot ?? targetRoot;
  const analysis = await analyzeProject(primaryContextRoot, projectMode);

  const contextIndexFile = await writeContextIndexMarkdown({
    targetRoot,
    projectMode,
    outputLocale,
    interactionMode,
    inferencePolicy
  });

  const projectContextFile = await refreshProjectContextMarkdown({
    targetRoot,
    projectMode,
    outputLocale,
    interactionMode,
    inferencePolicy,
    primaryContextRoot,
    data: analysis
  });

  const projectInventoryFile = await writeProjectInventoryMarkdown({
    targetRoot,
    projectMode,
    outputLocale,
    interactionMode,
    inferencePolicy,
    primaryContextRoot,
    data: analysis
  });

  return {
    targetRoot,
    projectMode,
    outputLocale,
    interactionMode,
    contextIndexFile,
    projectContextFile,
    projectInventoryFile,
    detectedLanguages: analysis.languages,
    detectedFrameworks: analysis.frameworks,
    keyDirectories: analysis.keyDirectories,
    moduleHints: analysis.moduleHints,
    integrationHints: analysis.integrationHints
  };
}

async function analyzeProject(root: string, projectMode: ProjectMode) {
  const entries = await fs.readdir(root).catch(() => []);
  const files = new Set(entries);
  const now = new Date().toISOString();
  const packageJson = await readPackageJson(root);

  const languages = detectLanguages(files, packageJson);
  const frameworks = detectFrameworks(files, packageJson);
  const keyDirectories = entries
    .filter((entry) => ["src", "app", "apps", "packages", "services", "libs", "modules", "infra", "scripts", "prisma", "migrations"].includes(entry))
    .sort();

  const moduleHints = await detectModuleHints(root, keyDirectories);
  const integrationHints = detectIntegrationHints(files, packageJson, entries);
  const repositorySummary = buildRepositorySummary({
    projectMode,
    languages,
    frameworks,
    keyDirectories,
    moduleHints,
    integrationHints
  });

  const architectureNotes = [
    `Detected stack: ${languages.join(", ") || "unknown"}.`,
    frameworks.length > 0
      ? `Framework and tooling signals: ${frameworks.join(", ")}.`
      : "Framework and tooling signals are still weak; validate directly in the codebase.",
    keyDirectories.length > 0
      ? `Primary directories to inspect first: ${keyDirectories.join(", ")}.`
      : "No strong top-level directory conventions detected yet."
  ];

  const domainNotes = moduleHints.length > 0
    ? moduleHints.map((hint) => `Potential module or bounded context: ${hint}.`)
    : ["No strong domain partitions were inferred yet. Inspect business modules directly in the repository."];

  const riskNotes = [
    projectMode === "existing-project"
      ? "This context is derived from heuristics and must be validated against the current codebase before major design decisions."
      : "This context is bootstrapped from artifacts and assumptions; keep it updated as code appears.",
    integrationHints.length > 0
      ? "External integration signals were detected; validate contracts before implementation changes."
      : "Integration surface still appears limited or not yet mapped."
  ];

  return {
    status: projectMode === "existing-project" ? "active" : "draft",
    coverage: keyDirectories.length > 0 || frameworks.length > 0 ? "medium" : "low",
    lastValidatedAt: now,
    repositorySummary,
    languages,
    frameworks,
    keyDirectories,
    moduleHints,
    integrationHints,
    architectureNotes,
    domainNotes,
    riskNotes
  } as const;
}

async function readPackageJson(root: string): Promise<Record<string, unknown> | null> {
  const file = path.join(root, "package.json");
  if (!(await fs.pathExists(file))) {
    return null;
  }

  try {
    return await fs.readJson(file);
  } catch {
    return null;
  }
}

function detectLanguages(files: Set<string>, packageJson: Record<string, unknown> | null): string[] {
  const languages = new Set<string>();
  if (packageJson) {
    languages.add("JavaScript");
  }
  if (files.has("tsconfig.json")) {
    languages.add("TypeScript");
  }
  if (files.has("pyproject.toml") || files.has("requirements.txt")) {
    languages.add("Python");
  }
  if (files.has("go.mod")) {
    languages.add("Go");
  }
  if (files.has("Cargo.toml")) {
    languages.add("Rust");
  }
  if (files.has("pom.xml") || files.has("build.gradle")) {
    languages.add("Java");
  }
  if ([...files].some((entry) => entry.endsWith(".sln") || entry.endsWith(".csproj"))) {
    languages.add(".NET");
  }

  return [...languages];
}

function detectFrameworks(files: Set<string>, packageJson: Record<string, unknown> | null): string[] {
  const frameworks = new Set<string>();
  const deps = {
    ...toRecord(packageJson?.dependencies),
    ...toRecord(packageJson?.devDependencies)
  };

  if ("next" in deps) frameworks.add("Next.js");
  if ("react" in deps) frameworks.add("React");
  if ("vue" in deps) frameworks.add("Vue");
  if ("express" in deps) frameworks.add("Express");
  if ("fastify" in deps) frameworks.add("Fastify");
  if ("nestjs" in deps || "@nestjs/core" in deps) frameworks.add("NestJS");
  if ("prisma" in deps || files.has("prisma")) frameworks.add("Prisma");
  if ("typescript" in deps || files.has("tsconfig.json")) frameworks.add("TypeScript");
  if ("vitest" in deps) frameworks.add("Vitest");
  if ("jest" in deps) frameworks.add("Jest");
  if ("vite" in deps) frameworks.add("Vite");
  if (files.has("docker-compose.yml") || files.has("docker-compose.yaml")) frameworks.add("Docker Compose");
  if (files.has("Dockerfile")) frameworks.add("Docker");
  if (files.has("pyproject.toml")) frameworks.add("Python project");
  if (files.has("go.mod")) frameworks.add("Go modules");

  return [...frameworks];
}

async function detectModuleHints(root: string, keyDirectories: string[]): Promise<string[]> {
  const searchRoots = keyDirectories.filter((entry) => ["src", "app", "apps", "packages", "services", "libs", "modules"].includes(entry));
  const hints = new Set<string>();

  for (const directory of searchRoots.slice(0, 4)) {
    const absolute = path.join(root, directory);
    const items = await fs.readdir(absolute).catch(() => []);
    for (const item of items.slice(0, 12)) {
      if (item.startsWith(".") || item === "node_modules") continue;
      hints.add(`${directory}/${item}`);
    }
  }

  return [...hints].slice(0, 12);
}

function detectIntegrationHints(files: Set<string>, packageJson: Record<string, unknown> | null, entries: string[]): string[] {
  const hints = new Set<string>();
  const deps = {
    ...toRecord(packageJson?.dependencies),
    ...toRecord(packageJson?.devDependencies)
  };

  if ("@prisma/client" in deps || "prisma" in deps) hints.add("database via Prisma");
  if ("pg" in deps || "mysql2" in deps || "mongoose" in deps) hints.add("database client detected");
  if ("@aws-sdk/client-sqs" in deps || "@aws-sdk/client-s3" in deps) hints.add("AWS SDK integration");
  if ("stripe" in deps) hints.add("Stripe");
  if ("axios" in deps || "node-fetch" in deps || "undici" in deps) hints.add("HTTP API integrations");
  if (entries.includes("openapi") || entries.includes("swagger")) hints.add("OpenAPI or Swagger assets");
  if (entries.includes("prisma")) hints.add("database schema directory");
  if (entries.includes("migrations")) hints.add("migrations directory");

  return [...hints];
}

function buildRepositorySummary(input: {
  projectMode: ProjectMode;
  languages: string[];
  frameworks: string[];
  keyDirectories: string[];
  moduleHints: string[];
  integrationHints: string[];
}): string[] {
  return [
    input.projectMode === "existing-project"
      ? "Existing project context refreshed from current repository signals."
      : "Greenfield project context refreshed from available artifacts and repository signals.",
    input.languages.length > 0
      ? `Primary languages detected: ${input.languages.join(", ")}.`
      : "No strong language signals were detected yet.",
    input.frameworks.length > 0
      ? `Framework and tooling signals: ${input.frameworks.join(", ")}.`
      : "Framework signals are still weak.",
    input.keyDirectories.length > 0
      ? `Key directories: ${input.keyDirectories.join(", ")}.`
      : "No key top-level directories were inferred yet.",
    input.integrationHints.length > 0
      ? `Potential integrations: ${input.integrationHints.join(", ")}.`
      : "No strong integration signals were inferred yet."
  ];
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}
