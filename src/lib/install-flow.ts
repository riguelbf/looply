import { cancel, confirm, isCancel, multiselect, select } from "@clack/prompts";
import chalk from "chalk";
import { resolveHostPublishers } from "../hosts/index.js";
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
}

export async function runInstallFlow(input: InstallFlowInput): Promise<boolean> {
  const availablePacks = await listAvailablePacks(input.sourceRoot);

  const hosts = await resolveHostOptions(input.hostOption);
  const scope = await resolveScopeOption(input.scopeOption);
  const pack = await resolvePackOption(input.packOption, availablePacks);
  const locale = await resolveLocaleOption(input.localeOption);
  const projectMode = await resolveProjectModeOption(input.projectModeOption, input.currentWorkingDirectory, scope);
  const interactionMode = await resolveInteractionModeOption(input.interactionModeOption);

  if (!hosts || !scope || !pack || !locale || !projectMode || !interactionMode) {
    return false;
  }

  const publishers = resolveHostPublishers(hosts);
  const preflightOk = await runPreflightChecks({
    publishers,
    scope,
    pack,
    sourceRoot: input.sourceRoot,
    currentWorkingDirectory: input.currentWorkingDirectory
  });

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
    const result = await publisher.install({
      host: publisher.hostName,
      scope,
      pack,
      locale,
      projectMode,
      interactionMode,
      sourceRoot: input.sourceRoot,
      currentWorkingDirectory: input.currentWorkingDirectory
    });

    loading.stop(
      `Installed ${chalk.cyan(result.pack)} for ${chalk.cyan(result.host)} in ${chalk.cyan(result.scope)} scope`
    );
    installResults.push(result);
  }

  showOutro(
    installResults
      .map((result) => `${result.host}: ${result.entrypointFile}`)
      .concat(installResults.map((result) => `${result.host} playbook: ${result.workflowPlaybookFile}`))
      .concat(installResults.map((result) => `${result.host} hints: ${result.executionHintsFile}`))
      .concat(installResults.map((result) => `${result.host} locale: ${result.localeFile}`))
      .concat(installResults.map((result) => `${result.host} project context: ${result.projectContextFile}`))
      .concat(installResults.map((result) => `${result.host} interaction policy: ${result.interactionPolicyFile}`))
      .join("\n")
  );

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

async function resolveScopeOption(currentScope?: string): Promise<InstallScope | undefined> {
  if (currentScope === "project" || currentScope === "global") {
    return currentScope;
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

async function resolvePackOption(currentPack: string | undefined, availablePacks: string[]): Promise<string | undefined> {
  if (currentPack) {
    return currentPack;
  }

  const options =
    availablePacks.length > 0
      ? availablePacks.map((pack) => ({
          value: pack,
          label: pack,
          hint: pack === "engineering-base" ? "Recommended starting pack" : undefined
        }))
      : [{ value: "engineering-base", label: "engineering-base", hint: "Fallback pack" }];

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

async function resolveLocaleOption(currentLocale?: string): Promise<OutputLocale | undefined> {
  if (currentLocale === "en" || currentLocale === "pt-BR") {
    return currentLocale;
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
  scope: InstallScope | undefined
): Promise<ProjectMode | undefined> {
  if (currentProjectMode === "existing-project" || currentProjectMode === "greenfield") {
    return currentProjectMode;
  }

  const detectedMode = scope === "project" ? detectProjectMode(currentWorkingDirectory) : "existing-project";
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

async function resolveInteractionModeOption(currentInteractionMode?: string): Promise<InteractionMode | undefined> {
  if (currentInteractionMode === "guided" || currentInteractionMode === "balanced" || currentInteractionMode === "autonomous") {
    return currentInteractionMode;
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
