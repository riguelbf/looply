import type { Command } from "commander";
import chalk from "chalk";
import path from "node:path";
import {
  readSessionLinks,
  removeSessionLink,
  resolveSessionLinksFile,
  upsertSessionLink
} from "../lib/session-links.js";
import { showIntro, showOutro } from "../ui/feedback.js";

export function registerSessionsCommand(program: Command): void {
  const sessions = program
    .command("sessions")
    .description("Inspect and manage looply session links for multi-session workflows");

  sessions
    .command("list")
    .description("List linked sessions")
    .option("--dir <dir>", "Target directory for session links (defaults to current directory)")
    .action(async (options) => {
      showIntro("looply sessions");
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const file = resolveSessionLinksFile(targetRoot);
      const document = await readSessionLinks(targetRoot);

      if (document.sessions.length === 0) {
        showOutro(`No linked sessions found in ${file}`);
        return;
      }

      for (const session of document.sessions) {
        console.log(chalk.bold(session.label));
        console.log(`feature: ${chalk.cyan(session.feature)}`);
        if (session.workflow) {
          console.log(`workflow: ${chalk.cyan(session.workflow)}`);
        }
        if (session.lastCommand) {
          console.log(`last command: ${chalk.cyan(session.lastCommand)}`);
        }
        if (session.lastUpdatedAt) {
          console.log(chalk.dim(`updated: ${session.lastUpdatedAt}`));
        }
        console.log("");
      }

      showOutro(`Showing ${document.sessions.length} linked session(s) from ${file}`);
    });

  sessions
    .command("link")
    .description("Link a session label to a feature")
    .argument("<label>", "Session label, such as backend-afternoon")
    .argument("<feature>", "Feature name, such as pix-webhook-retry")
    .option("--workflow <workflow>", "Workflow name, such as story-to-production")
    .option("--last-command <command>", "Last command used for this session")
    .option("--dir <dir>", "Target directory for session links (defaults to current directory)")
    .action(async (label, feature, options) => {
      showIntro("looply sessions");
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const file = await upsertSessionLink(targetRoot, {
        label,
        feature,
        workflow: options.workflow,
        lastCommand: options.lastCommand
      });
      showOutro(`Linked session ${label} to feature ${feature} in ${file}`);
    });

  sessions
    .command("unlink")
    .description("Remove a linked session label")
    .argument("<label>", "Session label to remove")
    .option("--dir <dir>", "Target directory for session links (defaults to current directory)")
    .action(async (label, options) => {
      showIntro("looply sessions");
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const file = await removeSessionLink(targetRoot, label);
      showOutro(`Removed session ${label} from ${file}`);
    });
}
