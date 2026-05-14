import path from "node:path";
import { cancel, confirm, isCancel, multiselect, select, text } from "@clack/prompts";
import chalk from "chalk";
import fs from "fs-extra";
import { resolveHostPublishers } from "../hosts/index.js";
import { detectSupportedShell, installShellCompletion } from "./cli-completion/install.js";
import { isContextPerfMode, setPerfMetadata, withPerfSpan } from "./perf/session.js";
import { detectProjectMode } from "./project-context.js";
import { refreshCodeContext } from "./code-context/manager.js";
import type {
  HostPublisher,
  InstallScope,
  InteractionMode,
  OutputLocale,
  ProjectMode,
  SupportedHost
} from "./host-publisher.js";
import { supportedHosts } from "./host-publisher.js";
import { listAvailablePacks } from "./packs.js";
import { ruleCategories, ruleCategoryLabels, type RuleCategory, type RuleFile } from "./rule-documents.js";
import { createSpinner, showOutro } from "../ui/feedback.js";

export interface InstallFlowInput {
  sourceRoot: string;
  currentWorkingDirectory: string;
  hostOption?: string;
  scopeOption?: string;
  packOption?: string;
  localeOption?: string;
  projectModeOption?: string;
  interactionModeOption?: string;
  rules?: RuleFile[];
  yes?: boolean;
  enableShellAutocomplete?: boolean;
}

class InstallCancelledError extends Error {
  constructor() {
    super("Installation cancelled by user");
    this.name = "InstallCancelledError";
  }
}

export async function runInstallFlow(input: InstallFlowInput): Promise<boolean> {
  try {
    return await runInstallFlowUnchecked(input);
  } catch (error) {
    if (error instanceof InstallCancelledError) {
      cancel("Installation cancelled");
      return false;
    }
    throw error;
  }
}

