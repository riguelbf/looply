import type { Command } from "commander";
import { runUpdateFlow } from "../lib/update-flow.js";
import { showIntro } from "../ui/feedback.js";

export function registerUpgradeCommand(program: Command): void {
  program
    .command("upgrade")
    .description("Check for updates and upgrade installed hosts")
    .option("--host <host>", "Target host list such as codex,claude")
    .option("--scope <scope>", "Installation scope such as project or global")
    .option("--dir <dir>", "Target directory for project scope upgrade (defaults to current directory)")
    .option("--source-root <dir>", "looply source directory that contains packs/")
    .option("--yes", "Skip confirmation and apply available updates")
    .action(async (options) => {
      showIntro("looply upgrade");
      await runUpdateFlow({
        sourceRootOverride: options.sourceRoot,
        currentWorkingDirectory: process.cwd(),
        hostOption: options.host,
        scopeOption: options.scope,
        targetDirectoryOption: options.dir,
        yes: options.yes,
        applyUpdates: true,
        actionLabel: "upgrade"
      });
    });
}
