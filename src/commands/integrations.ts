import { cancel, confirm, isCancel, select, text } from "@clack/prompts";
import type { Command } from "commander";
import chalk from "chalk";
import path from "node:path";
import {
  listIntegrationContexts,
  readIntegrationContext,
  sanitizeIntegrationName,
  writeIntegrationContext,
  type IntegrationContextDocument,
  type IntegrationCoverage,
  type IntegrationStatus
} from "../lib/integration-contexts.js";
import { showIntro, showOutro } from "../ui/feedback.js";

export function registerIntegrationsCommand(program: Command): void {
  const integrations = program
    .command("integrations")
    .description("Manage external integration contexts for looply");

  integrations
    .command("list")
    .description("List registered integration contexts")
    .option("--dir <dir>", "Target directory for the current project (defaults to current directory)")
    .action(async (options) => {
      showIntro("looply integrations");
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const contexts = await listIntegrationContexts(targetRoot);

      if (contexts.length === 0) {
        showOutro(`No integration contexts found in ${targetRoot}`);
        return;
      }

      for (const context of contexts) {
        console.log(chalk.bold(context.frontmatter.name));
        console.log(`category: ${chalk.cyan(context.frontmatter.category)}  owner: ${context.frontmatter.owner || chalk.dim("unassigned")}`);
        console.log(`status: ${context.frontmatter.status}  coverage: ${context.frontmatter.coverage}`);
        console.log(`file: ${chalk.dim(context.file)}`);
        console.log("");
      }

      showOutro(`Showing ${contexts.length} integration context${contexts.length === 1 ? "" : "s"}`);
    });

  integrations
    .command("add [name]")
    .description("Create a new integration context with a guided questionnaire")
    .option("--dir <dir>", "Target directory for the current project (defaults to current directory)")
    .option("--category <category>", "Integration category such as payments or internal-api")
    .option("--owner <owner>", "Integration owner such as billing-platform")
    .option("--status <status>", "Context status such as draft or active")
    .option("--coverage <coverage>", "Context coverage such as low, medium or high")
    .option("--purpose <purpose>", "Short purpose for the integration")
    .option("--touchpoints <items>", "Comma-separated codebase touchpoints")
    .option("--env-refs <items>", "Comma-separated environment variable references")
    .option("--secret-refs <items>", "Comma-separated secret references")
    .option("--adapter-refs <items>", "Comma-separated future adapter references")
    .option("--related-artifacts <items>", "Comma-separated related workflows, stories or features")
    .option("--yes", "Skip confirmation and use resolved values")
    .action(async (name, options) => {
      showIntro("looply integrations");
      await runIntegrationQuestionnaire({
        mode: "add",
        targetRoot: path.resolve(options.dir ?? process.cwd()),
        nameOption: name,
        categoryOption: options.category,
        ownerOption: options.owner,
        statusOption: options.status,
        coverageOption: options.coverage,
        purposeOption: options.purpose,
        touchpointsOption: options.touchpoints,
        envRefsOption: options.envRefs,
        secretRefsOption: options.secretRefs,
        adapterRefsOption: options.adapterRefs,
        relatedArtifactsOption: options.relatedArtifacts,
        yes: options.yes
      });
    });

  integrations
    .command("configure <name>")
    .description("Update an existing integration context with a guided questionnaire")
    .option("--dir <dir>", "Target directory for the current project (defaults to current directory)")
    .option("--category <category>", "Integration category such as payments or internal-api")
    .option("--owner <owner>", "Integration owner such as billing-platform")
    .option("--status <status>", "Context status such as draft or active")
    .option("--coverage <coverage>", "Context coverage such as low, medium or high")
    .option("--purpose <purpose>", "Short purpose for the integration")
    .option("--touchpoints <items>", "Comma-separated codebase touchpoints")
    .option("--env-refs <items>", "Comma-separated environment variable references")
    .option("--secret-refs <items>", "Comma-separated secret references")
    .option("--adapter-refs <items>", "Comma-separated future adapter references")
    .option("--related-artifacts <items>", "Comma-separated related workflows, stories or features")
    .option("--yes", "Skip confirmation and use resolved values")
    .action(async (name, options) => {
      showIntro("looply integrations");
      await runIntegrationQuestionnaire({
        mode: "configure",
        targetRoot: path.resolve(options.dir ?? process.cwd()),
        nameOption: name,
        categoryOption: options.category,
        ownerOption: options.owner,
        statusOption: options.status,
        coverageOption: options.coverage,
        purposeOption: options.purpose,
        touchpointsOption: options.touchpoints,
        envRefsOption: options.envRefs,
        secretRefsOption: options.secretRefs,
        adapterRefsOption: options.adapterRefs,
        relatedArtifactsOption: options.relatedArtifacts,
        yes: options.yes
      });
    });
}

