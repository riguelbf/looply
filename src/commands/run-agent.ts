import type { Command } from "commander";
import path from "node:path";
import { addProfileOption, resolvePerfMode } from "../lib/perf/config.js";
import { runWithPerfSession } from "../lib/perf/session.js";
import { registerAgentIntervention } from "../lib/workflow-interventions.js";
import { showIntro, showOutro } from "../ui/feedback.js";

export function registerRunAgentCommand(program: Command): void {
  addProfileOption(program
    .command("run-agent")
    .description("Register a manual agent intervention inside a feature workflow")
    .argument("<feature>", "Feature name")
    .argument("<agent>", "Agent name")
    .requiredOption("--task <task>", "Task to run with the selected agent")
    .argument("[notes...]", "Optional notes for the intervention")
    .option("--dir <dir>", "Target directory for the feature state (defaults to current directory)")
    .option("--reason <reason>", "Reason for the manual intervention", "Manual agent intervention requested by the user")
    .option("--source-root <dir>", "looply source directory that contains packs/"))
    .action(async (feature, agent, notes: string[], options) => {
      showIntro("looply run-agent");
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const result = await runWithPerfSession({
        command: "run-agent",
        mode: resolvePerfMode(options.profile),
        targetRoot,
        metadata: {
          feature,
          agent,
          task: options.task,
          noteCount: notes.length
        }
      }, async () => registerAgentIntervention({
        targetRoot,
        feature,
        agent,
        task: options.task,
        reason: options.reason,
        notes,
        sourceRoot: options.sourceRoot
      }));

      console.log(`feature: ${result.document.feature}`);
      console.log(`execution-mode: ${result.document.executionMode}`);
      console.log(`recovery-command: ${result.document.recommendedRecoveryCommand || "n/a"}`);
      console.log(`interventions: ${result.document.interventions.length}`);
      console.log(`control-file: ${path.relative(targetRoot, result.file)}`);

      showOutro("Manual agent intervention registered");
    });
}