async function runInstallFlowUnchecked(input: InstallFlowInput): Promise<boolean> {
  const availablePacks = await withPerfSpan("install-flow.list-available-packs", async () => listAvailablePacks(input.sourceRoot));

  const hosts = await withPerfSpan("install-flow.resolve-hosts", async () => resolveHostOptionsOrThrow(input.hostOption, input.yes));
  const scope = await withPerfSpan("install-flow.resolve-scope", async () => resolveScopeOptionOrThrow(input.scopeOption, input.yes));
  const pack = await withPerfSpan("install-flow.resolve-pack", async () => resolvePackOptionOrThrow(input.packOption, availablePacks, input.yes));
  const locale = await withPerfSpan("install-flow.resolve-locale", async () => resolveLocaleOptionOrThrow(input.localeOption, input.yes));
  const projectMode = await withPerfSpan("install-flow.resolve-project-mode", async () => resolveProjectModeOptionOrThrow(input.projectModeOption, input.currentWorkingDirectory, scope, input.yes));
  const interactionMode = await withPerfSpan("install-flow.resolve-interaction-mode", async () => resolveInteractionModeOptionOrThrow(input.interactionModeOption, input.yes));

  const resolvedPacks = pack === "all" ? availablePacks : [pack];

  const rules = await resolveRulesOptionsOrThrow(input.rules, input.yes, input.sourceRoot, resolvedPacks);

  setPerfMetadata("install.hostCount", hosts.length);
  setPerfMetadata("install.scope", scope);
  setPerfMetadata("install.pack", resolvedPacks.join(","));
  setPerfMetadata("install.locale", locale);
  setPerfMetadata("install.projectMode", projectMode);
  setPerfMetadata("install.interactionMode", interactionMode);
  if (isContextPerfMode()) {
    setPerfMetadata("install.availablePackCount", availablePacks.length);
  }

  const publishers = resolveHostPublishers(hosts);
  const firstPack = resolvedPacks[0];
  const preflightOk = await withPerfSpan("install-flow.preflight-checks", async () => runPreflightChecks({
    publishers,
    scope,
    pack: firstPack,
    sourceRoot: input.sourceRoot,
    currentWorkingDirectory: input.currentWorkingDirectory
  }));

  if (!preflightOk) {
    showOutro("Fix the prerequisite failures before running install again");
    process.exitCode = 1;
    return false;
  }

  if (!input.yes) {
    const confirmed = await resolveConfirmation(hosts, scope, resolvedPacks.join(", "), locale, projectMode, interactionMode);
    if (!confirmed) throw new InstallCancelledError();
  }

  const installResults = [];

  for (const publisher of publishers) {
    for (const installPack of resolvedPacks) {
      const loading = createSpinner(`Installing ${publisher.hostName}/${installPack}`);
      const result = await withPerfSpan(`install-flow.publish.${publisher.hostName}.${installPack}`, async () => publisher.install({
        host: publisher.hostName,
        scope,
        pack: installPack,
        locale,
        projectMode,
        interactionMode,
        sourceRoot: input.sourceRoot,
        currentWorkingDirectory: input.currentWorkingDirectory,
        rules: rules.map((r) => ({ category: r.category, content: r.content }))
      }));

      loading.stop(
        `Installed ${chalk.cyan(result.pack)} for ${chalk.cyan(result.host)} in ${chalk.cyan(result.scope)} scope`
      );
      installResults.push(result);
    }
  }

  const shellCompletionResult = await withPerfSpan("install-flow.enable-shell-autocomplete", async () => maybeEnableShellCompletion({
    enableShellAutocomplete: input.enableShellAutocomplete,
    yes: input.yes
  }));

  const codeContextFile = await withPerfSpan("install-flow.maybe-refresh-code-context", async () =>
    maybeRefreshCodeContext({
      projectMode,
      targetRoot: input.currentWorkingDirectory,
      yes: input.yes
    })
  );

  showOutro(
    installResults
      .map((result) => `${result.host}: ${result.entrypointFile}`)
      .concat(installResults.map((result) => `${result.host} playbook: ${result.workflowPlaybookFile}`))
      .concat(installResults.map((result) => `${result.host} hints: ${result.executionHintsFile}`))
      .concat(installResults.map((result) => `${result.host} locale: ${result.localeFile}`))
      .concat(installResults.map((result) => `${result.host} project context: ${result.projectContextFile}`))
      .concat(installResults.map((result) => `${result.host} interaction policy: ${result.interactionPolicyFile}`))
      .concat(shellCompletionResult
        ? [
            `shell completion: ${shellCompletionResult.completionFile}`,
            `shell rc file: ${shellCompletionResult.rcFile}${shellCompletionResult.changedRcFile ? " (updated)" : " (already configured)"}`
          ]
        : [])
      .concat(codeContextFile
        ? [`code context: ${codeContextFile.codeContextFile}`, `knowledge graph: ${codeContextFile.knowledgeGraphFile}`]
        : [])
      .join("\n")
  );

  return true;
}

async function maybeEnableShellCompletion(input: {
  enableShellAutocomplete?: boolean;
  yes?: boolean;
}) {
  const shell = detectSupportedShell();
  if (!shell) {
    return null;
  }

  const shouldEnable = typeof input.enableShellAutocomplete === "boolean"
    ? input.enableShellAutocomplete
    : input.yes
      ? true
      : await confirm({
          message: `Enable shell autocomplete for ${chalk.cyan(shell)}?`,
          initialValue: true
        });

  if (isCancel(shouldEnable)) {
    throw new InstallCancelledError();
  }

  if (!shouldEnable) {
    return null;
  }

  const loading = createSpinner(`Enabling ${shell} shell autocomplete`);
  const result = await installShellCompletion(shell);
  loading.stop(`Enabled ${chalk.cyan(shell)} shell autocomplete`);
  return result;
}

async function maybeRefreshCodeContext(input: {
  projectMode: ProjectMode;
  targetRoot: string;
  yes?: boolean;
}): Promise<{ codeContextFile: string; knowledgeGraphFile?: string } | null> {
  if (input.projectMode !== "existing-project") {
    return null;
  }

  const shouldRefresh = input.yes
    ? false
    : await confirm({
        message: "Generate code intelligence and knowledge graph for this project?",
        initialValue: true
      });

  if (isCancel(shouldRefresh)) {
    throw new InstallCancelledError();
  }

  if (!shouldRefresh) {
    return null;
  }

  const loading = createSpinner("Analyzing project codebase and extracting knowledge graph...");
  try {
    const result = await refreshCodeContext(input.targetRoot);
    loading.stop(
      `Knowledge graph generated: ${chalk.cyan(String(result.knowledgeGraphFile ?? "skipped"))}`
    );
    return { codeContextFile: result.codeContextFile, knowledgeGraphFile: result.knowledgeGraphFile };
  } catch (error) {
    loading.stop(`Code context refresh failed: ${chalk.yellow(String(error))}`);
    return null;
  }
}

