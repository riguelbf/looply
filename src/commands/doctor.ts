import type { Command } from "commander";
import { multiselect, isCancel, cancel } from "@clack/prompts";
import chalk from "chalk";
import path from "node:path";
import { resolveHostPublishers } from "../hosts/index.js";
import { supportedHosts, type InstallScope, type SupportedHost } from "../lib/host-publisher.js";
import { createSpinner, showIntro, showOutro } from "../ui/feedback.js";

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Inspect installation health")
    .option("--host <host>", "Target host list such as codex,claude")
    .option("--scope <scope>", "Installation scope such as project or global")
    .option("--dir <dir>", "Target directory for project scope doctor (defaults to current directory)")
    .action(async (options) => {
      showIntro("looply doctor");
      const hosts = await resolveHostOptions(options.host);
      if (!hosts) {
        return;
      }

      const scope = (options.scope ?? "project") as InstallScope;
      const targetDirectory = path.resolve(options.dir ?? process.cwd());
      const publishers = resolveHostPublishers(hosts);
      let allOk = true;

      for (const publisher of publishers) {
        const loading = createSpinner(`Inspecting ${publisher.hostName}`);
        const report = await publisher.doctor({
          host: publisher.hostName,
          scope,
          currentWorkingDirectory: targetDirectory
        });

        const ok = report.checks.every((check) => check.ok);
        allOk = allOk && ok;
        loading.stop(`Doctor checks completed for ${chalk.cyan(report.host)}`);

        for (const check of report.checks) {
          const status = check.ok ? chalk.green("ok") : chalk.red("missing");
          console.log(`${status} ${publisher.hostName} ${check.label} ${chalk.dim(`(${check.details})`)}`);
          if (!check.ok && check.recommendation) {
            console.log(chalk.dim(`  fix: ${check.recommendation}`));
          }
        }

        console.log(chalk.dim(`target: ${report.targetRoot}`));
      }

      if (!allOk) {
        process.exitCode = 1;
        showOutro("Doctor found installation issues");
        return;
      }

      showOutro("Doctor checks passed");
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
    message: "Which hosts should be inspected?",
    required: true,
    options: [
      { value: "codex", label: "Codex" },
      { value: "claude", label: "Claude Code" }
    ],
    initialValues: ["codex"]
  });

  if (isCancel(answer)) {
    cancel("Doctor cancelled");
    return undefined;
  }

  return answer as SupportedHost[];
}
