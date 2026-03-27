import type { Command } from "commander";
import path from "node:path";
import { registerReplayIntervention } from "../lib/workflow-interventions.js";
import { showIntro, showOutro } from "../ui/feedback.js";

export function registerReplayCommand(program: Command): void {
  program
    .command("replay")
    .description("Replay a feature workflow from a stage, agent, task or artifact checkpoint")
    .argument("<feature>", "Feature name")
    .requiredOption("--from <checkpoint>", "Checkpoint to replay from")
    .option("--dir <dir>", "Target directory for the feature state (defaults to current directory)")
    .option("--reason <reason>", "Reason for replay", "Replay requested by the user")
    .option("--source-root <dir>", "looply source directory that contains packs/")
    .action(async (feature, options) => {
      showIntro("looply replay");
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const result = await registerReplayIntervention({
        targetRoot,
        feature,
        from: options.from,
        reason: options.reason,
        notes: [],
        sourceRoot: options.sourceRoot
      });

      console.log(`feature: ${result.document.feature}`);
      console.log(`execution-mode: ${result.document.executionMode}`);
      console.log(`replayed-from: ${result.document.replayedFrom}`);
      console.log(`recovery-command: ${result.document.recommendedRecoveryCommand || "n/a"}`);
      if (result.document.supersededOutputs.length > 0) {
        console.log("superseded-outputs:");
        for (const output of result.document.supersededOutputs) {
          console.log(`- ${output}`);
        }
      }
      console.log(`control-file: ${path.relative(targetRoot, result.file)}`);

      showOutro("Replay registered");
    });
}