async function resolveHostOptionsOrThrow(currentHost?: string, yes?: boolean): Promise<SupportedHost[]> {
  const result = await resolveHostOptions(currentHost, yes);
  if (!result) throw new InstallCancelledError();
  return result;
}

async function resolveScopeOptionOrThrow(currentScope?: string, yes?: boolean): Promise<InstallScope> {
  const result = await resolveScopeOption(currentScope, yes);
  if (!result) throw new InstallCancelledError();
  return result;
}

async function resolvePackOptionOrThrow(currentPack: string | undefined, availablePacks: string[], yes?: boolean): Promise<string> {
  const result = await resolvePackOption(currentPack, availablePacks, yes);
  if (!result) throw new InstallCancelledError();
  return result;
}

async function resolveLocaleOptionOrThrow(currentLocale?: string, yes?: boolean): Promise<OutputLocale> {
  const result = await resolveLocaleOption(currentLocale, yes);
  if (!result) throw new InstallCancelledError();
  return result;
}

async function resolveProjectModeOptionOrThrow(
  currentProjectMode: string | undefined,
  currentWorkingDirectory: string,
  scope: InstallScope | undefined,
  yes?: boolean
): Promise<ProjectMode> {
  const result = await resolveProjectModeOption(currentProjectMode, currentWorkingDirectory, scope, yes);
  if (!result) throw new InstallCancelledError();
  return result;
}

async function resolveInteractionModeOptionOrThrow(currentInteractionMode?: string, yes?: boolean): Promise<InteractionMode> {
  const result = await resolveInteractionModeOption(currentInteractionMode, yes);
  if (!result) throw new InstallCancelledError();
  return result;
}

async function resolveRulesOptionsOrThrow(currentRules: RuleFile[] | undefined, yes?: boolean, sourceRoot?: string, packNames?: string[]): Promise<RuleFile[]> {
  const result = await resolveRulesOptions(currentRules, yes, sourceRoot, packNames);
  if (result === undefined) throw new InstallCancelledError();
  return result;
}

async function resolveHostOptions(currentHost?: string, yes?: boolean): Promise<SupportedHost[] | undefined> {
  if (currentHost) {
    return currentHost
      .split(",")
      .map((item) => item.trim())
      .filter((item): item is SupportedHost => supportedHosts.includes(item as SupportedHost));
  }

  if (yes) {
    return ["codex", "claude", "opencode"];
  }

  const answer = await multiselect({
    message: "Which hosts should receive the pack?",
    required: true,
    options: [
      { value: "codex", label: "Codex", hint: "Publishes an AGENTS.md entrypoint" },
      { value: "claude", label: "Claude Code", hint: "Publishes a CLAUDE.md entrypoint" },
      { value: "opencode", label: "OpenCode", hint: "Publishes an OPENCODE.md entrypoint" }
    ],
    initialValues: ["codex"]
  });

  if (isCancel(answer)) {
    return undefined;
  }

  return answer as SupportedHost[];
}

async function resolveScopeOption(currentScope?: string, yes?: boolean): Promise<InstallScope | undefined> {
  if (currentScope === "project" || currentScope === "global") {
    return currentScope;
  }

  if (yes) {
    return "project";
  }

  const answer = await select({
    message: "Where should looply be installed?",
    options: [
      { value: "project", label: "Project", hint: "Installs into the target repository" },
      { value: "global", label: "Global", hint: "Installs into the host home directory" }
    ]
  });

  if (isCancel(answer)) {
    return undefined;
  }

  return answer as InstallScope;
}

