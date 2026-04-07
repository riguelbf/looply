import path from "node:path";
import fs from "fs-extra";
import type { CatalogArtifact } from "./artifact-catalog.js";
import { listWorkflowCommands } from "./workflow-commands.js";
import { listCatalogExamples } from "./example-catalog.js";
import { type ExamplePolicySource, resolveEffectiveExamplePolicy } from "./example-policy.js";
import { selectExamplesForWorkflow, type SelectedExample } from "./example-selection.js";
import type { InteractionMode, OutputLocale, ProjectMode, SupportedHost } from "./host-publisher.js";

export interface ExampleIndexDocument {
  version: 1;
  generatedAt: string;
  pack: string;
  effectiveMode: "on" | "reduced" | "off";
  modeSource: ExamplePolicySource;
  availableExampleCount: number;
  selectedExampleCount: number;
  examples: Array<{
    name: string;
    pack: string;
    file: string;
    summary?: string;
    kind: string;
    quality: string;
  }>;
}

export interface ExampleHintsDocument {
  version: 1;
  generatedAt: string;
  host: SupportedHost;
  effectiveMode: "on" | "reduced" | "off";
  commands: Array<{
    alias: string;
    workflowName: string;
    selectedExamples: SelectedExample[];
  }>;
}

export function resolveExampleIndexFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "example-index.json");
}

export function resolveExampleHintsFile(targetRoot: string, host: SupportedHost): string {
  return path.join(targetRoot, ".looply", "state", `example-hints.${host}.json`);
}

export async function writeExampleDocuments(input: {
  targetRoot: string;
  host: SupportedHost;
  pack: string;
  packClosure: string[];
  artifacts: CatalogArtifact[];
  outputLocale: OutputLocale;
  projectMode: ProjectMode;
  interactionMode: InteractionMode;
}): Promise<{
  indexFile: string;
  hintsFile: string;
  effectiveMode: "on" | "reduced" | "off";
  modeSource: ExamplePolicySource;
  selectedByAlias: Map<string, SelectedExample[]>;
}> {
  const policy = await resolveEffectiveExamplePolicy(input.targetRoot);
  const examples = listCatalogExamples({
    artifacts: input.artifacts,
    pack: input.pack,
    packClosure: input.packClosure
  });
  const commands = listWorkflowCommands({
    pack: input.pack,
    artifacts: input.artifacts,
    packClosure: input.packClosure
  });

  const selectedByAlias = new Map<string, SelectedExample[]>();
  const hintCommands = commands.map((command) => {
    const selection = selectExamplesForWorkflow({
      artifacts: input.artifacts,
      pack: input.pack,
      packClosure: input.packClosure,
      workflowName: command.workflowName,
      host: input.host,
      outputLocale: input.outputLocale,
      projectMode: input.projectMode,
      interactionMode: input.interactionMode,
      mode: policy.mode
    });
    selectedByAlias.set(command.alias, selection.selected);
    return {
      alias: command.alias,
      workflowName: command.workflowName,
      selectedExamples: selection.selected
    };
  });

  const indexFile = resolveExampleIndexFile(input.targetRoot);
  const hintsFile = resolveExampleHintsFile(input.targetRoot, input.host);
  await fs.ensureDir(path.dirname(indexFile));
  await fs.writeJson(indexFile, {
    version: 1,
    generatedAt: new Date().toISOString(),
    pack: input.pack,
    effectiveMode: policy.mode,
    modeSource: policy.source,
    availableExampleCount: examples.length,
    selectedExampleCount: hintCommands.reduce((total, command) => total + command.selectedExamples.length, 0),
    examples: examples.map((example) => ({
      name: example.name,
      pack: example.pack,
      file: example.file.replaceAll(path.sep, "/"),
      summary: example.summary,
      kind: example.frontmatter.kind,
      quality: example.frontmatter.quality
    }))
  } satisfies ExampleIndexDocument, { spaces: 2 });
  await fs.writeJson(hintsFile, {
    version: 1,
    generatedAt: new Date().toISOString(),
    host: input.host,
    effectiveMode: policy.mode,
    commands: hintCommands
  } satisfies ExampleHintsDocument, { spaces: 2 });

  return {
    indexFile,
    hintsFile,
    effectiveMode: policy.mode,
    modeSource: policy.source,
    selectedByAlias
  };
}

export async function readExampleIndexDocument(targetRoot: string): Promise<ExampleIndexDocument | null> {
  const file = resolveExampleIndexFile(targetRoot);
  if (!(await fs.pathExists(file))) {
    return null;
  }

  const raw = await fs.readJson(file);
  if (!raw || typeof raw !== "object") {
    return null;
  }

  return raw as ExampleIndexDocument;
}
