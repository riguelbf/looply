import type { Command } from "commander";
import { runUpdateFlow } from "../lib/update-flow.js";
import { showIntro } from "../ui/feedback.js";

export function registerCheckUpdatesCommand(program: Command): void {
  program
    .command("check-updates")
    .description("Check whether installed hosts have updates available")
    .option("--host <host>", "Target host list such as codex,claude")
    .option("--scope <scope>", "Installation scope such as project or global")
    .option("--dir <dir>", "Target directory for project scope update check (defaults to current directory)")
    .option("--source-root <dir>", "looply source directory that contains packs/")
    .action(async (options) => {
      showIntro("looply check-updates");
      await runUpdateFlow({
        sourceRootOverride: options.sourceRoot,
        currentWorkingDirectory: process.cwd(),
        hostOption: options.host,
        scopeOption: options.scope,
        targetDirectoryOption: options.dir,
        applyUpdates: false,
        actionLabel: "check-updates"
      });
    });
}
