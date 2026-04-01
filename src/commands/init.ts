import type { Command } from "commander";
import { confirm, isCancel, text } from "@clack/prompts";
import path from "node:path";
import fs from "fs-extra";
import { runInstallFlow } from "../lib/install-flow.js";
import { addProfileOption, resolvePerfMode } from "../lib/perf/config.js";
import { runWithPerfSession, withPerfSpan } from "../lib/perf/session.js";
import { resolveLooplySourceRoot } from "../lib/source-root.js";
import { createSpinner, showIntro, showOutro } from "../ui/feedback.js";

export function registerInitCommand(program: Command): void {
  addProfileOption(program
    .command("init")
    .description("Bootstrap looply files in the current repository")
    .option("--dir <dir>", "Target directory")
    .option("--source-root <dir>", "looply source directory that contains packs/")
    .option("--yes", "Skip confirmation")
    .option("--host <host>", "Target host list such as codex,claude")
    .option("--scope <scope>", "Installation scope such as project or global")
    .option("--pack <pack>", "Pack name")
    .option("--locale <locale>", "Output locale such as pt-BR or en")
    .option("--project-mode <mode>", "Project mode such as existing-project or greenfield")
    .option("--interaction-mode <mode>", "Interaction mode such as guided, balanced or autonomous")
    .option("--enable-shell-autocomplete", "Enable shell autocomplete after install"))
    .action(async (options) => {
      showIntro("looply init");
      const targetDirectory = await resolveTargetDirectory(options.dir);
      if (!targetDirectory) {
        return;
      }

      await runWithPerfSession({
        command: "init",
        mode: resolvePerfMode(options.profile),
        targetRoot: targetDirectory,
        metadata: {
          yes: Boolean(options.yes)
        }
      }, async () => {
        const shouldProceed = options.yes
          ? true
          : await confirm({
              message: `Create looply bootstrap structure in ${targetDirectory}?`,
              initialValue: true
            });

        if (isCancel(shouldProceed) || !shouldProceed) {
          showOutro("Initialization cancelled");
          return;
        }

        const loading = createSpinner("Creating bootstrap structure");
        await withPerfSpan("init.create-bootstrap-structure", async () => {
          await createBootstrapStructure(targetDirectory);
        });
        loading.stop("Bootstrap structure created");

        const installAfterInit = options.yes
          ? true
          : await confirm({
              message: "Install a looply pack now?",
              initialValue: true
            });

        if (isCancel(installAfterInit) || !installAfterInit) {
          showOutro(`Initialized looply in ${targetDirectory}`);
          return;
        }

        await runInstallFlow({
          sourceRoot: resolveLooplySourceRoot(options.sourceRoot),
          currentWorkingDirectory: targetDirectory,
          hostOption: options.host,
          scopeOption: options.scope ?? "project",
          packOption: options.pack ?? "software-delivery-suite",
          localeOption: options.locale,
          projectModeOption: options.projectMode,
          interactionModeOption: options.interactionMode,
          enableShellAutocomplete: options.enableShellAutocomplete,
          yes: options.yes
        });
      });
    });
}

async function resolveTargetDirectory(currentDir?: string): Promise<string | undefined> {
  if (currentDir) {
    return path.resolve(currentDir);
  }

  const answer = await text({
    message: "Where should looply be initialized?",
    placeholder: process.cwd(),
    initialValue: process.cwd()
  });

  if (isCancel(answer)) {
    showOutro("Initialization cancelled");
    return undefined;
  }

  return path.resolve(answer);
}

async function createBootstrapStructure(targetDirectory: string): Promise<void> {
  const directories = [
    "packs",
    "platform/contracts",
    "platform/manifests",
    "docs/specs",
    "docs/adr"
  ];

  for (const directory of directories) {
    await fs.ensureDir(path.join(targetDirectory, directory));
  }

  const readmeFile = path.join(targetDirectory, "README.md");
  const ideaFile = path.join(targetDirectory, "idea.md");

  if (!(await fs.pathExists(readmeFile))) {
    await fs.writeFile(
      readmeFile,
      "# looply Project\n\nThis repository was initialized with looply bootstrap files.\n",
      "utf8"
    );
  }

  if (!(await fs.pathExists(ideaFile))) {
    await fs.writeFile(
      ideaFile,
      "# Idea\n\nCapture the product idea and implementation roadmap here.\n",
      "utf8"
    );
  }
}