async function resolvePackOption(currentPack: string | undefined, availablePacks: string[], yes?: boolean): Promise<string | undefined> {
  if (currentPack) {
    return currentPack;
  }

  if (yes) {
    if (availablePacks.includes("software-delivery-suite")) {
      return "software-delivery-suite";
    }

    return availablePacks[0] ?? "software-delivery-suite";
  }

  const options =
    availablePacks.length > 0
      ? [
          { value: "all", label: "All packs", hint: "Install every available pack" },
          ...availablePacks.map((pack) => ({
            value: pack,
            label: pack,
            hint: pack === "software-delivery-suite" ? "Recommended starting pack" : pack === "engineering-base" ? "Engineering-only baseline" : undefined
          }))
        ]
      : [{ value: "software-delivery-suite", label: "software-delivery-suite", hint: "Fallback pack" }];

  const answer = await select({
    message: "Which pack should be installed?",
    options
  });

  if (isCancel(answer)) {
    return undefined;
  }

  return answer;
}

async function resolveLocaleOption(currentLocale?: string, yes?: boolean): Promise<OutputLocale | undefined> {
  if (currentLocale === "en" || currentLocale === "pt-BR") {
    return currentLocale;
  }

  if (yes) {
    return resolveDefaultLocale();
  }

  const answer = await select({
    message: "Which language should generated outputs use?",
    options: [
      { value: "pt-BR", label: "Portuguese (Brazil)", hint: "Recommended for pt-BR teams" },
      { value: "en", label: "English", hint: "Canonical template language" }
    ]
  });

  if (isCancel(answer)) {
    return undefined;
  }

  return answer as OutputLocale;
}

async function resolveProjectModeOption(
  currentProjectMode: string | undefined,
  currentWorkingDirectory: string,
  scope: InstallScope | undefined,
  yes?: boolean
): Promise<ProjectMode | undefined> {
  if (currentProjectMode === "existing-project" || currentProjectMode === "greenfield") {
    return currentProjectMode;
  }

  const detectedMode = scope === "project" ? detectProjectMode(currentWorkingDirectory) : "existing-project";
  if (yes) {
    return detectedMode;
  }

  const answer = await select({
    message: "How should looply treat this installation context?",
    initialValue: detectedMode,
    options: [
      { value: "existing-project", label: "Existing project", hint: "Use the local repository as default feature context" },
      { value: "greenfield", label: "Greenfield", hint: "Expect more explicit feature context and scaffolding" }
    ]
  });

  if (isCancel(answer)) {
    return undefined;
  }

  return answer as ProjectMode;
}

async function resolveInteractionModeOption(currentInteractionMode?: string, yes?: boolean): Promise<InteractionMode | undefined> {
  if (currentInteractionMode === "guided" || currentInteractionMode === "balanced" || currentInteractionMode === "autonomous") {
    return currentInteractionMode;
  }

  if (yes) {
    return "balanced";
  }

  const answer = await select({
    message: "How proactive should the host be during the workflow?",
    initialValue: "balanced",
    options: [
      { value: "balanced", label: "Balanced", hint: "Ask only when ambiguity or risk is meaningful" },
      { value: "autonomous", label: "Autonomous", hint: "Ask less and keep momentum by default" },
      { value: "guided", label: "Guided", hint: "Ask more often at phase transitions" }
    ]
  });

  if (isCancel(answer)) {
    return undefined;
  }

  return answer as InteractionMode;
}

async function resolveRulesOptions(currentRules: RuleFile[] | undefined, yes?: boolean, sourceRoot?: string, packNames?: string[]): Promise<RuleFile[] | undefined> {
  if (currentRules && currentRules.length > 0) {
    return currentRules;
  }

  if (yes) {
    return [];
  }

  const shouldConfigure = await confirm({
    message: "Would you like to configure project rules for agents?",
    initialValue: true
  });

  if (isCancel(shouldConfigure)) {
    return undefined;
  }

  if (!shouldConfigure) {
    return [];
  }

  const rulesMode = await select({
    message: "Which rule set should be used?",
    options: [
      { value: "standard", label: "Standard (looply defaults)", hint: "Pre-built rules from the selected packs" },
      { value: "custom", label: "Custom", hint: "Define your own rules per category" }
    ]
  });

  if (isCancel(rulesMode)) {
    return undefined;
  }

  if (rulesMode === "standard") {
    return loadStandardRules(sourceRoot ?? process.cwd(), packNames ?? []);
  }

  const selectedCategories = await multiselect({
    message: "Which rule categories apply to this project?",
    required: false,
    options: ruleCategories.map((cat) => ({
      value: cat,
      label: ruleCategoryLabels[cat].label,
      hint: ruleCategoryLabels[cat].hint
    }))
  });

  if (isCancel(selectedCategories)) {
    return undefined;
  }

  if (!selectedCategories || selectedCategories.length === 0) {
    return [];
  }

  const rules: RuleFile[] = [];

  for (const cat of selectedCategories as RuleCategory[]) {
    const content = await text({
      message: `Define rules for ${ruleCategoryLabels[cat].label}:`,
      placeholder: `Enter the rules that agents should follow for ${ruleCategoryLabels[cat].hint.toLowerCase()}. Use bullet points and imperative language (Use, Avoid, Prefer, Never).`
    });

    if (isCancel(content)) {
      return undefined;
    }

    if (content.trim()) {
      rules.push({ category: cat, content: buildRuleContent(cat, content) });
    }
  }

  return rules;
}

