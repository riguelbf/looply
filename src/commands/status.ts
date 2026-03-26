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
  activeArtifact: string;
  selectedStory: string;
  readyForNextGate: string;
  nextAgent: string;
  nextTask: string;
  blockedBy: string[];
  missingOutputs: string[];
  decisionRationale: string;
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
          const linkedSessions = sessions.sessions.filter((session) => session.feature === feature.feature);
          const rows: Array<[string, string]> = [
            ["Feature", feature.feature || "unknown"],
            ["Workflow", feature.workflow || "unknown"],
            ["Phase", feature.phase || "unknown"],
            ["Current Stage", feature.currentStage || "unknown"],
            ["Current Gate", feature.currentGate || "unknown"],
            ["Active Artifact", feature.activeArtifact || "unknown"],
            ["Selected Story", feature.selectedStory || "n/a"],
            ["Next Workflow", feature.recommendedNextWorkflow || "unknown"],
            ["Next Agent", feature.nextAgent || "unknown"],
            ["Next Task", feature.nextTask || "unknown"],
            ["Ready For Next Gate", feature.readyForNextGate || "unknown"],
            ["Sessions", linkedSessions.length > 0 ? linkedSessions.map((session) => session.label).join(", ") : "none"]
          ];

          console.log(chalk.cyan(feature.feature));
          console.log(renderKeyValueTable(rows));

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

          if (feature.recommendedNextWorkflow) {
            console.log(chalk.bold("Next Step"));
            console.log(
              chalk.dim(
                `${feature.recommendedNextWorkflow} -> ${feature.nextAgent || "unknown"} -> ${feature.nextTask || "unknown"}`
              )
            );
          }
          if (feature.lastUpdated) {
            console.log(chalk.dim(`updated ${feature.lastUpdated}`));
          }
          console.log(chalk.dim(`state file: ${path.relative(targetRoot, feature.file)}`));
          console.log("");
        }
      }

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
      activeArtifact: extractSection(body, "Active Artifact"),
      selectedStory: extractSection(body, "Selected Story"),
      readyForNextGate: extractSection(body, "Ready For Next Gate"),
      nextAgent: extractSection(body, "Next Agent"),
      nextTask: extractSection(body, "Next Task"),
      blockedBy: extractListSection(body, "Blocked By"),
      missingOutputs: extractListSection(body, "Missing Outputs"),
      decisionRationale: extractSection(body, "Decision Rationale"),
      recommendedNextWorkflow: extractSection(body, "Recommended Next Workflow"),
      lastUpdated: extractSection(body, "Last Updated"),
      file
    });
  }

  return entries.sort((left, right) => right.lastUpdated.localeCompare(left.lastUpdated));
}

function extractSection(body: string, title: string): string {
  const section = extractSectionRaw(body, title);
  if (!section) {
    return "";
  }

  return section
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .join(" ");
}

function extractSectionRaw(body: string, title: string): string {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = body.match(new RegExp(`(?:^|\\n)## ${escaped}\\n\\n([\\s\\S]*?)(?=\\n## |$)`));
  if (!match) {
    return "";
  }

  return match[1];
}

function toPositiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function extractListSection(body: string, title: string): string[] {
  const section = extractSectionRaw(body, title);
  if (!section) {
    return [];
  }

  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

function renderKeyValueTable(rows: Array<[string, string]>): string {
  const labelWidth = Math.max(...rows.map(([label]) => label.length), "Field".length);
  const valueWidth = Math.max(...rows.map(([, value]) => value.length), "Value".length);
  const divider = `+${"-".repeat(labelWidth + 2)}+${"-".repeat(valueWidth + 2)}+`;

  const renderRow = (label: string, value: string) =>
    `| ${label.padEnd(labelWidth)} | ${value.padEnd(valueWidth)} |`;

  return [
    divider,
    renderRow("Field", "Value"),
    divider,
    ...rows.map(([label, value]) => renderRow(label, value)),
    divider
  ].join("\n");
}
