import type { Command } from "commander";
import path from "node:path";
import chalk from "chalk";
import { refreshCodeContext } from "../lib/code-context/manager.js";
import { readCodeContext } from "../lib/code-context/storage.js";
import { createSpinner, showIntro, showOutro } from "../ui/feedback.js";

export function registerRefreshCodeContextCommand(program: Command): void {
  program
    .command("refresh-code-context")
    .description("Refresh multi-language code-context discovery for the current repository")
    .option("--dir <dir>", "Target directory for code-context refresh (defaults to current directory)")
    .action(async (options) => {
      showIntro("looply refresh-code-context");
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const loading = createSpinner(`Refreshing code context for ${targetRoot}`);

      const result = await refreshCodeContext(targetRoot);
      const document = await readCodeContext(targetRoot);

      loading.stop(`Code context refreshed for ${chalk.cyan(result.targetRoot)}`);
      console.log(chalk.bold("Summary"));
      console.log(`project mode: ${chalk.cyan(result.projectMode)}`);
      console.log(`primary root: ${chalk.cyan(result.primaryContextRoot)}`);
      console.log(`coverage: ${chalk.cyan(document?.coverage ?? "unknown")}`);
      console.log(`providers detected: ${chalk.cyan(String(result.providerCount))}`);
      console.log(`workspace roots: ${chalk.cyan(String(result.workspaceRootCount))}`);
      console.log("");

      console.log(chalk.bold("Providers"));
      for (const provider of document?.providers ?? []) {
        const availability = provider.executableAvailable ? "available" : "missing";
        console.log(
          `- ${provider.id}: roots=${chalk.cyan(String(provider.detectedRootCount))}, executable=${chalk.cyan(provider.executable)} (${availability})`
        );
      }

      console.log("");
      console.log(chalk.bold("Workspace Roots"));
      if ((document?.workspaceRoots.length ?? 0) === 0) {
        console.log("- none detected");
      } else {
        for (const workspace of document?.workspaceRoots ?? []) {
          console.log(
            `- ${workspace.providerId}: ${chalk.cyan(workspace.root)} [${workspace.kind}] via ${workspace.markers.join(", ")}`
          );
        }
      }

      console.log("");
      console.log(chalk.bold("Updated Files"));
      console.log(`- ${result.codeContextFile}`);

      showOutro("Code context refreshed");
    });
}