interface IntegrationQuestionnaireInput {
  mode: "add" | "configure";
  targetRoot: string;
  nameOption?: string;
  categoryOption?: string;
  ownerOption?: string;
  statusOption?: string;
  coverageOption?: string;
  purposeOption?: string;
  touchpointsOption?: string;
  envRefsOption?: string;
  secretRefsOption?: string;
  adapterRefsOption?: string;
  relatedArtifactsOption?: string;
  yes?: boolean;
}

async function runIntegrationQuestionnaire(input: IntegrationQuestionnaireInput): Promise<void> {
  const current = input.mode === "configure" && input.nameOption
    ? await readIntegrationContext(input.targetRoot, input.nameOption)
    : null;

  if (input.mode === "configure" && !current) {
    showOutro(`Integration ${input.nameOption} was not found in ${input.targetRoot}`);
    process.exitCode = 1;
    return;
  }

  const resolvedName = await resolveName(
    input.nameOption ?? (input.yes ? current?.frontmatter.name : undefined),
    current
  );
  if (!resolvedName) {
    return;
  }

  const resolvedCategory = await resolveCategory(
    input.categoryOption ?? (input.yes ? current?.frontmatter.category : undefined),
    current
  );
  if (!resolvedCategory) {
    return;
  }
  const resolvedOwner = await resolveTextField(
    "Who owns this integration?",
    input.ownerOption ?? (input.yes ? current?.frontmatter.owner : undefined),
    current?.frontmatter.owner ?? ""
  );
  if (resolvedOwner === undefined) {
    return;
  }
  const resolvedStatus = await resolveStatus(
    input.statusOption ?? (input.yes ? current?.frontmatter.status : undefined),
    current
  );
  if (!resolvedStatus) {
    return;
  }
  const resolvedCoverage = await resolveCoverage(
    input.coverageOption ?? (input.yes ? current?.frontmatter.coverage : undefined),
    current
  );
  if (!resolvedCoverage) {
    return;
  }
  const resolvedPurpose = await resolveTextField(
    "What is the purpose of this integration?",
    input.purposeOption ?? (input.yes ? extractPurpose(current) : undefined),
    extractPurpose(current)
  );
  if (resolvedPurpose === undefined) {
    return;
  }
  const touchpoints = await resolveListField(
    "Which codebase touchpoints matter?",
    input.touchpointsOption ?? (input.yes ? (current?.frontmatter.touchpoints ?? []).join(", ") : undefined),
    current?.frontmatter.touchpoints ?? []
  );
  if (!touchpoints) {
    return;
  }
  const envRefs = await resolveListField(
    "Which environment references matter?",
    input.envRefsOption ?? (input.yes ? (current?.frontmatter.env_refs ?? []).join(", ") : undefined),
    current?.frontmatter.env_refs ?? []
  );
  if (!envRefs) {
    return;
  }
  const secretRefs = await resolveListField(
    "Which secret references matter?",
    input.secretRefsOption ?? (input.yes ? (current?.frontmatter.secret_refs ?? []).join(", ") : undefined),
    current?.frontmatter.secret_refs ?? []
  );
  if (!secretRefs) {
    return;
  }
  const adapterRefs = await resolveListField(
    "Which future adapter references should be tracked?",
    input.adapterRefsOption ?? (input.yes ? (current?.frontmatter.adapter_refs ?? []).join(", ") : undefined),
    current?.frontmatter.adapter_refs ?? []
  );
  if (!adapterRefs) {
    return;
  }
  const relatedArtifacts = await resolveListField(
    "Which workflows, stories or artifacts are related?",
    input.relatedArtifactsOption ?? (input.yes ? (current?.frontmatter.related_artifacts ?? []).join(", ") : undefined),
    current?.frontmatter.related_artifacts ?? []
  );
  if (!relatedArtifacts) {
    return;
  }

  const payload = {
    name: sanitizeIntegrationName(resolvedName),
    category: resolvedCategory,
    owner: resolvedOwner,
    status: resolvedStatus,
    coverage: resolvedCoverage,
    purpose: resolvedPurpose,
    touchpoints,
    envRefs,
    secretRefs,
    adapterRefs,
    relatedArtifacts
  };

  const shouldProceed = input.yes
    ? true
    : await confirmIntegrationWrite(input.mode, payload);

  if (!shouldProceed) {
    cancel("Integration update cancelled");
    return;
  }

  const result = await writeIntegrationContext({
    ...payload,
    targetRoot: input.targetRoot
  });

  showOutro(
    [
      `${input.mode === "add" ? "Created" : "Updated"} integration context: ${result.file}`,
      `Updated integrations index: ${result.indexFile}`
    ].join("\n")
  );
}

async function resolveName(currentValue: string | undefined, current?: IntegrationContextDocument | null): Promise<string | undefined> {
  if (currentValue && sanitizeIntegrationName(currentValue) !== "") {
    return sanitizeIntegrationName(currentValue);
  }

  const answer = await text({
    message: "What is the integration name?",
    placeholder: "stripe or internal-payments-api",
    initialValue: current?.frontmatter.name
  });

  if (isCancel(answer)) {
    cancel("Integration update cancelled");
    return undefined;
  }

  return sanitizeIntegrationName(String(answer));
}

