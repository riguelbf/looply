import { cancel, confirm, isCancel, multiselect } from "@clack/prompts";
import chalk from "chalk";
import path from "node:path";
import { resolveHostPublishers } from "../hosts/index.js";
import { createSpinner, showOutro } from "../ui/feedback.js";
import type { HostPublisher, InstallScope, SupportedHost } from "./host-publisher.js";
import { supportedHosts } from "./host-publisher.js";
import { resolveLooplySourceRoot } from "./source-root.js";
import { appendUpgradeHistory } from "./upgrade-history.js";

export interface UpdateFlowInput {
  sourceRootOverride?: string;
  currentWorkingDirectory: string;
  hostOption?: string;
  scopeOption?: string;
  targetDirectoryOption?: string;
  yes?: boolean;
  applyUpdates: boolean;
  actionLabel: "sync" | "upgrade" | "check-updates";
}

export async function runUpdateFlow(input: UpdateFlowInput): Promise<boolean> {
  const hosts = await resolveHostOptions(input.hostOption);
  if (!hosts) {
    return false;
  }

  const scope = input.scopeOption === "global" ? "global" : "project";
  const sourceRoot = resolveLooplySourceRoot(input.sourceRootOverride);
  const targetDirectory = path.resolve(input.targetDirectoryOption ?? input.currentWorkingDirectory);
  const publishers = resolveHostPublishers(hosts);
  const plans = [];

  for (const publisher of publishers) {
    const loading = createSpinner(`Checking updates for ${publisher.hostName}`);
    const plan = await publisher.planSync({
      host: publisher.hostName,
      scope,
      sourceRoot,
      currentWorkingDirectory: targetDirectory
    });
    loading.stop(
      plan.hasUpdates
        ? `Updates available for ${chalk.cyan(plan.host)}`
        : `No updates for ${chalk.cyan(plan.host)}`
    );
    printOverview(plan);
    printSemanticOverview(plan);
    plans.push({ publisher, plan });
  }

  const plansWithUpdates = plans.filter((item) => item.plan.hasUpdates);
  if (plansWithUpdates.length === 0) {
    showOutro("All selected hosts are up to date");
    return true;
  }

  if (!input.applyUpdates) {
    showOutro(`Updates available for ${plansWithUpdates.map((item) => item.plan.host).join(", ")}`);
    return true;
  }

  const shouldUpdate = input.yes
    ? true
    : await confirm({
        message: `Apply updates for ${plansWithUpdates.map((item) => item.plan.host).join(", ")}?`,
        initialValue: true
      });

  if (isCancel(shouldUpdate) || !shouldUpdate) {
    cancel(`${input.actionLabel} cancelled`);
    return false;
  }

  for (const { publisher } of plansWithUpdates) {
    const loading = createSpinner(`Synchronizing ${publisher.hostName}`);
    const result = await publisher.sync({
      host: publisher.hostName,
      scope,
      sourceRoot,
      currentWorkingDirectory: targetDirectory
    });
    loading.stop(`Synchronized ${chalk.cyan(result.pack)} for ${chalk.cyan(result.host)}`);
    printResultOverview(result);
    const historyFile = await appendUpgradeHistory({
      targetRoot: result.targetRoot,
      entry: {
        timestamp: new Date().toISOString(),
        action: input.actionLabel === "upgrade" ? "upgrade" : "sync",
        host: result.host,
        scope: result.scope,
        pack: result.pack,
        targetRoot: result.targetRoot,
        summary: {
          addedFiles: result.addedFiles,
          changedFiles: result.changedFiles,
          removedFiles: result.removedFiles,
          impacts: summarizeImpact(result),
          artifactChanges: summarizeArtifactChanges(result)
        }
      }
    });
    console.log(chalk.dim(`history: ${historyFile}`));
  }

  showOutro(`${input.actionLabel} completed for ${hosts.join(", ")}`);
  return true;
}

async function resolveHostOptions(currentHost?: string): Promise<SupportedHost[] | undefined> {
  if (currentHost) {
    return currentHost
      .split(",")
      .map((item) => item.trim())
      .filter((item): item is SupportedHost => supportedHosts.includes(item as SupportedHost));
  }

  const answer = await multiselect({
    message: "Which hosts should be checked?",
    required: true,
    options: [
      { value: "codex", label: "Codex" },
      { value: "claude", label: "Claude Code" }
    ],
    initialValues: ["codex"]
  });

  if (isCancel(answer)) {
    cancel("Update check cancelled");
    return undefined;
  }

  return answer as SupportedHost[];
}

function printOverview(plan: {
  host: string;
  addedFiles: string[];
  changedFiles: string[];
  removedFiles: string[];
}): void {
  const overview = [
    ...plan.addedFiles.map((file) => `${chalk.green("add")} ${plan.host} ${file}`),
    ...plan.changedFiles.map((file) => `${chalk.yellow("chg")} ${plan.host} ${file}`),
    ...plan.removedFiles.map((file) => `${chalk.red("del")} ${plan.host} ${file}`)
  ];

  if (overview.length === 0) {
    console.log(chalk.dim(`up-to-date ${plan.host}`));
    return;
  }

  for (const line of overview) {
    console.log(line);
  }
}

function printResultOverview(result: {
  host: string;
  addedFiles: string[];
  changedFiles: string[];
  removedFiles: string[];
}): void {
  printOverview(result);
  printSemanticOverview(result);
}

