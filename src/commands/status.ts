import type { Command } from "commander";
import chalk from "chalk";
import path from "node:path";
import fs from "fs-extra";
import matter from "gray-matter";
import { globby } from "globby";
import { readInteractionPolicyFile } from "../lib/interaction-policy.js";
import { readLocaleFile } from "../lib/locale.js";
import { readInstallManifestFromTarget } from "../lib/manifest.js";
import { readProjectContextFile } from "../lib/project-context.js";
import { readSessionLinks } from "../lib/session-links.js";
import { readUpgradeHistoryFromTarget } from "../lib/upgrade-history.js";
import { showIntro, showOutro } from "../ui/feedback.js";

interface FeatureStatusEntry {
  feature: string;
  workflow: string;
  phase: string;
  currentStage: string;
  currentGate: string;
  nextAgent: string;
  nextTask: string;
  recommendedNextWorkflow: string;
  lastUpdated: string;
  file: string;
}

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .description("Show a consolidated operational status for the current project")
    .option("--dir <dir>", "Target directory for project status (defaults to current directory)")
    .option("--limit <count>", "Maximum number of recent history entries to show", "3")
    .option("--features <count>", "Maximum number of feature states to show", "5")
    .action(async (options) => {
      showIntro("looply status");

      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const historyLimit = toPositiveNumber(options.limit, 3);
      const featureLimit = toPositiveNumber(options.features, 5);

      const [manifest, locale, projectContext, interactionPolicy, sessions, history, featureStates] = await Promise.all([
        readInstallManifestFromTarget(targetRoot),
        readLocaleFile(targetRoot),
        readProjectContextFile(targetRoot),
        readInteractionPolicyFile(targetRoot),
        readSessionLinks(targetRoot),
        readUpgradeHistoryFromTarget(targetRoot),
        readFeatureStates(targetRoot)
      ]);

      console.log(chalk.bold("Project"));
      console.log(`root: ${chalk.cyan(targetRoot)}`);
      console.log(`installed: ${manifest ? chalk.green("yes") : chalk.red("no")}`);
      console.log("");

      console.log(chalk.bold("Installation"));
      if (!manifest || manifest.installs.length === 0) {
        console.log(chalk.dim("No install manifest found."));
      } else {
        for (const entry of manifest.installs) {
          console.log(`- host: ${chalk.cyan(entry.host)}  scope: ${chalk.cyan(entry.scope)}  pack: ${chalk.cyan(entry.pack)}`);
          console.log(
            chalk.dim(
              `  files: managed ${entry.managedFiles.length}  mergeable ${entry.mergeableFiles.length}  custom ${entry.customFiles.length}`
            )
          );
        }
      }
      console.log("");

      console.log(chalk.bold("Operational Mode"));
      console.log(`locale: ${chalk.cyan(locale?.outputLocale ?? "unknown")}`);
      console.log(`project-mode: ${chalk.cyan(projectContext?.mode ?? "unknown")}`);
      console.log(`interaction-mode: ${chalk.cyan(interactionPolicy?.mode ?? "unknown")}`);
      if (projectContext) {
        console.log(chalk.dim(`context-root: ${projectContext.primaryContextRoot}`));
        console.log(chalk.dim(`inference-policy: ${projectContext.inferencePolicy}`));
      }
      if (interactionPolicy) {
        console.log(chalk.dim(`ask-when: ${interactionPolicy.askWhen.join(", ")}`));
      }
      console.log("");

      console.log(chalk.bold("Sessions"));
      if (sessions.sessions.length === 0) {
        console.log(chalk.dim("No session links recorded."));
      } else {
        for (const session of sessions.sessions.slice(0, 5)) {
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
      if (featureStates.length === 0) {
        console.log(chalk.dim("No feature workflow states found."));
      } else {
        for (const feature of featureStates.slice(0, featureLimit)) {
          console.log(
            `- ${chalk.cyan(feature.feature)}  workflow ${chalk.cyan(feature.workflow)}  phase ${chalk.cyan(feature.phase)}`
          );
          console.log(
            chalk.dim(
              `  stage ${feature.currentStage || "unknown"}  gate ${feature.currentGate || "unknown"}  next ${feature.nextAgent || "unknown"} -> ${feature.nextTask || "unknown"}`
            )
          );
          if (feature.recommendedNextWorkflow) {
            console.log(chalk.dim(`  recommended workflow: ${feature.recommendedNextWorkflow}`));
          }
          if (feature.lastUpdated) {
            console.log(chalk.dim(`  updated ${feature.lastUpdated}`));
          }
        }
      }
      console.log("");

      console.log(chalk.bold("Recent History"));
      if (history.entries.length === 0) {
        console.log(chalk.dim("No upgrade or sync history recorded."));
      } else {
        for (const entry of history.entries.slice(0, historyLimit)) {
          console.log(`- ${entry.timestamp}  ${chalk.cyan(entry.action)}  ${chalk.cyan(entry.host)}  ${chalk.dim(`(${entry.pack})`)}`);
          if (entry.summary.impacts.length > 0) {
            console.log(chalk.dim(`  impacts: ${entry.summary.impacts.slice(0, 3).join(" | ")}`));
          }
        }
      }

      showOutro("Status snapshot completed");
    });
}

async function readFeatureStates(targetRoot: string): Promise<FeatureStatusEntry[]> {
  const files = await globby(".looply/custom/features/*/workflow-status.md", {
    cwd: targetRoot,
    absolute: true
  });

  const entries: FeatureStatusEntry[] = [];
  for (const file of files) {
    const source = await fs.readFile(file, "utf8");
    const parsed = matter(source);
    const body = parsed.content;
    entries.push({
      feature: extractSection(body, "Feature") || path.basename(path.dirname(file)),
      workflow: extractSection(body, "Workflow"),
      phase: extractSection(body, "Phase"),
      currentStage: extractSection(body, "Current Stage"),
      currentGate: extractSection(body, "Current Gate"),
      nextAgent: extractSection(body, "Next Agent"),
      nextTask: extractSection(body, "Next Task"),
      recommendedNextWorkflow: extractSection(body, "Recommended Next Workflow"),
      lastUpdated: extractSection(body, "Last Updated"),
      file
    });
  }

  return entries.sort((left, right) => right.lastUpdated.localeCompare(left.lastUpdated));
}

function extractSection(body: string, title: string): string {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = body.match(new RegExp(`^## ${escaped}\\n\\n([\\s\\S]*?)(?=\\n## |$)`, "m"));
  if (!match) {
    return "";
  }

  return match[1]
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .join(" ");
}

function toPositiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
