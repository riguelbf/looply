import { cancel, confirm, isCancel, multiselect } from "@clack/prompts";
import type { Command } from "commander";
import chalk from "chalk";
import path from "node:path";
import { resolveHostPublishers } from "../hosts/index.js";
import { readInteractionPolicyFile } from "../lib/interaction-policy.js";
import { type OutputLocale, supportedHosts, type InstallScope, type SupportedHost } from "../lib/host-publisher.js";
import { readLocaleFile } from "../lib/locale.js";
import { readInstallManifestFromTarget } from "../lib/manifest.js";
import { readProjectContextFile } from "../lib/project-context.js";
import { resolveLooplySourceRoot } from "../lib/source-root.js";
import { createSpinner, showIntro, showOutro } from "../ui/feedback.js";

export function registerReinstallCommand(program: Command): void {
  program
    .command("reinstall")
    .description("Reinstall looply for selected hosts using the current pack and locale")
    .option("--host <host>", "Target host list such as codex,claude")
    .option("--scope <scope>", "Installation scope such as project or global")
    .option("--dir <dir>", "Target directory for project scope reinstall (defaults to current directory)")
    .option("--source-root <dir>", "looply source directory that contains packs/")
    .option("--locale <locale>", "Override output locale such as pt-BR or en")
    .option("--yes", "Skip confirmation")
    .action(async (options) => {
      showIntro("looply reinstall");

      const hosts = await resolveHostOptions(options.host);
      if (!hosts) {
        return;
      }

      const scope = (options.scope ?? "project") as InstallScope;
      const targetDirectory = path.resolve(options.dir ?? process.cwd());
      const sourceRoot = resolveLooplySourceRoot(options.sourceRoot);
      const manifest = await readInstallManifestFromTarget(targetDirectory);

      if (!manifest) {
        showOutro(`No install manifest found in ${targetDirectory}`);
        process.exitCode = 1;
        return;
      }

      const storedLocale = (await readLocaleFile(targetDirectory))?.outputLocale ?? "en";
      const storedProjectMode = (await readProjectContextFile(targetDirectory))?.mode ?? "existing-project";
      const storedInteractionMode = (await readInteractionPolicyFile(targetDirectory))?.mode ?? "balanced";
      const locale = normalizeLocale(options.locale) ?? storedLocale;

      const summaries = hosts.map((host) => {
        const entry = manifest.installs.find((install) => install.host === host && install.scope === scope);
        return entry ? `${host}: ${entry.pack} (${locale})` : `${host}: not installed`;
      });

      const shouldProceed = options.yes
        ? true
        : await confirm({
            message: `Reinstall ${summaries.join(", ")}?`,
            initialValue: true
          });

      if (isCancel(shouldProceed) || !shouldProceed) {
        cancel("Reinstall cancelled");
        return;
      }

      const publishers = resolveHostPublishers(hosts);
      const results: string[] = [];

      for (const publisher of publishers) {
        const entry = manifest.installs.find((install) => install.host === publisher.hostName && install.scope === scope);
        if (!entry) {
          results.push(`${publisher.hostName}: skipped (not installed)`);
          continue;
        }

        const uninstallLoading = createSpinner(`Uninstalling ${publisher.hostName}`);
        await publisher.uninstall({
          host: publisher.hostName,
          scope,
          currentWorkingDirectory: targetDirectory
        });
        uninstallLoading.stop(`Uninstalled ${chalk.cyan(publisher.hostName)}`);

        const installLoading = createSpinner(`Reinstalling ${publisher.hostName}`);
        const installResult = await publisher.install({
          host: publisher.hostName,
          scope,
          pack: entry.pack,
          locale,
          projectMode: storedProjectMode,
          interactionMode: storedInteractionMode,
          sourceRoot,
          currentWorkingDirectory: targetDirectory
        });
        installLoading.stop(`Reinstalled ${chalk.cyan(installResult.host)} with ${chalk.cyan(installResult.pack)}`);
        results.push(`${installResult.host}: ${installResult.pack} (${locale})`);
      }

      showOutro(results.join("\n"));
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
    message: "Which hosts should be reinstalled?",
    required: true,
    options: [
      { value: "codex", label: "Codex" },
      { value: "claude", label: "Claude Code" }
    ],
    initialValues: ["codex"]
  });

  if (isCancel(answer)) {
    cancel("Reinstall cancelled");
    return undefined;
  }

  return answer as SupportedHost[];
}

function normalizeLocale(value: string | undefined): OutputLocale | undefined {
  if (value === "pt-BR" || value === "en") {
    return value;
  }

  return undefined;
}