async function loadStandardRules(sourceRoot: string, packNames: string[]): Promise<RuleFile[]> {
  const rules: RuleFile[] = [];
  const seenCategories = new Set<string>();

  for (const packName of packNames) {
    const packRulesRoot = path.join(sourceRoot, "packs", packName, "rules");
    if (!(await fs.pathExists(packRulesRoot))) {
      continue;
    }

    for (const cat of ruleCategories) {
      if (seenCategories.has(cat)) {
        continue;
      }

      const ruleFile = path.join(packRulesRoot, `${cat}.md`);
      if (await fs.pathExists(ruleFile)) {
        const content = await fs.readFile(ruleFile, "utf8");
        rules.push({ category: cat, content });
        seenCategories.add(cat);
      }
    }
  }

  return rules;
}

function buildRuleContent(category: RuleCategory, text: string): string {
  const label = ruleCategoryLabels[category].label;
  return [
    "---",
    `schema: looply/rule@v1`,
    `name: ${category}`,
    `category: ${category}`,
    `summary: ${label} rules for this project`,
    "priority: high",
    "applies_to:",
    "  - all",
    "---",
    "",
    `# ${label}`,
    "",
    "## Rules",
    "",
    text,
    "",
    "## Notes",
    "",
    "- Update this file when project conventions change.",
    "- Agents read these rules before producing outputs.",
    "- Rules are procedural: treat them as constraints, not as optional hints."
  ].join("\n");
}

async function resolveConfirmation(
  hosts: SupportedHost[],
  scope: InstallScope,
  pack: string,
  locale: OutputLocale,
  projectMode: ProjectMode,
  interactionMode: InteractionMode
): Promise<boolean> {
  const hostSummary = hosts.join(", ");
  const answer = await confirm({
    message: `Install ${chalk.cyan(pack)} on ${chalk.cyan(hostSummary)} in ${chalk.cyan(scope)} scope with locale ${chalk.cyan(locale)}, project mode ${chalk.cyan(projectMode)} and interaction mode ${chalk.cyan(interactionMode)}?`,
    initialValue: true
  });

  if (isCancel(answer)) {
    return false;
  }

  return answer;
}

function resolveDefaultLocale(): OutputLocale {
  const language = process.env.LANG?.toLowerCase() ?? "";
  return language.includes("pt") ? "pt-BR" : "en";
}

async function runPreflightChecks(input: {
  publishers: HostPublisher[];
  scope: InstallScope;
  pack: string;
  sourceRoot: string;
  currentWorkingDirectory: string;
}): Promise<boolean> {
  let allOk = true;

  for (const publisher of input.publishers) {
    const preflightLoading = createSpinner(`Checking prerequisites for ${publisher.hostName}`);
    const preflight = await publisher.preflight({
      host: publisher.hostName,
      scope: input.scope,
      pack: input.pack,
      sourceRoot: input.sourceRoot,
      currentWorkingDirectory: input.currentWorkingDirectory
    });
    const ok = preflight.checks.every((check) => check.ok);
    preflightLoading.stop(ok ? `Prerequisites satisfied for ${publisher.hostName}` : `Prerequisites failed for ${publisher.hostName}`);

    for (const check of preflight.checks) {
      const status = check.ok ? chalk.green("ok") : chalk.red("missing");
      console.log(`${status} ${publisher.hostName} ${check.label} ${chalk.dim(`(${check.details})`)}`);
    }

    allOk = allOk && ok;
  }

  return allOk;
}