async function resolveCategory(currentValue: string | undefined, current?: IntegrationContextDocument | null): Promise<string | undefined> {
  if (currentValue && currentValue.trim() !== "") {
    return currentValue.trim();
  }

  const selected = await select({
    message: "Which category best describes this integration?",
    initialValue: current?.frontmatter.category ?? "internal-api",
    options: [
      { value: "payments", label: "Payments", hint: "Payment provider or billing flow" },
      { value: "messaging", label: "Messaging", hint: "Queues, buses or async delivery" },
      { value: "auth", label: "Auth", hint: "Identity or access provider" },
      { value: "storage", label: "Storage", hint: "Blob, file or data storage" },
      { value: "internal-api", label: "Internal API", hint: "Internal service or bounded context API" },
      { value: "other", label: "Other", hint: "Custom category" }
    ]
  });

  if (isCancel(selected)) {
    cancel("Integration update cancelled");
    return undefined;
  }

  if (selected !== "other") {
    return String(selected);
  }

  const custom = await text({
    message: "Which custom category should be used?",
    placeholder: "erp or observability",
    initialValue: current?.frontmatter.category
  });

  if (isCancel(custom)) {
    cancel("Integration update cancelled");
    return undefined;
  }

  return String(custom).trim();
}

async function resolveStatus(currentValue: string | undefined, current?: IntegrationContextDocument | null): Promise<IntegrationStatus | undefined> {
  if (currentValue === "empty" || currentValue === "draft" || currentValue === "active" || currentValue === "stale") {
    return currentValue;
  }

  const answer = await select({
    message: "What is the current status of this integration context?",
    initialValue: current?.frontmatter.status ?? "draft",
    options: [
      { value: "draft", label: "Draft", hint: "Needs validation against the codebase" },
      { value: "active", label: "Active", hint: "Usable as a strong accelerator" },
      { value: "stale", label: "Stale", hint: "Known but needs refresh" },
      { value: "empty", label: "Empty", hint: "Placeholder only" }
    ]
  });

  if (isCancel(answer)) {
    cancel("Integration update cancelled");
    return undefined;
  }

  return answer as IntegrationStatus;
}

async function resolveCoverage(currentValue: string | undefined, current?: IntegrationContextDocument | null): Promise<IntegrationCoverage | undefined> {
  if (currentValue === "low" || currentValue === "medium" || currentValue === "high") {
    return currentValue;
  }

  const answer = await select({
    message: "How complete is this integration context?",
    initialValue: current?.frontmatter.coverage ?? "low",
    options: [
      { value: "low", label: "Low", hint: "Only basic operational context" },
      { value: "medium", label: "Medium", hint: "Enough for most feature work" },
      { value: "high", label: "High", hint: "Strong coverage of contracts and risks" }
    ]
  });

  if (isCancel(answer)) {
    cancel("Integration update cancelled");
    return undefined;
  }

  return answer as IntegrationCoverage;
}

async function resolveTextField(message: string, currentValue: string | undefined, fallback: string): Promise<string | undefined> {
  if (currentValue && currentValue.trim() !== "") {
    return currentValue.trim();
  }

  const answer = await text({
    message,
    initialValue: fallback
  });

  if (isCancel(answer)) {
    cancel("Integration update cancelled");
    return undefined;
  }

  return String(answer).trim();
}

async function resolveListField(message: string, currentValue: string | undefined, fallback: string[]): Promise<string[] | undefined> {
  if (currentValue && currentValue.trim() !== "") {
    return splitList(currentValue);
  }

  const answer = await text({
    message,
    placeholder: "comma,separated,values",
    initialValue: fallback.join(", ")
  });

  if (isCancel(answer)) {
    cancel("Integration update cancelled");
    return undefined;
  }

  return splitList(String(answer));
}

async function confirmIntegrationWrite(
  mode: "add" | "configure",
  input: {
    name: string;
    category: string;
    owner: string;
    status: IntegrationStatus;
    coverage: IntegrationCoverage;
  }
): Promise<boolean> {
  const answer = await confirm({
    message: `${mode === "add" ? "Create" : "Update"} integration ${chalk.cyan(input.name)} with category ${chalk.cyan(input.category)}, owner ${chalk.cyan(input.owner || "unassigned")}, status ${chalk.cyan(input.status)} and coverage ${chalk.cyan(input.coverage)}?`,
    initialValue: true
  });

  if (isCancel(answer)) {
    cancel("Integration update cancelled");
    return false;
  }

  return answer;
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

function extractPurpose(current?: IntegrationContextDocument | null): string {
  if (!current?.body) {
    return "";
  }

  const match = current.body.match(/## Purpose\s+([\s\S]*?)(\n## |\s*$)/);
  return match ? match[1].trim() : "";
}
