import path from "node:path";
import fs from "fs-extra";
import type { InteractionMode, OutputLocale, ProjectMode } from "./host-publisher.js";
import type { InferencePolicy } from "./project-context.js";

type ContextStatus = "empty" | "draft" | "active" | "stale";
type ContextCoverage = "low" | "medium" | "high";

interface ContextIndexInput {
  targetRoot: string;
  projectMode: ProjectMode;
  outputLocale: OutputLocale;
  interactionMode: InteractionMode;
  inferencePolicy: InferencePolicy;
}

interface ProjectContextMarkdownInput extends ContextIndexInput {
  primaryContextRoot: string;
}

export interface ProjectContextRefreshData {
  status: ContextStatus;
  coverage: ContextCoverage;
  lastValidatedAt: string;
  repositorySummary: string[];
  languages: string[];
  frameworks: string[];
  keyDirectories: string[];
  moduleHints: string[];
  integrationHints: string[];
  architectureNotes: string[];
  domainNotes: string[];
  riskNotes: string[];
}

export function resolveContextIndexFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "context-index.md");
}

export function resolveProjectContextMarkdownFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "custom", "project-context.md");
}

export function resolveSessionContextMarkdownFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "custom", "session-context.md");
}

export function resolveProjectInventoryMarkdownFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "project-inventory.md");
}

