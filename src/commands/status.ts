import type { Command } from "commander";
import chalk from "chalk";
import path from "node:path";
import { buildProjectSnapshot, writeProjectSnapshot } from "../lib/project-snapshot.js";
import { showIntro, showOutro } from "../ui/feedback.js";

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .description("Show a consolidated operational status for the current project")
    .option("--dir <dir>", "Target directory for project status (defaults to current directory)")
    .option("--limit <count>", "Maximum number of recent history entries to show", "3")
    .option("--features <count>", "Maximum number of feature states to show", "5")
    .option("--json", "Print the normalized project snapshot as JSON")
    .action(async (options) => {
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const historyLimit = toPositiveNumber(options.limit, 3);
      const featureLimit = toPositiveNumber(options.features, 5);
      const snapshot = await buildProjectSnapshot(targetRoot);
      const snapshotFile = await writeProjectSnapshot(targetRoot);

      if (options.json) {
        console.log(JSON.stringify(snapshot, null, 2));
        return;
      }

      showIntro("looply status");

      console.log(chalk.bold("Project"));
      console.log(`root: ${chalk.cyan(snapshot.targetRoot)}`);
      console.log(`installed: ${snapshot.project.installed ? chalk.green("yes") : chalk.red("no")}`);
      console.log(`installs: ${chalk.cyan(String(snapshot.summary.installCount))}`);
      console.log(`features: ${chalk.cyan(String(snapshot.summary.featureCount))}`);
      console.log(`sessions: ${chalk.cyan(String(snapshot.summary.sessionCount))}`);
      console.log("");

      console.log(chalk.bold("Installation"));
      if (snapshot.installation.installs.length === 0) {
        console.log(chalk.dim("No install manifest found."));
      } else {
        for (const entry of snapshot.installation.installs) {
          console.log(`- host: ${chalk.cyan(entry.host)}  scope: ${chalk.cyan(entry.scope)}  pack: ${chalk.cyan(entry.pack)}`);
          console.log(
            chalk.dim(
              `  files: managed ${entry.managedFiles}  mergeable ${entry.mergeableFiles}  custom ${entry.customFiles}`
            )
          );
        }
      }
      console.log("");

      console.log(chalk.bold("Operational Mode"));
      console.log(`locale: ${chalk.cyan(snapshot.project.locale)}`);
      console.log(`project-mode: ${chalk.cyan(snapshot.project.projectMode)}`);
      console.log(`interaction-mode: ${chalk.cyan(snapshot.project.interactionMode)}`);
      console.log(chalk.dim(`context-root: ${snapshot.project.primaryContextRoot}`));
      console.log(chalk.dim(`inference-policy: ${snapshot.project.inferencePolicy}`));
      console.log("");

      console.log(chalk.bold("Published Hosts"));
      if (snapshot.hosts.length === 0) {
        console.log(chalk.dim("No published host surfaces found."));
      } else {
        for (const host of snapshot.hosts) {
          console.log(`- host: ${chalk.cyan(host.host)}  scope: ${chalk.cyan(host.scope)}  pack: ${chalk.cyan(host.pack)}`);
          console.log(chalk.dim(`  workflows: ${host.workflowCount}  aliases: ${host.aliases.slice(0, 4).join(", ") || "none"}`));
        }
      }
      console.log("");

      console.log(chalk.bold("Context"));
      if (snapshot.context.snapshot) {
        console.log(`status: ${chalk.cyan(snapshot.context.snapshot.contextStatus)}`);
        console.log(`coverage: ${chalk.cyan(snapshot.context.snapshot.contextCoverage)}`);
        console.log(`last-validated: ${chalk.cyan(snapshot.context.snapshot.lastValidatedAt || "unknown")}`);
        console.log(`languages: ${chalk.cyan(snapshot.context.snapshot.languages.join(", ") || "none")}`);
        console.log(`frameworks: ${chalk.cyan(snapshot.context.snapshot.frameworks.join(", ") || "none")}`);
        console.log(`api: ${chalk.cyan(snapshot.context.snapshot.apiSignals.join(", ") || "none")}`);
        console.log(`data: ${chalk.cyan(snapshot.context.snapshot.dataSignals.join(", ") || "none")}`);
        console.log(`auth: ${chalk.cyan(snapshot.context.snapshot.authSignals.join(", ") || "none")}`);
        console.log(`messaging: ${chalk.cyan(snapshot.context.snapshot.messagingSignals.join(", ") || "none")}`);
        console.log(`observability: ${chalk.cyan(snapshot.context.snapshot.observabilitySignals.join(", ") || "none")}`);
        console.log(`modules: ${chalk.cyan(snapshot.context.snapshot.moduleHints.join(", ") || "none")}`);
        console.log(`integrations: ${chalk.cyan(snapshot.context.snapshot.integrationHints.join(", ") || "none")}`);
      } else {
        console.log(chalk.dim("No context snapshot found. Run `looply refresh-context` to generate one."));
      }
      console.log("");

      console.log(chalk.bold("Sessions"));
      if (snapshot.sessions.length === 0) {
        console.log(chalk.dim("No session links recorded."));
      } else {
        for (const session of snapshot.sessions.slice(0, 5)) {
          console.log(
            `- ${chalk.cyan(session.label)} -> ${chalk.cyan(session.feature)}${session.workflow ? ` ${chalk.dim(`(${session.workflow})`)}` : ""}`
          );
          if (session.lastCommand || session.lastUpdatedAt) {
            console.log(
              chalk.dim(
                `  ${session.lastCommand ?? "no-last-command"}${session.lastUpdatedAt ? `  updated ${session.lastUpdatedAt}` : ""}`
              )
            );
          }
        }
      }
      console.log("");

      console.log(chalk.bold("Features"));
      if (snapshot.features.length === 0) {
        console.log(chalk.dim("No feature workflow states found."));
      } else {
        for (const feature of snapshot.features.slice(0, featureLimit)) {
          const linkedSessions = snapshot.sessions.filter((session) => session.feature === feature.feature);
          console.log(chalk.cyan(feature.feature));
          console.log(`workflow: ${feature.workflow || "unknown"}`);
          console.log(`phase: ${feature.phase || "unknown"}`);
          console.log(`stage: ${feature.currentStage || "unknown"}`);
          console.log(`gate: ${feature.currentGate || "unknown"}`);
          console.log(`gate-status: ${feature.gateStatus || "unknown"}`);
          console.log(`artifact: ${feature.activeArtifact || "unknown"}`);
          console.log(`selected-story: ${feature.selectedStory || "n/a"}`);
          console.log(`host: ${feature.host || "unknown"}`);
          console.log(`next-workflow: ${feature.recommendedNextWorkflow || "unknown"}`);
          console.log(`next-agent: ${feature.nextAgent || "unknown"}`);
          console.log(`next-task: ${feature.nextTask || "unknown"}`);
          console.log(`next-command: ${feature.nextCommand || "unknown"}`);
          console.log(`next-handoff: ${feature.nextHandoff || "unknown"}`);
          console.log(`ready-for-next-gate: ${feature.readyForNextGate || "unknown"}`);
          console.log(`context: ${feature.contextStatus || "unknown"} / ${feature.contextCoverage || "unknown"}`);
          console.log(`sessions: ${linkedSessions.length > 0 ? linkedSessions.map((session) => session.label).join(", ") : "none"}`);

          if (feature.blockedBy.length > 0) {
            console.log(chalk.bold("Blocked By"));
            for (const blocker of feature.blockedBy.slice(0, 4)) {
              console.log(`- ${blocker}`);
            }
          }

          if (feature.missingOutputs.length > 0) {
            console.log(chalk.bold("Missing Outputs"));
            for (const output of feature.missingOutputs.slice(0, 6)) {
              console.log(`- ${output}`);
            }
          }

          if (feature.decisionRationale) {
            console.log(chalk.bold("Decision"));
            console.log(chalk.dim(feature.decisionRationale));
          }

          if (feature.nextCommand || feature.recommendedNextWorkflow) {
            console.log(chalk.bold("Next Step"));
            console.log(chalk.dim(feature.nextCommand || `${feature.recommendedNextWorkflow} -> ${feature.nextAgent || "unknown"} -> ${feature.nextTask || "unknown"}`));
          }
          if (feature.lastUpdated) {
            console.log(chalk.dim(`updated ${feature.lastUpdated}`));
          }
          console.log(chalk.dim(`state file: ${path.relative(targetRoot, feature.file)}`));
          console.log("");
        }
      }

      console.log(chalk.bold("Recent History"));
      if (snapshot.history.length === 0) {
        console.log(chalk.dim("No upgrade or sync history recorded."));
      } else {
        for (const entry of snapshot.history.slice(0, historyLimit)) {
          console.log(`- ${entry.timestamp}  ${chalk.cyan(entry.action)}  ${chalk.cyan(entry.host)}  ${chalk.dim(`(${entry.pack})`)}`);
          if (entry.impacts.length > 0) {
            console.log(chalk.dim(`  impacts: ${entry.impacts.slice(0, 3).join(" | ")}`));
          }
        }
      }

      console.log("");
      console.log(chalk.bold("Recommended Actions"));
      const recommendations = buildRecommendedActions(snapshot);
      for (const recommendation of recommendations) {
        console.log(`- ${recommendation}`);
      }

      console.log("");
      console.log(chalk.bold("Snapshot"));
      console.log(chalk.dim(snapshotFile));

      showOutro("Status snapshot completed");
    });
}

function toPositiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function buildRecommendedActions(snapshot: Awaited<ReturnType<typeof buildProjectSnapshot>>): string[] {
  const actions: string[] = [];

  if (!snapshot.project.installed) {
    actions.push("Initialize project-scoped looply state with `looply install --host codex,claude --scope project --pack software-delivery-suite --project-mode existing-project`.");
  }

  if (snapshot.project.installed && snapshot.hosts.length === 0) {
    actions.push("Regenerate host surfaces with `looply sync --host codex,claude --scope project` so command aliases, skills and execution hints stay current.");
  }

  if (!snapshot.context.snapshot) {
    actions.push("Generate project context with `looply refresh-context`.");
  }

  if (snapshot.features.length === 0) {
    actions.push("Inspect the available workflows with `looply list workflow`.");
    actions.push("Inspect a workflow before starting delivery with `looply inspect workflow story-to-production`.");
    actions.push("If the main problem is cloud topology or async-first design, inspect `looply inspect workflow cloud-workload-design`.");
    actions.push("If the main problem is shared platform baseline or guardrails, inspect `looply inspect workflow platform-foundation-evolution`.");
  } else {
    const nextFeature = snapshot.features.find((feature) => feature.nextCommand !== "") ?? snapshot.features[0];
    if (nextFeature?.nextCommand) {
      actions.push(`Continue feature \`${nextFeature.feature}\` with \`${nextFeature.nextCommand}\`.`);
    } else {
      actions.push(`Resume feature \`${nextFeature?.feature ?? "current-feature"}\` with \`looply status\` and inspect the persisted workflow state.`);
    }
  }

  if (snapshot.context.snapshot && snapshot.context.snapshot.contextCoverage !== "high") {
    actions.push("Refresh and validate context again after inspecting the real codebase to increase confidence before design or implementation.");
  }

  return actions.length > 0 ? actions : ["No immediate action required. Use `looply status --json` for full operational state."];
}
