import { Command } from "commander";
import { registerCheckUpdatesCommand } from "./commands/check-updates.js";
import { registerCompletionCommand } from "./commands/completion.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerDocsCommand } from "./commands/docs.js";
import { registerHistoryCommand } from "./commands/history.js";
import { registerInitCommand } from "./commands/init.js";
import { registerIntegrationsCommand } from "./commands/integrations.js";
import { registerInspectCommand } from "./commands/inspect.js";
import { registerInstallCommand } from "./commands/install.js";
import { registerListCommand } from "./commands/list.js";
import { registerReinstallCommand } from "./commands/reinstall.js";
import { registerRefreshContextCommand } from "./commands/refresh-context.js";
import { registerRefreshCodeContextCommand } from "./commands/refresh-code-context.js";
import { registerReconcileCommand } from "./commands/reconcile.js";
import { registerReplayCommand } from "./commands/replay.js";
import { registerRunAgentCommand } from "./commands/run-agent.js";
import { registerRunTaskCommand } from "./commands/run-task.js";
import { registerSessionsCommand } from "./commands/sessions.js";
import { registerStatusCommand } from "./commands/status.js";
import { registerSyncCommand } from "./commands/sync.js";
import { registerUninstallCommand } from "./commands/uninstall.js";
import { registerUpgradeCommand } from "./commands/upgrade.js";
import { registerValidateCommand } from "./commands/validate.js";
import { renderLogo, renderTagline } from "./ui/brand.js";

export function buildProgram(): Command {
  const program = new Command();

  program
    .name("looply")
    .description(`${renderLogo()}\n${renderTagline()}`)
    .version("0.1.0")
    .showHelpAfterError("(use --help for command details)")
    .showSuggestionAfterError();

  registerInitCommand(program);
  registerInstallCommand(program);
  registerUninstallCommand(program);
  registerReinstallCommand(program);
  registerRefreshContextCommand(program);
  registerRefreshCodeContextCommand(program);
  registerReplayCommand(program);
  registerRunTaskCommand(program);
  registerRunAgentCommand(program);
  registerReconcileCommand(program);
  registerSessionsCommand(program);
  registerStatusCommand(program);
  registerCheckUpdatesCommand(program);
  registerUpgradeCommand(program);
  registerSyncCommand(program);
  registerValidateCommand(program);
  registerDoctorCommand(program);
  registerDocsCommand(program);
  registerHistoryCommand(program);
  registerIntegrationsCommand(program);
  registerListCommand(program);
  registerInspectCommand(program);
  registerCompletionCommand(program);

  return program;
}