function printSemanticOverview(plan: {
  host: string;
  addedFiles: string[];
  changedFiles: string[];
  removedFiles: string[];
}): void {
  const impactSummary = summarizeImpact(plan);
  const summary = summarizeArtifactChanges(plan);
  if (impactSummary.length === 0 && summary.length === 0) {
    return;
  }

  console.log(chalk.bold(`overview ${plan.host}`));
  for (const line of impactSummary) {
    console.log(`${chalk.dim("-")} impact: ${line}`);
  }
  for (const line of summary) {
    console.log(`${chalk.dim("-")} ${line}`);
  }
}

function summarizeArtifactChanges(plan: {
  host: string;
  addedFiles: string[];
  changedFiles: string[];
  removedFiles: string[];
}): string[] {
  const groups = new Map<string, Set<string>>();

  for (const file of plan.addedFiles) {
    collectChange(groups, "added", file);
  }

  for (const file of plan.changedFiles) {
    collectChange(groups, "changed", file);
  }

  for (const file of plan.removedFiles) {
    collectChange(groups, "removed", file);
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, values]) => {
      const [operation, artifactType] = key.split(":");
      const label = `${operation} ${pluralizeArtifactType(artifactType, values.size)}`;
      return `${label}: ${Array.from(values).sort().join(", ")}`;
    });
}

function collectChange(groups: Map<string, Set<string>>, operation: "added" | "changed" | "removed", file: string): void {
  const parsed = parseArtifactFile(file);
  const key = `${operation}:${parsed.type}`;
  if (!groups.has(key)) {
    groups.set(key, new Set());
  }

  groups.get(key)?.add(parsed.name);
}

function parseArtifactFile(file: string): { type: string; name: string } {
  const normalized = file.replaceAll("\\", "/");
  const segments = normalized.split("/");
  const filename = segments.at(-1) ?? normalized;

  if (filename === "pack.md") {
    return { type: "pack", name: "pack" };
  }

  const directory = segments[0] ?? "";
  const typeMap: Record<string, string> = {
    agents: "agent",
    tasks: "task",
    workflows: "workflow",
    templates: "template",
    knowledge: "knowledge item",
    checklists: "checklist"
  };

  const type = typeMap[directory] ?? "file";
  const name = filename.endsWith(".md") ? filename.slice(0, -3) : filename;
  return { type, name };
}

function pluralizeArtifactType(type: string, count: number): string {
  if (count === 1) {
    return type;
  }

  switch (type) {
    case "knowledge item":
      return "knowledge items";
    default:
      return `${type}s`;
  }
}

function summarizeImpact(plan: {
  host: string;
  addedFiles: string[];
  changedFiles: string[];
  removedFiles: string[];
}): string[] {
  const impacts = new Set<string>();

  for (const file of plan.addedFiles) {
    impactsForFile("added", file).forEach((impact) => impacts.add(impact));
  }

  for (const file of plan.changedFiles) {
    impactsForFile("changed", file).forEach((impact) => impacts.add(impact));
  }

  for (const file of plan.removedFiles) {
    impactsForFile("removed", file).forEach((impact) => impacts.add(impact));
  }

  return Array.from(impacts)
    .sort((left, right) => left.localeCompare(right));
}

function impactsForFile(operation: "added" | "changed" | "removed", file: string): string[] {
  const normalized = file.replaceAll("\\", "/");
  const parsed = parseArtifactFile(file);
  const operationLabel =
    operation === "added" ? "added" :
    operation === "removed" ? "removed" :
    "updated";

  if (matchesArtifactDirectory(normalized, "workflows")) {
    return [`${capitalize(parsed.name)} workflow ${operationLabel}`];
  }

  if (matchesArtifactDirectory(normalized, "tasks")) {
    return [`${capitalize(parsed.name)} task ${operationLabel}`];
  }

  if (matchesArtifactDirectory(normalized, "agents")) {
    return [`${capitalize(parsed.name)} agent instructions ${operationLabel}`];
  }

  if (matchesArtifactDirectory(normalized, "templates")) {
    return [`${capitalize(parsed.name)} template ${operationLabel}`];
  }

  if (matchesArtifactDirectory(normalized, "checklists")) {
    return [`${capitalize(parsed.name)} checklist ${operationLabel}`];
  }

  if (matchesArtifactDirectory(normalized, "knowledge")) {
    return [`${capitalize(parsed.name)} knowledge ${operationLabel}`];
  }

  if (normalized.includes("/commands/codex/") || normalized.startsWith("commands/codex/")) {
    return ["Codex slash-command guidance updated"];
  }

  if (normalized.includes("/.claude/commands/") || normalized.startsWith(".claude/commands/")) {
    return ["Claude command guidance updated"];
  }

  if (normalized.endsWith("AGENTS.md")) {
    return ["Codex entrypoint instructions updated"];
  }

  if (normalized.endsWith("CLAUDE.md")) {
    return ["Claude entrypoint instructions updated"];
  }

  if (normalized.includes("workflow-playbook.")) {
    return [`${capitalize(planHostFromFile(normalized) ?? "host")} workflow playbook updated`];
  }

  if (normalized.includes("execution-hints.")) {
    return [`${capitalize(planHostFromFile(normalized) ?? "host")} execution hints updated`];
  }

  if (normalized.endsWith("/pack.md")) {
    return ["Pack definition updated"];
  }

  return [];
}

function matchesArtifactDirectory(file: string, directory: string): boolean {
  return file.includes(`/${directory}/`) || file.startsWith(`${directory}/`);
}

function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function planHostFromFile(file: string): string | null {
  if (file.includes(".codex.")) {
    return "codex";
  }

  if (file.includes(".claude.")) {
    return "claude";
  }

  return null;
}
