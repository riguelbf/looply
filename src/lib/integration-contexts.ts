import path from "node:path";
import fs from "fs-extra";
import { globby } from "globby";
import matter from "gray-matter";
import YAML from "yaml";
import { readInteractionPolicyFile } from "./interaction-policy.js";
import { readLocaleFile } from "./locale.js";
import { readProjectContextFile } from "./project-context.js";
import {
  resolveIntegrationsIndexFile,
  resolveIntegrationsRoot
} from "./integration-documents.js";

export type IntegrationStatus = "empty" | "draft" | "active" | "stale";
export type IntegrationCoverage = "low" | "medium" | "high";

export interface IntegrationContextFrontmatter {
  schema: "looply/integration-context@v1";
  name: string;
  status: IntegrationStatus;
  coverage: IntegrationCoverage;
  category: string;
  owner: string;
  project_mode: "existing-project" | "greenfield";
  inference_policy: "codebase-first-with-artifact-acceleration" | "artifact-first-with-explicit-assumptions";
  source_of_truth: string;
  touchpoints: string[];
  env_refs: string[];
  secret_refs: string[];
  adapter_refs: string[];
  related_artifacts: string[];
  last_validated_at?: string | null;
}

export interface IntegrationContextDocument {
  file: string;
  frontmatter: IntegrationContextFrontmatter;
  body: string;
}

export interface IntegrationContextInput {
  name: string;
  status: IntegrationStatus;
  coverage: IntegrationCoverage;
  category: string;
  owner: string;
  purpose: string;
  touchpoints: string[];
  envRefs: string[];
  secretRefs: string[];
  adapterRefs: string[];
  relatedArtifacts: string[];
  targetRoot: string;
}

export function resolveIntegrationContextFile(targetRoot: string, name: string): string {
  return path.join(resolveIntegrationsRoot(targetRoot), `${sanitizeIntegrationName(name)}.md`);
}

export function sanitizeIntegrationName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function listIntegrationContexts(targetRoot: string): Promise<IntegrationContextDocument[]> {
  const root = resolveIntegrationsRoot(targetRoot);
  if (!(await fs.pathExists(root))) {
    return [];
  }

  const files = await globby("*.md", {
    cwd: root,
    absolute: true,
    onlyFiles: true,
    ignore: ["README.md", "integrations-index.md"]
  });

  const documents: IntegrationContextDocument[] = [];
  for (const file of files.sort()) {
    const source = await fs.readFile(file, "utf8");
    const parsed = matter(source);
    const frontmatter = parsed.data as Partial<IntegrationContextFrontmatter>;

    if (frontmatter.schema !== "looply/integration-context@v1" || typeof frontmatter.name !== "string") {
      continue;
    }

    documents.push({
      file,
      frontmatter: {
        schema: "looply/integration-context@v1",
        name: frontmatter.name,
        status: normalizeStatus(frontmatter.status),
        coverage: normalizeCoverage(frontmatter.coverage),
        category: typeof frontmatter.category === "string" ? frontmatter.category : "internal-api",
        owner: typeof frontmatter.owner === "string" ? frontmatter.owner : "",
        project_mode: frontmatter.project_mode === "greenfield" ? "greenfield" : "existing-project",
        inference_policy: frontmatter.inference_policy === "artifact-first-with-explicit-assumptions"
          ? "artifact-first-with-explicit-assumptions"
          : "codebase-first-with-artifact-acceleration",
        source_of_truth: typeof frontmatter.source_of_truth === "string" ? frontmatter.source_of_truth : "codebase+ops",
        touchpoints: normalizeArray(frontmatter.touchpoints),
        env_refs: normalizeArray(frontmatter.env_refs),
        secret_refs: normalizeArray(frontmatter.secret_refs),
        adapter_refs: normalizeArray(frontmatter.adapter_refs),
        related_artifacts: normalizeArray(frontmatter.related_artifacts),
        last_validated_at: typeof frontmatter.last_validated_at === "string" ? frontmatter.last_validated_at : null
      },
      body: parsed.content.trim()
    });
  }

  return documents.sort((left, right) => left.frontmatter.name.localeCompare(right.frontmatter.name));
}

export async function readIntegrationContext(targetRoot: string, name: string): Promise<IntegrationContextDocument | null> {
  const file = resolveIntegrationContextFile(targetRoot, name);
  if (!(await fs.pathExists(file))) {
    return null;
  }

  const [document] = (await listIntegrationContexts(targetRoot)).filter((entry) => entry.file === file);
  return document ?? null;
}

export async function writeIntegrationContext(input: IntegrationContextInput): Promise<{ file: string; indexFile: string }> {
  const projectContext = await readProjectContextFile(input.targetRoot);
  const projectMode = projectContext?.mode ?? "existing-project";
  const inferencePolicy = projectContext?.inferencePolicy ?? "codebase-first-with-artifact-acceleration";
  const file = resolveIntegrationContextFile(input.targetRoot, input.name);
  const frontmatter: IntegrationContextFrontmatter = {
    schema: "looply/integration-context@v1",
    name: sanitizeIntegrationName(input.name),
    status: input.status,
    coverage: input.coverage,
    category: input.category,
    owner: input.owner,
    project_mode: projectMode,
    inference_policy: inferencePolicy,
    source_of_truth: "codebase+ops",
    touchpoints: input.touchpoints,
    env_refs: input.envRefs,
    secret_refs: input.secretRefs,
    adapter_refs: input.adapterRefs,
    related_artifacts: input.relatedArtifacts,
    last_validated_at: null
  };

  const body = renderIntegrationContextBody(input);
  const source = `---\n${YAML.stringify(frontmatter)}---\n\n${body}\n`;

  await fs.ensureDir(path.dirname(file));
  await fs.writeFile(file, source, "utf8");

  const indexFile = await rewriteIntegrationsIndex(input.targetRoot);
  return { file, indexFile };
}

