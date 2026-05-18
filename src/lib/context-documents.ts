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
  apiSignals: string[];
  dataSignals: string[];
  authSignals: string[];
  messagingSignals: string[];
  observabilitySignals: string[];
  workspaceHints: string[];
  testingSignals: string[];
  infrastructureSignals: string[];
  automationSignals: string[];
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

export function resolveArchitectureContextMarkdownFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "custom", "architecture-context.md");
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

export async function writeArchitectureContextMarkdown(input: ProjectContextMarkdownInput & {
  data: ProjectContextRefreshData;
}): Promise<string> {
  const file = resolveArchitectureContextMarkdownFile(input.targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.writeFile(file, renderArchitectureContextMarkdown(input), "utf8");
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
    "2. Context ledger: `.looply/custom/features/<feature-name>/context-ledger.md` (accumulated decisions across all stages)",
    "3. Feature context: `.looply/custom/features/<feature-name>/feature-context.md`",
    "4. Knowledge graph: `.looply/state/knowledge-graph.json` (module dependencies and database schema)",
    "5. Code context: `.looply/state/code-context.json` (symbols, relations and entrypoints)",
    "6. Project context: `.looply/custom/project-context.md`",
    "7. Architecture context: `.looply/custom/architecture-context.md`",
    "8. Relevant integration context files under `.looply/custom/integrations/`",
    "9. Project rules under `.looply/custom/rules/`",
    input.projectMode === "existing-project"
      ? "10. Real local codebase under the primary context root"
      : "10. User instructions and managed artifacts until code exists",
    "11. Session context: `.looply/custom/session-context.md`",
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
    "- `.looply/custom/features/<feature-name>/workflow-status.md`",
    "- `.looply/custom/features/<feature-name>/context-ledger.md` (append-only shared memory)",
    "- `.looply/custom/features/<feature-name>/feature-context.md`",
    "- `.looply/state/knowledge-graph.json` (module dependencies and database schema)",
    "- `.looply/state/code-context.json` (symbols, relations and entrypoints)",
    "- `.looply/custom/project-context.md`",
    "- `.looply/custom/architecture-context.md`",
    "- `.looply/state/project-inventory.md`",
    "- `.looply/state/harness-report.md` (advisory — read before starting a workflow; blocking errors must be resolved first)",
    "- `.looply/custom/session-context.md`",
    "- `.looply/custom/integrations/integrations-index.md`",
    "- `.looply/custom/rules/rules-index.md`"
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
    "## Delivery Signals",
    "",
    "- API and communication signals:",
    ...toIndentedBulletLines(input.data.apiSignals),
    "- Data and persistence signals:",
    ...toIndentedBulletLines(input.data.dataSignals),
    "- Authentication and access signals:",
    ...toIndentedBulletLines(input.data.authSignals),
    "- Messaging signals:",
    ...toIndentedBulletLines(input.data.messagingSignals),
    "- Observability signals:",
    ...toIndentedBulletLines(input.data.observabilitySignals),
    "- Workspace and repo shape:",
    ...toIndentedBulletLines(input.data.workspaceHints),
    "- Testing signals:",
    ...toIndentedBulletLines(input.data.testingSignals),
    "- Infrastructure signals:",
    ...toIndentedBulletLines(input.data.infrastructureSignals),
    "- Automation signals:",
    ...toIndentedBulletLines(input.data.automationSignals),
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
    "## Workspace Hints",
    "",
    ...toBulletLines(input.data.workspaceHints),
    "",
    "## API Signals",
    "",
    ...toBulletLines(input.data.apiSignals),
    "",
    "## Data Signals",
    "",
    ...toBulletLines(input.data.dataSignals),
    "",
    "## Authentication Signals",
    "",
    ...toBulletLines(input.data.authSignals),
    "",
    "## Messaging Signals",
    "",
    ...toBulletLines(input.data.messagingSignals),
    "",
    "## Observability Signals",
    "",
    ...toBulletLines(input.data.observabilitySignals),
    "",
    "## Testing Signals",
    "",
    ...toBulletLines(input.data.testingSignals),
    "",
    "## Infrastructure Signals",
    "",
    ...toBulletLines(input.data.infrastructureSignals),
    "",
    "## Automation Signals",
    "",
    ...toBulletLines(input.data.automationSignals),
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

function renderArchitectureContextMarkdown(input: ProjectContextMarkdownInput & {
  data: ProjectContextRefreshData;
}): string {
  return [
    "---",
    "schema: looply/architecture-context@v1",
    "name: architecture-context",
    `status: ${input.data.status}`,
    `coverage: ${input.data.coverage}`,
    `project_mode: ${input.projectMode}`,
    `primary_context_root: ${input.primaryContextRoot}`,
    `last_validated_at: ${input.data.lastValidatedAt}`,
    "---",
    "",
    "# Architecture Context",
    "",
    "## Current Shape",
    "",
    ...toBulletLines(input.data.architectureNotes),
    "",
    "## Module And Domain Hints",
    "",
    ...toBulletLines(input.data.domainNotes),
    "",
    "## Delivery And Operability Signals",
    "",
    "- API and communication signals:",
    ...toIndentedBulletLines(input.data.apiSignals),
    "- Data and persistence signals:",
    ...toIndentedBulletLines(input.data.dataSignals),
    "- Authentication and access signals:",
    ...toIndentedBulletLines(input.data.authSignals),
    "- Messaging signals:",
    ...toIndentedBulletLines(input.data.messagingSignals),
    "- Observability signals:",
    ...toIndentedBulletLines(input.data.observabilitySignals),
    "- Workspace and repo shape:",
    ...toIndentedBulletLines(input.data.workspaceHints),
    "- Testing signals:",
    ...toIndentedBulletLines(input.data.testingSignals),
    "- Infrastructure signals:",
    ...toIndentedBulletLines(input.data.infrastructureSignals),
    "- Automation signals:",
    ...toIndentedBulletLines(input.data.automationSignals),
    "",
    "## Risks And Follow-up",
    "",
    ...toBulletLines(input.data.riskNotes)
  ].join("\n");
}

function toBulletLines(items: string[]): string[] {
  if (items.length === 0) {
    return ["- none"];
  }

  return items.map((item) => `- ${item}`);
}

function toIndentedBulletLines(items: string[]): string[] {
  if (items.length === 0) {
    return ["  - none"];
  }

  return items.map((item) => `  - ${item}`);
}
