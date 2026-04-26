import type { Command } from "commander";
import path from "node:path";
import chalk from "chalk";
import { addProfileOption, resolvePerfMode } from "../lib/perf/config.js";
import { runWithPerfSession } from "../lib/perf/session.js";
import { buildProjectSnapshot } from "../lib/project-snapshot.js";
import { deriveAutonomyCycle, writeAutonomyCycle } from "../lib/autonomy.js";
import { showIntro, showOutro } from "../ui/feedback.js";

export function registerAutonomyCommand(program: Command): void {
  addProfileOption(program
    .command("autonomy")
    .description("Plan a host-driven autonomous cycle for a feature workflow")
    .argument("<feature>", "Feature name")
    .option("--dir <dir>", "Target directory for the project state (defaults to current directory)")
    .option("--host <host>", "Host to target when deriving the cycle", "codex")
    .option("--json", "Print the autonomy cycle as JSON")
    .option("--source-root <dir>", "looply source directory that contains packs/"))
    .action(async (feature, options) => {
      showIntro("looply autonomy");
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const result = await runWithPerfSession({
        command: "autonomy",
        mode: resolvePerfMode(options.profile),
        targetRoot,
        metadata: {
          feature,
          host: options.host
        }
      }, async () => {
        const snapshot = await buildProjectSnapshot(targetRoot);
        const cycle = deriveAutonomyCycle({
          snapshot,
          featureName: feature,
          host: options.host
        });
        const stateFile = await writeAutonomyCycle(targetRoot, cycle);
        return { cycle, stateFile };
      });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      const cycle = result.cycle;

      console.log(chalk.bold("# Looply Autonomy Cycle"));
      console.log("");
      console.log(chalk.bold("## Summary Table"));
      console.log("| Field | Value |");
      console.log("| --- | --- |");
      console.log(`| Feature | ${cycle.feature} |`);
      console.log(`| Host | ${cycle.host} |`);
      console.log(`| Workflow | ${cycle.workflow} |`);
      console.log(`| Current Stage | ${cycle.currentStage || "n/a"} |`);
      console.log(`| Current Gate | ${cycle.currentGate || "n/a"} |`);
      console.log(`| Action | ${cycle.nextAction} |`);
      console.log(`| Next Command | ${cycle.nextCommand} |`);
      console.log(`| Approval Required | ${cycle.approvalRequired ? "yes" : "no"} |`);
      console.log(`| Risk | ${cycle.riskLevel} |`);
      console.log(`| State File | ${path.relative(targetRoot, cycle.autonomyStateFile)} |`);
      console.log("");
      console.log(chalk.bold("## Decision"));
      console.log(cycle.reason);
      console.log("");
      console.log(chalk.bold("## Blockers"));
      console.log(cycle.blockers.length > 0 ? cycle.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- none");
      console.log("");
      console.log(chalk.bold("## Missing Outputs"));
      console.log(cycle.missingOutputs.length > 0 ? cycle.missingOutputs.map((output) => `- ${output}`).join("\n") : "- none");
      console.log("");
      console.log(chalk.bold("## Next Step"));
      console.log(cycle.nextCommand);

      showOutro("Autonomy cycle planned");
    });
}