export async function rewriteIntegrationsIndex(targetRoot: string): Promise<string> {
  const indexFile = resolveIntegrationsIndexFile(targetRoot);
  const contexts = await listIntegrationContexts(targetRoot);
  const locale = (await readLocaleFile(targetRoot))?.outputLocale ?? "en";
  const projectContext = await readProjectContextFile(targetRoot);
  const interactionPolicy = await readInteractionPolicyFile(targetRoot);

  const lines = [
    "---",
    "schema: looply/integrations-index@v1",
    "name: integrations-index",
    `status: ${contexts.length > 0 ? "active" : "draft"}`,
    `coverage: ${contexts.length > 2 ? "high" : contexts.length > 0 ? "medium" : "low"}`,
    `project_mode: ${projectContext?.mode ?? "existing-project"}`,
    `inference_policy: ${projectContext?.inferencePolicy ?? "codebase-first-with-artifact-acceleration"}`,
    `output_locale: ${locale}`,
    `interaction_mode: ${interactionPolicy?.mode ?? "balanced"}`,
    "source_of_truth: codebase+ops",
    "last_validated_at:",
    "---",
    "",
    "# Integrations Index",
    "",
    "## How Hosts Should Use This",
    "",
    "- When a feature mentions a known integration, open the corresponding integration context file first.",
    "- If the integration context is `draft`, `stale` or incomplete, inspect the real codebase before relying on it.",
    "- Use `touchpoints` to locate the relevant modules in the repository.",
    "- Use `env_refs` and `secret_refs` only as references, never as secret values.",
    "",
    "## Registered Integrations",
    ""
  ];

  if (contexts.length === 0) {
    lines.push("- No integration contexts registered yet.");
  } else {
    for (const context of contexts) {
      const relativeFile = path.relative(resolveIntegrationsRoot(targetRoot), context.file).replaceAll("\\", "/");
      lines.push(`- \`${context.frontmatter.name}\``);
      lines.push(`  - category: ${context.frontmatter.category}`);
      lines.push(`  - owner: ${context.frontmatter.owner || "unassigned"}`);
      lines.push(`  - status: ${context.frontmatter.status}`);
      lines.push(`  - coverage: ${context.frontmatter.coverage}`);
      lines.push(`  - file: ${relativeFile}`);
    }
  }

  lines.push(
    "",
    "## Suggested Entry Format",
    "",
    "- `name`: short integration identifier",
    "- `category`: payments, messaging, auth, storage, internal-api",
    "- `owner`: team or domain owner",
    "- `file`: relative path to the integration context markdown",
    "- `status`: active, draft, stale, empty",
    "- `coverage`: low, medium, high"
  );

  await fs.ensureDir(path.dirname(indexFile));
  await fs.writeFile(indexFile, `${lines.join("\n")}\n`, "utf8");
  return indexFile;
}

function renderIntegrationContextBody(input: IntegrationContextInput): string {
  const touchpoints = input.touchpoints.length > 0 ? input.touchpoints.map((item) => `- ${item}`) : ["- Add codebase touchpoints here."];
  const envRefs = input.envRefs.length > 0 ? input.envRefs.map((item) => `- ${item}`) : ["- Add environment references here."];
  const secretRefs = input.secretRefs.length > 0 ? input.secretRefs.map((item) => `- ${item}`) : ["- Add secret references here. Never store secret values."];
  const adapterRefs = input.adapterRefs.length > 0 ? input.adapterRefs.map((item) => `- ${item}`) : ["- Add future adapter references here."];
  const relatedArtifacts = input.relatedArtifacts.length > 0 ? input.relatedArtifacts.map((item) => `- ${item}`) : ["- Add related workflows, stories or features here."];

  return [
    "# Integration Context",
    "",
    "## Purpose",
    "",
    input.purpose || "Describe what this integration does for the product or feature.",
    "",
    "## Touchpoints",
    "",
    ...touchpoints,
    "",
    "## Contracts",
    "",
    "- Record important request, response, event or file contracts here.",
    "",
    "## Operational Notes",
    "",
    "- Record retries, rate limits, timeouts, idempotency and failure modes here.",
    "",
    "## Security Notes",
    "",
    ...secretRefs,
    "",
    "## Environment References",
    "",
    ...envRefs,
    "",
    "## Adapter References",
    "",
    ...adapterRefs,
    "",
    "## Feature Impact",
    "",
    ...relatedArtifacts
  ].join("\n");
}

function normalizeArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter((item) => item !== "")
    : [];
}

function normalizeStatus(value: unknown): IntegrationStatus {
  return value === "active" || value === "stale" || value === "empty" ? value : "draft";
}

function normalizeCoverage(value: unknown): IntegrationCoverage {
  return value === "medium" || value === "high" ? value : "low";
}
