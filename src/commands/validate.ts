import type { Command } from "commander";
import chalk from "chalk";
import { validateWorkspace } from "../validation/validate-packs.js";
import { resolveLooplySourceRoot } from "../lib/source-root.js";
import { createSpinner, showIntro, showOutro } from "../ui/feedback.js";

export function registerValidateCommand(program: Command): void {
  program
    .command("validate")
    .description("Validate packs, references and contracts")
    .option("--source-root <dir>", "looply source directory that contains packs/")
    .action(async (options) => {
      showIntro("looply validate");
      const loading = createSpinner("Validating markdown artifacts");
      const report = await validateWorkspace(resolveLooplySourceRoot(options.sourceRoot));

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

      if (!report.ok) {
        process.exitCode = 1;
        showOutro(`Validation failed with ${report.errors.length} error(s)`);
        return;
      }

      showOutro("Validation passed");
    });
}