export async function writeContextIndexMarkdown(input: ContextIndexInput): Promise<string> {
  const file = resolveContextIndexFile(input.targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.writeFile(file, renderContextIndexMarkdown(input), "utf8");
  return file;
}

export async function writeProjectContextMarkdown(input: ProjectContextMarkdownInput): Promise<string> {
  const file = resolveProjectContextMarkdownFile(input.targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.writeFile(file, renderProjectContextMarkdown(input), "utf8");
  return file;
}

export async function writeSessionContextMarkdown(input: ContextIndexInput): Promise<string> {
  const file = resolveSessionContextMarkdownFile(input.targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.writeFile(file, renderSessionContextMarkdown(input), "utf8");
  return file;
}

export async function refreshProjectContextMarkdown(input: ProjectContextMarkdownInput & {
  data: ProjectContextRefreshData;
}): Promise<string> {
  const file = resolveProjectContextMarkdownFile(input.targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.writeFile(file, renderRefreshedProjectContextMarkdown(input), "utf8");
  return file;
}

export async function writeProjectInventoryMarkdown(input: ProjectContextMarkdownInput & {
  data: ProjectContextRefreshData;
}): Promise<string> {
  const file = resolveProjectInventoryMarkdownFile(input.targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.writeFile(file, renderProjectInventoryMarkdown(input), "utf8");
  return file;
}

function renderContextIndexMarkdown(input: ContextIndexInput): string {
  const retrievalPolicy = input.projectMode === "existing-project"
    ? "codebase-first-with-artifact-acceleration"
    : "artifact-first-with-explicit-assumptions";

  return [
    "---",
    "schema: looply/context-index@v1",
    "name: context-index",
    "status: active",
    "coverage: medium",
    `project_mode: ${input.projectMode}`,
    `inference_policy: ${input.inferencePolicy}`,
    `output_locale: ${input.outputLocale}`,
    `interaction_mode: ${input.interactionMode}`,
    "---",
    "",
    "# Context Index",
    "",
    "## Retrieval Policy",
    "",
    `- Current policy: \`${retrievalPolicy}\``,
    input.projectMode === "existing-project"
      ? "- For existing projects, inspect the real local codebase before making significant product, design or implementation decisions."
      : "- For greenfield projects, rely on managed artifacts and explicit assumptions until a codebase exists.",
    "- Context markdown files accelerate understanding but must not override the real codebase when they are empty, stale, draft or inconsistent.",
    "",
    "## Priority Order",
    "",
    "1. Feature workflow status: `.looply/custom/features/<feature-name>/workflow-status.md`",
    "2. Feature context: `.looply/custom/features/<feature-name>/feature-context.md`",
    "3. Project context: `.looply/custom/project-context.md`",
    "4. Relevant integration context files under `.looply/custom/integrations/`",
    input.projectMode === "existing-project"
      ? "5. Real local codebase under the primary context root"
      : "5. User instructions and managed artifacts until code exists",
    "6. Session context: `.looply/custom/session-context.md`",
    "",
    "## Validation Rules",
    "",
    "- `status: active` means the context may be used as a primary accelerator.",
    "- `status: draft` means validate it against the codebase before trusting it.",
    "- `status: stale` means refresh it before making meaningful decisions.",
    "- `status: empty` means ignore it and inspect the codebase directly.",
    "",
    "## Registered Context Files",
    "",
    "- `.looply/custom/project-context.md`",
    "- `.looply/state/project-inventory.md`",
    "- `.looply/custom/session-context.md`",
    "- `.looply/custom/integrations/integrations-index.md`",
    "- `.looply/custom/features/<feature-name>/workflow-status.md`",
    "- `.looply/custom/features/<feature-name>/feature-context.md`"
  ].join("\n");
}

function renderRefreshedProjectContextMarkdown(input: ProjectContextMarkdownInput & {
  data: ProjectContextRefreshData;
}): string {
  const sourceOfTruth = input.projectMode === "existing-project"
    ? "codebase+artifacts"
    : "artifacts+assumptions";

  return [
    "---",
    "schema: looply/project-context@v1",
    "name: project-context",
    `status: ${input.data.status}`,
    `coverage: ${input.data.coverage}`,
    `project_mode: ${input.projectMode}`,
    `primary_context_root: ${input.primaryContextRoot}`,
    `inference_policy: ${input.inferencePolicy}`,
    `source_of_truth: ${sourceOfTruth}`,
    `last_validated_at: ${input.data.lastValidatedAt}`,
    "---",
    "",
    "# Project Context",
    "",
    "## Summary",
    "",
    ...toBulletLines(input.data.repositorySummary),
    "",
    "## Operating Rule",
    "",
    ...(input.projectMode === "existing-project"
      ? ["- Use the real local codebase as the primary source of truth for architecture, modules and implementation decisions."]
      : ["- Use managed artifacts and explicit assumptions until a codebase exists."]),
    "- Use this file as a short accelerator, not as a substitute for the repository.",
    "",
    "## Repository Signals",
    "",
    "- Primary context root:",
    `  - \`${input.primaryContextRoot}\``,
    "- Detected languages:",
    ...toIndentedBulletLines(input.data.languages),
    "- Detected frameworks and tooling:",
    ...toIndentedBulletLines(input.data.frameworks),
    "- Key directories:",
    ...toIndentedBulletLines(input.data.keyDirectories),
    "",
    "## Architecture Notes",
    "",
    ...toBulletLines(input.data.architectureNotes),
    "",
    "## Domain Notes",
    "",
    ...toBulletLines(input.data.domainNotes),
    "",
    "## Integration Notes",
    "",
    ...toBulletLines(input.data.integrationHints),
    "",
    "## Risks",
    "",
    ...toBulletLines(input.data.riskNotes)
  ].join("\n");
}

function renderProjectInventoryMarkdown(input: ProjectContextMarkdownInput & {
  data: ProjectContextRefreshData;
}): string {
  return [
    "---",
    "schema: looply/project-inventory@v1",
    "name: project-inventory",
    `status: ${input.data.status}`,
    `coverage: ${input.data.coverage}`,
    `project_mode: ${input.projectMode}`,
    `primary_context_root: ${input.primaryContextRoot}`,
    `last_validated_at: ${input.data.lastValidatedAt}`,
    "---",
    "",
    "# Project Inventory",
    "",
    "## Languages",
    "",
    ...toBulletLines(input.data.languages),
    "",
    "## Frameworks And Tooling",
    "",
    ...toBulletLines(input.data.frameworks),
    "",
    "## Key Directories",
    "",
    ...toBulletLines(input.data.keyDirectories),
    "",
    "## Module Hints",
    "",
    ...toBulletLines(input.data.moduleHints),
    "",
    "## Integration Hints",
    "",
    ...toBulletLines(input.data.integrationHints)
  ].join("\n");
}

function renderProjectContextMarkdown(input: ProjectContextMarkdownInput): string {
  const status: ContextStatus = "draft";
  const coverage: ContextCoverage = "low";
  const sourceOfTruth = input.projectMode === "existing-project"
    ? "codebase+artifacts"
    : "artifacts+assumptions";

  return [
    "---",
    "schema: looply/project-context@v1",
    "name: project-context",
    `status: ${status}`,
    `coverage: ${coverage}`,
    `project_mode: ${input.projectMode}`,
    `primary_context_root: ${input.primaryContextRoot}`,
    `inference_policy: ${input.inferencePolicy}`,
    `source_of_truth: ${sourceOfTruth}`,
    "last_validated_at:",
    "---",
    "",
    "# Project Context",
    "",
    "## Summary",
    "",
    input.projectMode === "existing-project"
      ? "Bootstrap project context for an existing repository. Use this document as a short accelerator only after validating against the real local codebase."
      : "Bootstrap project context for a greenfield project. Use this document as a planning baseline and keep explicit assumptions visible until a codebase exists.",
    "",
    "## Operating Rule",
    "",
    input.projectMode === "existing-project"
      ? "- Inspect the local codebase first for architecture, module boundaries, integrations and existing patterns."
      : "- Use managed artifacts and explicit assumptions as the primary source until the first implementation slices exist.",
    "- If this file remains empty, draft or stale, do not treat it as authoritative.",
    "",
    "## Repository Signals",
    "",
    "- Primary context root:",
    `  - \`${input.primaryContextRoot}\``,
    "",
    "## Architecture Notes",
    "",
    "- Fill this after reading the current codebase or after the first design slice.",
    "",
    "## Domain Notes",
    "",
    "- Record main domains, bounded contexts and critical business rules.",
    "",
    "## Integration Notes",
    "",
    "- Record external systems, APIs, queues, storage or providers that materially affect feature work.",
    "",
    "## Risks",
    "",
    "- Record architectural hotspots or fragile areas that should bias future decisions."
  ].join("\n");
}

function renderSessionContextMarkdown(input: ContextIndexInput): string {
  return [
    "---",
    "schema: looply/session-context@v1",
    "name: session-context",
    "status: active",
    "coverage: low",
    `project_mode: ${input.projectMode}`,
    `inference_policy: ${input.inferencePolicy}`,
    `output_locale: ${input.outputLocale}`,
    `interaction_mode: ${input.interactionMode}`,
    "---",
    "",
    "# Session Context",
    "",
    "## Purpose",
    "",
    "- Use this file together with `.looply/custom/session-links.json` to reconnect open sessions to the correct feature and workflow.",
    "",
    "## Session Policy",
    "",
    "- Prefer feature-specific workflow state over generic session memory.",
    "- When multiple sessions are open, always bind them using `session-label`.",
    "- Do not use session context to override the real codebase for existing projects.",
    "",
    "## Interaction Policy",
    "",
    `- Current mode: \`${input.interactionMode}\``,
    input.interactionMode === "autonomous"
      ? "- Avoid repeated clarifications. Ask only on destructive changes or critical ambiguity."
      : input.interactionMode === "guided"
        ? "- Ask more frequently at phase boundaries and before meaningful changes."
        : "- Ask at phase transitions, meaningful ambiguity or destructive changes."
  ].join("\n");
}

function toBulletLines(values: string[]): string[] {
  return values.length > 0 ? values.map((value) => `- ${value}`) : ["- None recorded yet."];
}

function toIndentedBulletLines(values: string[]): string[] {
  return values.length > 0 ? values.map((value) => `  - ${value}`) : ["  - None recorded yet."];
}
