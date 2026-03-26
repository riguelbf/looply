import type { Command } from "commander";
import path from "node:path";
import chalk from "chalk";
import { refreshContext } from "../lib/context-refresh.js";
import { createSpinner, showIntro, showOutro } from "../ui/feedback.js";

export function registerRefreshContextCommand(program: Command): void {
  program
    .command("refresh-context")
    .description("Refresh project context and inventory from the current repository")
    .option("--dir <dir>", "Target directory for project context refresh (defaults to current directory)")
    .action(async (options) => {
      showIntro("looply refresh-context");
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const loading = createSpinner(`Refreshing context for ${targetRoot}`);

      const result = await refreshContext(targetRoot);

      loading.stop(`Context refreshed for ${chalk.cyan(result.targetRoot)}`);
      console.log(chalk.bold("Detected"));
      console.log(`languages: ${chalk.cyan(result.detectedLanguages.join(", ") || "none")}`);
      console.log(`frameworks: ${chalk.cyan(result.detectedFrameworks.join(", ") || "none")}`);
      console.log(`directories: ${chalk.cyan(result.keyDirectories.join(", ") || "none")}`);
      console.log(`modules: ${chalk.cyan(result.moduleHints.join(", ") || "none")}`);
      console.log(`integrations: ${chalk.cyan(result.integrationHints.join(", ") || "none")}`);
      console.log("");
      console.log(chalk.bold("Updated Files"));
      console.log(`- ${result.contextIndexFile}`);
      console.log(`- ${result.projectContextFile}`);
      console.log(`- ${result.projectInventoryFile}`);

      showOutro("Project context refreshed");
    });
}
