import type { Command } from "commander";
import path from "node:path";
import { runInstallFlow } from "../lib/install-flow.js";
import { resolveLooplySourceRoot } from "../lib/source-root.js";
import { showIntro } from "../ui/feedback.js";

export function registerInstallCommand(program: Command): void {
  program
    .command("install")
    .description("Install a looply pack into one or more target hosts")
    .option("--host <host>", "Target host list such as codex,claude")
    .option("--scope <scope>", "Installation scope such as project or global")
    .option("--pack <pack>", "Pack name")
    .option("--locale <locale>", "Output locale such as pt-BR or en")
    .option("--project-mode <mode>", "Project mode such as existing-project or greenfield")
    .option("--interaction-mode <mode>", "Interaction mode such as guided, balanced or autonomous")
    .option("--enable-shell-autocomplete", "Enable shell autocomplete after install")
    .option("--dir <dir>", "Target directory for project scope install (defaults to current directory)")
    .option("--source-root <dir>", "looply source directory that contains packs/")
    .option("--yes", "Skip confirmation and use resolved values")
    .action(async (options) => {
      showIntro("looply install");
      await runInstallFlow({
        sourceRoot: resolveLooplySourceRoot(options.sourceRoot),
        currentWorkingDirectory: path.resolve(options.dir ?? process.cwd()),
        hostOption: options.host,
        scopeOption: options.scope,
        packOption: options.pack,
        localeOption: options.locale,
        projectModeOption: options.projectMode,
        interactionModeOption: options.interactionMode,
        enableShellAutocomplete: options.enableShellAutocomplete,
        yes: options.yes
      });
    });
}
