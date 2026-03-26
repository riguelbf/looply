import type { Command } from "commander";
import chalk from "chalk";
import { loadArtifactCatalog } from "../lib/artifact-catalog.js";
import { resolveLooplySourceRoot } from "../lib/source-root.js";
import { createSpinner, showIntro, showOutro } from "../ui/feedback.js";

export function registerInspectCommand(program: Command): void {
  program
    .command("inspect")
    .description("Inspect a single artifact")
    .argument("<artifactType>", "Artifact type")
    .argument("<name>", "Artifact name")
    .option("--source-root <dir>", "looply source directory that contains packs/")
    .action(async (artifactType, name, options) => {
      showIntro("looply inspect");
      const loading = createSpinner("Loading artifact details");
      const artifacts = await loadArtifactCatalog(resolveLooplySourceRoot(options.sourceRoot));
      loading.stop("Artifact catalog loaded");

      const artifact = artifacts.find((item) => item.type === artifactType && item.name === name);

      if (!artifact) {
        showOutro(`Artifact not found: ${artifactType} ${name}`);
        process.exitCode = 1;
        return;
      }

      console.log(chalk.bold(`${artifact.type}: ${artifact.name}`));
      console.log(chalk.dim(artifact.file));
      if (artifact.summary) {
        console.log(artifact.summary);
      }
      if (artifact.schema) {
        console.log(`schema: ${chalk.cyan(artifact.schema)}`);
      }
      console.log(`pack: ${chalk.cyan(artifact.pack)}`);
      console.log("frontmatter:");
      console.log(JSON.stringify(artifact.frontmatter, null, 2));

      showOutro("Artifact inspection complete");
    });
}
