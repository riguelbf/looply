import type { Command } from "commander";
import path from "node:path";
import chalk from "chalk";
import { buildPerfSummary } from "../lib/perf/summary.js";
import { readPerfEvents, resolvePerfEventsFile } from "../lib/perf/storage.js";
import {
  checkpointPerfWorkflowTrace,
  finishPerfWorkflowTrace,
  readPerfWorkflowTraceEvents,
  resolvePerfWorkflowTraceFile,
  startPerfWorkflowTrace
} from "../lib/perf/trace.js";
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

  const trace = perf
    .command("trace")
    .description("Record workflow trace checkpoints from local automation or host hooks");

  addTraceOptions(
    trace
      .command("start")
      .description("Start a workflow trace session")
      .action(async (options) => {
        const targetRoot = path.resolve(options.dir ?? process.cwd());
        const result = await startPerfWorkflowTrace({
          targetRoot,
          source: options.source ?? "manual",
          host: options.host,
          feature: options.feature,
          workflow: options.workflow,
          alias: options.alias,
          stage: options.stage,
          task: options.task,
          artifact: options.artifact,
          notes: options.notes
        });

        console.log(`trace-file: ${result.eventFile}`);
        console.log(`active-file: ${result.activeFile}`);
      })
  );

  addTraceOptions(
    trace
      .command("checkpoint")
      .description("Record a workflow checkpoint")
      .action(async (options) => {
        const targetRoot = path.resolve(options.dir ?? process.cwd());
        const result = await checkpointPerfWorkflowTrace({
          targetRoot,
          source: options.source ?? "manual",
          host: options.host,
          feature: options.feature,
          workflow: options.workflow,
          alias: options.alias,
          stage: options.stage,
          task: options.task,
          artifact: options.artifact,
          status: options.status,
          notes: options.notes
        });

        console.log(`trace-file: ${result.eventFile}`);
        console.log(`active-file: ${result.activeFile ?? "none"}`);
      })
  );

  addTraceOptions(
    trace
      .command("finish")
      .description("Finish an active workflow trace session")
      .action(async (options) => {
        const targetRoot = path.resolve(options.dir ?? process.cwd());
        const result = await finishPerfWorkflowTrace({
          targetRoot,
          source: options.source ?? "manual",
          host: options.host,
          feature: options.feature,
          workflow: options.workflow,
          alias: options.alias,
          stage: options.stage,
          task: options.task,
          artifact: options.artifact,
          status: options.status,
          notes: options.notes
        });

        console.log(`trace-file: ${result.eventFile}`);
        console.log(`active-file: ${result.activeFile ?? "none"}`);
      })
  );

  trace
    .command("summary")
    .description("Show a summary of workflow trace events")
    .option("--dir <dir>", "Target directory for perf trace data (defaults to current directory)")
    .option("--limit <count>", "Maximum number of recent events to show", "10")
    .option("--json", "Print the workflow trace events as JSON")
    .action(async (options) => {
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const limit = toPositiveNumber(options.limit, 10);
      const events = await readPerfWorkflowTraceEvents(targetRoot);

      if (events.length === 0) {
        showOutro(`No workflow trace events found in ${resolvePerfWorkflowTraceFile(targetRoot)}`);
        return;
      }

      const recent = events.slice(-limit).reverse();
      if (options.json) {
        console.log(JSON.stringify(recent, null, 2));
        return;
      }

      console.log(chalk.black.bgWhite.bold(" LOOPLY TRACE "));
      console.log("");
      console.log(`events: ${chalk.cyan(String(events.length))}`);
      console.log(`file: ${chalk.cyan(resolvePerfWorkflowTraceFile(targetRoot))}`);
      console.log("");

      for (const event of recent) {
        console.log(`- ${event.event} ${chalk.cyan(event.alias || event.workflow || "unknown")}${event.feature ? ` ${chalk.dim(`(${event.feature})`)}` : ""}`);
        console.log(chalk.dim(`  ${event.timestamp}  host=${event.host || "unknown"}  stage=${event.stage || "n/a"}  task=${event.task || "n/a"}  status=${event.status || "n/a"}`));
        if (event.notes) {
          console.log(chalk.dim(`  ${event.notes}`));
        }
      }

      showOutro("Workflow trace summary ready");
    });
}

function toPositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function addTraceOptions(command: Command): Command {
  return command
    .option("--dir <dir>", "Target directory for perf trace data (defaults to current directory)")
    .option("--source <source>", "Trace source such as manual or claude-hook")
    .option("--host <host>", "Host name such as claude or codex")
    .option("--feature <feature>", "Feature name")
    .option("--workflow <workflow>", "Workflow name")
    .option("--alias <alias>", "Workflow alias such as looply:story-to-production")
    .option("--stage <stage>", "Workflow stage")
    .option("--task <task>", "Workflow task")
    .option("--artifact <artifact>", "Active artifact")
    .option("--status <status>", "Checkpoint status")
    .option("--notes <notes>", "Free-form notes");
}
