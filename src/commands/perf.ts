import type { Command } from "commander";
import path from "node:path";
import chalk from "chalk";
import { buildPerfSummary } from "../lib/perf/summary.js";
import { readPerfEvents, resolvePerfEventsFile } from "../lib/perf/storage.js";
import { showOutro } from "../ui/feedback.js";

export function registerPerfCommand(program: Command): void {
  const perf = program
    .command("perf")
    .description("Inspect locally recorded looply performance sessions");

  perf
    .command("summary")
    .description("Show a summary of recorded profiled commands")
    .option("--dir <dir>", "Target directory for perf data (defaults to current directory)")
    .option("--limit <count>", "Maximum number of rows per section", "5")
    .option("--json", "Print the perf summary as JSON")
    .action(async (options) => {
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const limit = toPositiveNumber(options.limit, 5);
      const events = await readPerfEvents(targetRoot);

      if (events.length === 0) {
        showOutro(`No perf events found in ${resolvePerfEventsFile(targetRoot)}`);
        return;
      }

      const summary = buildPerfSummary(events, limit);

      if (options.json) {
        console.log(JSON.stringify(summary, null, 2));
        return;
      }

      console.log(chalk.black.bgWhite.bold(" LOOPLY PERF "));
      console.log("");
      console.log(`events: ${chalk.cyan(String(summary.commandCount))}`);
      console.log(`file: ${chalk.cyan(resolvePerfEventsFile(targetRoot))}`);
      console.log("");

      console.log(chalk.bold("Slowest Commands"));
      for (const item of summary.slowestCommands) {
        console.log(`- ${item.command}: ${chalk.cyan(`${item.durationMs}ms`)} ${chalk.dim(item.startedAt)}${item.success ? "" : chalk.red(" failed")}`);
      }
      console.log("");

      console.log(chalk.bold("Average By Command"));
      for (const item of summary.averageByCommand) {
        console.log(`- ${item.command}: avg ${chalk.cyan(`${item.averageDurationMs}ms`)}  max ${chalk.cyan(`${item.maxDurationMs}ms`)}  count ${chalk.cyan(String(item.count))}`);
      }
      console.log("");

      console.log(chalk.bold("Slowest Spans"));
      for (const item of summary.slowestSpans) {
        console.log(`- ${item.name}: ${chalk.cyan(`${item.durationMs}ms`)} ${chalk.dim(`(${item.command})`)}`);
      }

      showOutro("Perf summary ready");
    });
}

function toPositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

