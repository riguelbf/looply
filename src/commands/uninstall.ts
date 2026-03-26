import { cancel, confirm, isCancel, multiselect } from "@clack/prompts";
import type { Command } from "commander";
import chalk from "chalk";
import path from "node:path";
import { resolveHostPublishers } from "../hosts/index.js";
import { supportedHosts, type InstallScope, type SupportedHost } from "../lib/host-publisher.js";
import { createSpinner, showIntro, showOutro } from "../ui/feedback.js";

export function registerUninstallCommand(program: Command): void {
  program
    .command("uninstall")
    .description("Remove looply files for one or more installed hosts")
    .option("--host <host>", "Target host list such as codex,claude")
    .option("--scope <scope>", "Installation scope such as project or global")
    .option("--dir <dir>", "Target directory for project scope uninstall (defaults to current directory)")
    .option("--yes", "Skip confirmation")
    .action(async (options) => {
      showIntro("looply uninstall");

      const hosts = await resolveHostOptions(options.host);
      if (!hosts) {
        return;
      }

      const scope = (options.scope ?? "project") as InstallScope;
      const targetDirectory = path.resolve(options.dir ?? process.cwd());
      const publishers = resolveHostPublishers(hosts);

      const shouldProceed = options.yes
        ? true
        : await confirm({
            message: `Uninstall looply from ${hosts.join(", ")} in ${chalk.cyan(scope)} scope?`,
            initialValue: false
          });

      if (isCancel(shouldProceed) || !shouldProceed) {
        cancel("Uninstall cancelled");
        return;
      }

      const summaries: string[] = [];

      for (const publisher of publishers) {
        const loading = createSpinner(`Uninstalling ${publisher.hostName}`);
        const result = await publisher.uninstall({
          host: publisher.hostName,
          scope,
          currentWorkingDirectory: targetDirectory
        });
        loading.stop(`Uninstalled ${chalk.cyan(result.host)} from ${chalk.cyan(result.scope)} scope`);
        summaries.push(
          `${result.host}: removed ${result.removedFiles.length} file(s), remaining installs ${result.remainingInstalls}`
        );
      }

      showOutro(summaries.join("\n"));
    });
}

async function resolveHostOptions(currentHost?: string): Promise<SupportedHost[] | undefined> {
  if (currentHost) {
    return currentHost
      .split(",")
      .map((item) => item.trim())
      .filter((item): item is SupportedHost => supportedHosts.includes(item as SupportedHost));
  }

  const answer = await multiselect({
    message: "Which hosts should be uninstalled?",
    required: true,
    options: [
      { value: "codex", label: "Codex" },
      { value: "claude", label: "Claude Code" }
    ],
    initialValues: ["codex"]
  });

  if (isCancel(answer)) {
    cancel("Uninstall cancelled");
    return undefined;
  }

  return answer as SupportedHost[];
}
