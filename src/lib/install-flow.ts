import { cancel, confirm, isCancel, multiselect, select } from "@clack/prompts";
import chalk from "chalk";
import { resolveHostPublishers } from "../hosts/index.js";
import { detectSupportedShell, installShellCompletion } from "./cli-completion/install.js";
import { isContextPerfMode, setPerfMetadata, withPerfSpan } from "./perf/session.js";
import { detectProjectMode } from "./project-context.js";
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
  yes?: boolean;
  enableShellAutocomplete?: boolean;
}

export async function runInstallFlow(input: InstallFlowInput): Promise<boolean> {
  const availablePacks = await withPerfSpan("install-flow.list-available-packs", async () => listAvailablePacks(input.sourceRoot));

  const hosts = await withPerfSpan("install-flow.resolve-hosts", async () => resolveHostOptions(input.hostOption, input.yes));
  const scope = await withPerfSpan("install-flow.resolve-scope", async () => resolveScopeOption(input.scopeOption, input.yes));
  const pack = await withPerfSpan("install-flow.resolve-pack", async () => resolvePackOption(input.packOption, availablePacks, input.yes));
  const locale = await withPerfSpan("install-flow.resolve-locale", async () => resolveLocaleOption(input.localeOption, input.yes));
  const projectMode = await withPerfSpan("install-flow.resolve-project-mode", async () => resolveProjectModeOption(input.projectModeOption, input.currentWorkingDirectory, scope, input.yes));
  const interactionMode = await withPerfSpan("install-flow.resolve-interaction-mode", async () => resolveInteractionModeOption(input.interactionModeOption, input.yes));

  if (!hosts || !scope || !pack || !locale || !projectMode || !interactionMode) {
    return false;
  }

  setPerfMetadata("install.hostCount", hosts.length);
  setPerfMetadata("install.scope", scope);
  setPerfMetadata("install.pack", pack);
  setPerfMetadata("install.locale", locale);
  setPerfMetadata("install.projectMode", projectMode);
  setPerfMetadata("install.interactionMode", interactionMode);
  if (isContextPerfMode()) {
    setPerfMetadata("install.availablePackCount", availablePacks.length);
  }

  const publishers = resolveHostPublishers(hosts);
  const preflightOk = await withPerfSpan("install-flow.preflight-checks", async () => runPreflightChecks({
    publishers,
    scope,
    pack,
    sourceRoot: input.sourceRoot,
    currentWorkingDirectory: input.currentWorkingDirectory
  }));

  if (!preflightOk) {
    showOutro("Fix the prerequisite failures before running install again");
    process.exitCode = 1;
    return false;
  }

  const shouldProceed = input.yes
    ? true
    : await resolveConfirmation(hosts, scope, pack, locale, projectMode, interactionMode);
  if (!shouldProceed) {
    cancel("Installation cancelled");
    return false;
  }

  const installResults = [];

  for (const publisher of publishers) {
    const loading = createSpinner(`Installing ${publisher.hostName}`);
    const result = await withPerfSpan(`install-flow.publish.${publisher.hostName}`, async () => publisher.install({
      host: publisher.hostName,
      scope,
      pack,
      locale,
      projectMode,
      interactionMode,
      sourceRoot: input.sourceRoot,
      currentWorkingDirectory: input.currentWorkingDirectory
    }));

    loading.stop(
      `Installed ${chalk.cyan(result.pack)} for ${chalk.cyan(result.host)} in ${chalk.cyan(result.scope)} scope`
    );
    installResults.push(result);
  }

  const shellCompletionResult = await withPerfSpan("install-flow.enable-shell-autocomplete", async () => maybeEnableShellCompletion({
    enableShellAutocomplete: input.enableShellAutocomplete,
    yes: input.yes
  }));

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

  if (isCancel(shouldEnable) || !shouldEnable) {
    return null;
  }

  const loading = createSpinner(`Enabling ${shell} shell autocomplete`);
  const result = await installShellCompletion(shell);
  loading.stop(`Enabled ${chalk.cyan(shell)} shell autocomplete`);
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
    return ["codex", "claude"];
  }

  const answer = await multiselect({
    message: "Which hosts should receive the pack?",
    required: true,
    options: [
      { value: "codex", label: "Codex", hint: "Publishes an AGENTS.md entrypoint" },
      { value: "claude", label: "Claude Code", hint: "Publishes a CLAUDE.md entrypoint" }
    ],
    initialValues: ["codex"]
  });

  if (isCancel(answer)) {
    cancel("Installation cancelled");
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
    cancel("Installation cancelled");
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
      ? availablePacks.map((pack) => ({
          value: pack,
          label: pack,
          hint: pack === "software-delivery-suite" ? "Recommended starting pack" : pack === "engineering-base" ? "Engineering-only baseline" : undefined
        }))
      : [{ value: "software-delivery-suite", label: "software-delivery-suite", hint: "Fallback pack" }];

  const answer = await select({
    message: "Which pack should be installed?",
    options
  });

  if (isCancel(answer)) {
    cancel("Installation cancelled");
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
    cancel("Installation cancelled");
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
    cancel("Installation cancelled");
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
    cancel("Installation cancelled");
    return undefined;
  }

  return answer as InteractionMode;
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
    cancel("Installation cancelled");
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
