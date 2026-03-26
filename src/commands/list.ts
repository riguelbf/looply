import type { Command } from "commander";
import chalk from "chalk";
import { loadArtifactCatalog, type CatalogArtifactType } from "../lib/artifact-catalog.js";
import { resolveLooplySourceRoot } from "../lib/source-root.js";
import { createSpinner, showIntro, showOutro } from "../ui/feedback.js";

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List available packs and artifacts")
    .argument("[artifactType]", "Artifact type to list")
    .option("--source-root <dir>", "looply source directory that contains packs/")
    .action(async (artifactType: string | undefined, options) => {
      showIntro("looply list");
      const loading = createSpinner("Loading artifact catalog");
      const artifacts = await loadArtifactCatalog(resolveLooplySourceRoot(options.sourceRoot));
      loading.stop("Artifact catalog loaded");

      const filtered = artifactType
        ? artifacts.filter((artifact) => artifact.type === artifactType)
        : artifacts;

      if (filtered.length === 0) {
        showOutro(`No artifacts found for ${artifactType ?? "current selection"}`);
        return;
      }

      if (!artifactType) {
        const groups = groupByType(filtered);
        for (const [type, items] of Object.entries(groups)) {
          console.log(chalk.bold(type));
          for (const item of items) {
            console.log(`- ${item.name} ${chalk.dim(`(${item.pack})`)}`);
          }
        }
      } else {
        for (const item of filtered) {
          console.log(`- ${item.name} ${chalk.dim(`(${item.pack})`)}`);
        }
      }

      showOutro(`Listed ${filtered.length} artifact(s)`);
    });
}

function groupByType(artifacts: Array<{ type: CatalogArtifactType; name: string; pack: string }>) {
  return artifacts.reduce<Record<string, Array<{ type: CatalogArtifactType; name: string; pack: string }>>>(
    (accumulator, artifact) => {
      accumulator[artifact.type] ??= [];
      accumulator[artifact.type].push(artifact);
      return accumulator;
    },
    {}
  );
}
