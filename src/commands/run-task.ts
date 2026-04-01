import type { Command } from "commander";
import path from "node:path";
import { addProfileOption, resolvePerfMode } from "../lib/perf/config.js";
import { runWithPerfSession } from "../lib/perf/session.js";
import { registerTaskIntervention } from "../lib/workflow-interventions.js";
import { showIntro, showOutro } from "../ui/feedback.js";

export function registerRunTaskCommand(program: Command): void {
  addProfileOption(program
    .command("run-task")
    .description("Register a manual task execution inside a feature workflow")
    .argument("<feature>", "Feature name")
    .argument("<task>", "Task name")
    .argument("[notes...]", "Optional notes for the intervention")
    .option("--dir <dir>", "Target directory for the feature state (defaults to current directory)")
    .option("--reason <reason>", "Reason for the manual task execution", "Manual task execution requested by the user")
    .option("--source-root <dir>", "looply source directory that contains packs/"))
    .action(async (feature, task, notes: string[], options) => {
      showIntro("looply run-task");
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const result = await runWithPerfSession({
        command: "run-task",
        mode: resolvePerfMode(options.profile),
        targetRoot,
        metadata: {
          feature,
          task,
          noteCount: notes.length
        }
      }, async () => registerTaskIntervention({
        targetRoot,
        feature,
        task,
        reason: options.reason,
        notes,
        sourceRoot: options.sourceRoot
      }));

      console.log(`feature: ${result.document.feature}`);
      console.log(`execution-mode: ${result.document.executionMode}`);
      console.log(`recovery-command: ${result.document.recommendedRecoveryCommand || "n/a"}`);
      console.log(`interventions: ${result.document.interventions.length}`);
      console.log(`control-file: ${path.relative(targetRoot, result.file)}`);

      showOutro("Manual task intervention registered");
    });
}
