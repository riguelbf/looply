import type { Command } from "commander";
import { createSpinner, showIntro, showOutro } from "../ui/feedback.js";
import { resolveLooplySourceRoot } from "../lib/source-root.js";
import {
  docsDistExists,
  docsSiteExists,
  openDocsIndex,
  resolveDocsDistIndex,
  resolveDocsSiteRoot,
  runDocsScript
} from "../lib/docs-site.js";

export function registerDocsCommand(program: Command): void {
  const docs = program
    .command("docs")
    .description("Operate the looply documentation module");

  docs
    .command("generate")
    .description("Generate reference pages for the documentation module")
    .option("--source-root <dir>", "looply source directory")
    .action(async (options) => {
      showIntro("looply docs");
      const sourceRoot = resolveLooplySourceRoot(options.sourceRoot);
      assertDocsSiteExists(sourceRoot);
      const loading = createSpinner("Generating documentation reference");
      await runDocsScript(sourceRoot, "generate");
      loading.stop("Documentation reference generated");
      showOutro(`Docs source: ${resolveDocsSiteRoot(sourceRoot)}`);
    });

  docs
    .command("build")
    .description("Build the VitePress documentation site")
    .option("--source-root <dir>", "looply source directory")
    .action(async (options) => {
      showIntro("looply docs");
      const sourceRoot = resolveLooplySourceRoot(options.sourceRoot);
      assertDocsSiteExists(sourceRoot);
      const loading = createSpinner("Building documentation site");
      await runDocsScript(sourceRoot, "build");
      loading.stop("Documentation site built");
      showOutro(`Docs build: ${resolveDocsDistIndex(sourceRoot)}`);
    });

  docs
    .command("serve")
    .description("Start the VitePress development server")
    .option("--source-root <dir>", "looply source directory")
    .action(async (options) => {
      showIntro("looply docs");
      const sourceRoot = resolveLooplySourceRoot(options.sourceRoot);
      assertDocsSiteExists(sourceRoot);
      showOutro(`Starting docs dev server in ${resolveDocsSiteRoot(sourceRoot)}`);
      await runDocsScript(sourceRoot, "dev");
    });

  docs
    .command("open")
    .description("Open the documentation site in the default browser, building it automatically when needed")
    .option("--source-root <dir>", "looply source directory")
    .option("--rebuild", "Rebuild the documentation site before opening")
    .option("--print-only", "Only print the built docs path without opening a browser")
    .action(async (options) => {
      showIntro("looply docs");
      const sourceRoot = resolveLooplySourceRoot(options.sourceRoot);
      assertDocsSiteExists(sourceRoot);

      await ensureDocsBuilt(sourceRoot, Boolean(options.rebuild));

      const target = resolveDocsDistIndex(sourceRoot);
      if (options.printOnly) {
        showOutro(target);
        return;
      }

      try {
        const result = await openDocsIndex(sourceRoot);
        if (result.opened) {
          showOutro(`Opened docs: ${result.targetUrl}`);
          return;
        }

        showOutro(`Docs are available at ${result.targetUrl}`);
      } catch {
        showOutro(`Docs are available at ${target}`);
      }
    });
}

function assertDocsSiteExists(sourceRoot: string): void {
  if (!docsSiteExists(sourceRoot)) {
    throw new Error(`No docs-site module found in ${sourceRoot}`);
  }
}

async function ensureDocsBuilt(sourceRoot: string, forceRebuild: boolean): Promise<void> {
  if (!forceRebuild && docsDistExists(sourceRoot)) {
    return;
  }

  const loading = createSpinner(forceRebuild ? "Rebuilding documentation site" : "Building documentation site");
  await runDocsScript(sourceRoot, "build");
  loading.stop(forceRebuild ? "Documentation site rebuilt" : "Documentation site built");
}
