import path from "node:path";
import fs from "fs-extra";
import type { InteractionMode, OutputLocale, ProjectMode } from "./host-publisher.js";
import type { InferencePolicy } from "./project-context.js";

interface IntegrationDocsInput {
  targetRoot: string;
  projectMode: ProjectMode;
  outputLocale: OutputLocale;
  interactionMode: InteractionMode;
  inferencePolicy: InferencePolicy;
}

export function resolveIntegrationsRoot(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "custom", "integrations");
}

export function resolveIntegrationsIndexFile(targetRoot: string): string {
  return path.join(resolveIntegrationsRoot(targetRoot), "integrations-index.md");
}

export function resolveIntegrationsReadmeFile(targetRoot: string): string {
  return path.join(resolveIntegrationsRoot(targetRoot), "README.md");
}

export function resolveIntegrationTemplateFile(targetRoot: string): string {
  return path.join(resolveIntegrationsRoot(targetRoot), "templates", "integration-context.template.md");
}

export function resolveIntegrationAdaptersReadmeFile(targetRoot: string): string {
  return path.join(resolveIntegrationsRoot(targetRoot), "adapters", "README.md");
}

export function resolveIntegrationSecretsReadmeFile(targetRoot: string): string {
  return path.join(resolveIntegrationsRoot(targetRoot), "secrets", "README.md");
}

export async function writeIntegrationDocuments(input: IntegrationDocsInput): Promise<string[]> {
  const files = [
    {
      path: resolveIntegrationsReadmeFile(input.targetRoot),
      content: renderIntegrationsReadme(input)
    },
    {
      path: resolveIntegrationsIndexFile(input.targetRoot),
      content: renderIntegrationsIndex(input)
    },
    {
      path: resolveIntegrationTemplateFile(input.targetRoot),
      content: renderIntegrationTemplate(input)
    },
    {
      path: resolveIntegrationAdaptersReadmeFile(input.targetRoot),
      content: renderIntegrationAdaptersReadme()
    },
    {
      path: resolveIntegrationSecretsReadmeFile(input.targetRoot),
      content: renderIntegrationSecretsReadme()
    }
  ];

  for (const file of files) {
    await fs.ensureDir(path.dirname(file.path));
    await fs.writeFile(file.path, file.content, "utf8");
  }

  return files.map((file) => file.path);
}

function renderIntegrationsReadme(input: IntegrationDocsInput): string {
  return [
    "---",
    "schema: looply/integrations-readme@v1",
    "name: integrations-readme",
    "status: active",
    `project_mode: ${input.projectMode}`,
    `inference_policy: ${input.inferencePolicy}`,
    `output_locale: ${input.outputLocale}`,
    `interaction_mode: ${input.interactionMode}`,
    "---",
    "",
    "# Integrations",
    "",
    "This folder is the operational home for external integrations in looply.",
    "",
    "## Current Scope",
    "",
    "- `context`: supported now as Markdown files that the host can read for reasoning.",
    "- `adapter`: reserved for future execution-oriented integration adapters.",
    "- `secrets`: reserved for future secure operational configuration references.",
    "",
    "## Rules",
    "",
    "- Keep integration context in Markdown with frontmatter.",
    "- Do not store raw secrets in Markdown files.",
    "- Prefer environment variable references, secret manager references and codebase touchpoints.",
    "- For existing projects, validate integration context against the real codebase before trusting it.",
    "",
    "## Structure",
    "",
    "- `integrations-index.md`: canonical index of known integrations",
    "- `templates/integration-context.template.md`: template for new integration context files",
    "- `adapters/README.md`: future execution adapter boundary",
    "- `secrets/README.md`: future secure config boundary"
  ].join("\n");
}

function renderIntegrationsIndex(input: IntegrationDocsInput): string {
  return [
    "---",
    "schema: looply/integrations-index@v1",
    "name: integrations-index",
    "status: draft",
    "coverage: low",
    `project_mode: ${input.projectMode}`,
    `inference_policy: ${input.inferencePolicy}`,
    `output_locale: ${input.outputLocale}`,
    `interaction_mode: ${input.interactionMode}`,
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
    "",
    "- Add one entry per known integration using the template in `templates/integration-context.template.md`.",
    "",
    "## Suggested Entry Format",
    "",
    "- `name`: short integration identifier",
    "- `category`: payments, messaging, auth, storage, internal-api",
    "- `owner`: team or domain owner",
    "- `file`: relative path to the integration context markdown",
    "- `status`: active, draft, stale, empty",
    "- `coverage`: low, medium, high"
  ].join("\n");
}

function renderIntegrationTemplate(input: IntegrationDocsInput): string {
  return [
    "---",
    "schema: looply/integration-context@v1",
    "name: example-integration",
    "status: draft",
    "coverage: low",
    "category: internal-api",
    "owner:",
    `project_mode: ${input.projectMode}`,
    `inference_policy: ${input.inferencePolicy}`,
    "source_of_truth: codebase+ops",
    "touchpoints: []",
    "env_refs: []",
    "secret_refs: []",
    "adapter_refs: []",
    "related_artifacts: []",
    "last_validated_at:",
    "---",
    "",
    "# Integration Context",
    "",
    "## Purpose",
    "",
    "Describe what this integration does for the product or feature.",
    "",
    "## Touchpoints",
    "",
    "- List directories, modules, queues, webhooks or files that implement or consume this integration.",
    "",
    "## Contracts",
    "",
    "- Record important request/response, event or file contracts.",
    "",
    "## Operational Notes",
    "",
    "- Record rate limits, retry rules, idempotency, timeouts or failure modes.",
    "",
    "## Security Notes",
    "",
    "- Reference secret names or secret managers, never the secret values themselves.",
    "",
    "## Feature Impact",
    "",
    "- List workflows, tasks or features that should read this context."
  ].join("\n");
}

function renderIntegrationAdaptersReadme(): string {
  return [
    "---",
    "schema: looply/integration-adapters-readme@v1",
    "name: integration-adapters-readme",
    "status: reserved",
    "---",
    "",
    "# Integration Adapters",
    "",
    "This folder is reserved for future execution-oriented integration adapters.",
    "",
    "## Intended Role",
    "",
    "- Translate integration context into executable operations when looply needs runtime support.",
    "- Keep adapters separate from reasoning context so the core stays artifact-first.",
    "",
    "## Future Shape",
    "",
    "- One adapter per integration or provider family.",
    "- Explicit port/adapters boundary.",
    "- No secrets stored here; use references to the secrets layer."
  ].join("\n");
}

function renderIntegrationSecretsReadme(): string {
  return [
    "---",
    "schema: looply/integration-secrets-readme@v1",
    "name: integration-secrets-readme",
    "status: reserved",
    "---",
    "",
    "# Integration Secrets",
    "",
    "This folder is reserved for future secure operational configuration references.",
    "",
    "## Intended Role",
    "",
    "- Record secret names, environment variable references and secret manager locations.",
    "- Keep secret values outside looply markdown artifacts.",
    "",
    "## Rules",
    "",
    "- Never store raw credentials in Git or Markdown files.",
    "- Prefer references like environment variable names, vault paths or secret IDs.",
    "- Let integration context files point here using `secret_refs`."
  ].join("\n");
}
