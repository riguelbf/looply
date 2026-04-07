import path from "node:path";
import type { Command } from "commander";
import chalk from "chalk";
import { validateWorkspace } from "../validation/validate-packs.js";
import {
  runHarnessValidation,
  writeHarnessReport,
  type HarnessFinding,
  type HarnessReport
} from "../lib/harness-validation.js";
import { readInstallManifestFromTarget } from "../lib/manifest.js";
import { supportedHosts, type SupportedHost } from "../lib/host-publisher.js";
import { resolveLooplySourceRoot } from "../lib/source-root.js";
import { createSpinner, showIntro, showOutro } from "../ui/feedback.js";

export function registerValidateCommand(program: Command): void {
  program
    .command("validate")
    .description("Validate packs, references and contracts")
    .option("--source-root <dir>", "looply source directory that contains packs/")
    .option("--harness", "Also validate the installed harness in the target project")
    .option("--dir <dir>", "Target project directory for --harness (defaults to current directory)")
    .option("--host <host>", "Host to validate the harness against (codex or claude)")
    .action(async (options) => {
      showIntro("looply validate");
      const sourceRoot = resolveLooplySourceRoot(options.sourceRoot);
      const loading = createSpinner("Validating markdown artifacts");
      const report = await validateWorkspace(sourceRoot);

      if (report.ok) {
        loading.stop("All packs validated successfully");
      } else {
        loading.stop("Validation finished with errors");
      }

      for (const warning of report.warnings) {
        console.log(`${chalk.yellow("warn")} ${warning.file} ${chalk.dim(warning.message)}`);
      }

      for (const error of report.errors) {
        console.log(`${chalk.red("error")} ${error.file} ${chalk.dim(error.message)}`);
      }

      let harnessOk = true;

      if (options.harness) {
        const targetRoot = path.resolve(options.dir ?? process.cwd());
        const host = await resolveHarnessHost(targetRoot, options.host);
        if (!host) {
          console.log(chalk.red("error") + " harness " + chalk.dim(`No host installed at ${targetRoot}. Run 'looply install' first or pass --host.`));
          harnessOk = false;
        } else {
          const harnessLoading = createSpinner(`Validating harness for ${host}`);
          try {
            const harnessReport = await runHarnessValidation({ targetRoot, sourceRoot, host });
            const file = await writeHarnessReport(harnessReport);
            harnessLoading.stop(`Harness report written to ${path.relative(targetRoot, file)}`);
            printHarnessReport(harnessReport);
            if (!harnessReport.ok) {
              harnessOk = false;
            }
          } catch (error) {
            harnessLoading.stop("Harness validation failed");
            console.log(chalk.red("error") + " harness " + chalk.dim((error as Error).message));
            harnessOk = false;
          }
        }
      }

      if (!report.ok || !harnessOk) {
        process.exitCode = 1;
        const total = report.errors.length + (harnessOk ? 0 : 1);
        showOutro(`Validation failed with ${total} error(s)`);
        return;
      }

      showOutro("Validation passed");
    });
}

async function resolveHarnessHost(targetRoot: string, explicitHost?: string): Promise<SupportedHost | null> {
  if (explicitHost) {
    return supportedHosts.includes(explicitHost as SupportedHost) ? (explicitHost as SupportedHost) : null;
  }

  const manifest = await readInstallManifestFromTarget(targetRoot);
  if (!manifest || manifest.installs.length === 0) {
    return null;
  }

  const installedHosts = Array.from(new Set(manifest.installs.map((entry) => entry.host))) as SupportedHost[];
  if (installedHosts.length === 1) {
    return installedHosts[0];
  }

  return null;
}

function printHarnessReport(report: HarnessReport): void {
  const statusLabel = report.ok ? chalk.green("ok") : chalk.red("blocking");
  console.log(`${chalk.bold("harness")} ${statusLabel} host=${report.host} pack=${report.pack}`);
  console.log(
    chalk.dim(
      `  metrics: ~${report.metrics.harnessTokensEstimate} tokens vs budget '${report.metrics.budgetHint}' (~${report.metrics.budgetTokensHint} tokens)`
    )
  );

  if (report.findings.length === 0) {
    console.log(chalk.dim("  findings: none"));
    return;
  }

  for (const finding of report.findings) {
    console.log(`  ${renderSeverity(finding)} ${finding.check} ${chalk.dim(finding.message)}`);
    if (finding.detail) {
      console.log(chalk.dim(`    ${finding.detail}`));
    }
  }
}

function renderSeverity(finding: HarnessFinding): string {
  switch (finding.severity) {
    case "error":
      return chalk.red("error");
    case "warn":
      return chalk.yellow("warn");
    case "info":
      return chalk.cyan("info");
  }
}
