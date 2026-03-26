import type { Command } from "commander";
import chalk from "chalk";
import path from "node:path";
import { readUpgradeHistoryFromTarget, resolveUpgradeHistoryFile } from "../lib/upgrade-history.js";
import { showIntro, showOutro } from "../ui/feedback.js";

export function registerHistoryCommand(program: Command): void {
  program
    .command("history")
    .description("Show upgrade and sync history for the current project")
    .option("--dir <dir>", "Target directory for project history (defaults to current directory)")
    .option("--host <host>", "Filter by host such as codex or claude")
    .option("--limit <count>", "Maximum number of entries to show", "10")
    .action(async (options) => {
      showIntro("looply history");

      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const historyFile = resolveUpgradeHistoryFile(targetRoot);
      const history = await readUpgradeHistoryFromTarget(targetRoot);
      const limit = Number.isFinite(Number(options.limit)) ? Math.max(1, Number(options.limit)) : 10;
      const hostFilter = typeof options.host === "string" ? options.host.trim() : "";

      const entries = history.entries
        .filter((entry) => hostFilter === "" || entry.host === hostFilter)
        .slice(0, limit);

      if (entries.length === 0) {
        showOutro(`No history entries found in ${historyFile}`);
        return;
      }

      for (const entry of entries) {
        console.log(chalk.bold(`${entry.timestamp} ${entry.action} ${entry.host} ${chalk.dim(`(${entry.pack})`)}`));
        console.log(`scope: ${chalk.cyan(entry.scope)}  target: ${chalk.dim(entry.targetRoot)}`);

        if (entry.summary.impacts.length > 0) {
          console.log("impacts:");
          for (const impact of entry.summary.impacts) {
            console.log(`- ${impact}`);
          }
        }

        if (entry.summary.artifactChanges.length > 0) {
          console.log("changes:");
          for (const change of entry.summary.artifactChanges) {
            console.log(`- ${change}`);
          }
        }

        if (
          entry.summary.addedFiles.length > 0 ||
          entry.summary.changedFiles.length > 0 ||
          entry.summary.removedFiles.length > 0
        ) {
          console.log(
            chalk.dim(
              `files: +${entry.summary.addedFiles.length} ~${entry.summary.changedFiles.length} -${entry.summary.removedFiles.length}`
            )
          );
        }

        console.log("");
      }

      showOutro(`Showing ${entries.length} entr${entries.length === 1 ? "y" : "ies"} from ${historyFile}`);
    });
}
