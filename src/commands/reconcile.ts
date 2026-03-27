import type { Command } from "commander";
import path from "node:path";
import { reconcileFeatureWorkflowControl } from "../lib/workflow-interventions.js";
import { showIntro, showOutro } from "../ui/feedback.js";

export function registerReconcileCommand(program: Command): void {
  program
    .command("reconcile")
    .description("Reconcile a feature workflow after manual interventions or replay")
    .argument("<feature>", "Feature name")
    .option("--dir <dir>", "Target directory for the feature state (defaults to current directory)")
    .action(async (feature, options) => {
      showIntro("looply reconcile");
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const result = await reconcileFeatureWorkflowControl(targetRoot, feature);

      console.log(`feature: ${result.document.feature}`);
      console.log(`execution-mode: ${result.document.executionMode}`);
      console.log(`recovery-command: ${result.document.recommendedRecoveryCommand || "n/a"}`);
      console.log(`reconciled-at: ${result.document.lastReconciledAt || "unknown"}`);
      console.log(`control-file: ${path.relative(targetRoot, result.file)}`);

      showOutro("Feature workflow reconciled");
    });
}
