import { inferInferencePolicy, readProjectContextFile } from "../project-context.js";
import { discoverCodeContext } from "./discovery.js";
import { analyzeWorkspace } from "./providers/index.js";
import { CODE_CONTEXT_VERSION, type CodeContextDocument } from "./schema.js";
import { writeCodeContext } from "./storage.js";

export interface RefreshCodeContextResult {
  targetRoot: string;
  primaryContextRoot: string;
  projectMode: "existing-project" | "greenfield";
  inferencePolicy: ReturnType<typeof inferInferencePolicy>;
  codeContextFile: string;
  providerCount: number;
  workspaceRootCount: number;
}

export async function refreshCodeContext(targetRoot: string): Promise<RefreshCodeContextResult> {
  const projectContext = await readProjectContextFile(targetRoot);
  const projectMode = projectContext?.mode ?? "existing-project";
  const primaryContextRoot = projectContext?.primaryContextRoot ?? targetRoot;
  const inferencePolicy = projectContext?.inferencePolicy ?? inferInferencePolicy(projectMode);
  const discovery = await discoverCodeContext(primaryContextRoot);
  const analyses = await Promise.all(
    discovery.workspaceRoots.map((workspace) => analyzeWorkspace(primaryContextRoot, workspace))
  );

  const modules = analyses.flatMap((analysis) => analysis.modules);
  const symbols = analyses.flatMap((analysis) => analysis.symbols);
  const relations = analyses.flatMap((analysis) => analysis.relations);
  const entrypoints = analyses.flatMap((analysis) => analysis.entrypoints);
  const relatedTests = analyses.flatMap((analysis) => analysis.relatedTests);
  const diagnostics = analyses.flatMap((analysis) => analysis.diagnostics);
  const coverage = modules.length > 0 || symbols.length > 0 || entrypoints.length > 0 ? "semantic" : "discovery";

  const document: CodeContextDocument = {
    version: CODE_CONTEXT_VERSION,
    generatedAt: new Date().toISOString(),
    targetRoot,
    primaryContextRoot,
    projectMode,
    inferencePolicy,
    coverage,
    providers: discovery.providers,
    workspaceRoots: discovery.workspaceRoots,
    modules,
    symbols,
    relations,
    entrypoints,
    relatedTests,
    diagnostics,
    notes: [
      ...discovery.notes,
      coverage === "semantic"
        ? "Semantic extraction is enabled for detected workspaces."
        : "No semantic structures were extracted from the detected workspaces."
    ]
  };

  const codeContextFile = await writeCodeContext(targetRoot, document);

  return {
    targetRoot,
    primaryContextRoot,
    projectMode,
    inferencePolicy,
    codeContextFile,
    providerCount: discovery.providers.filter((provider) => provider.detectedRootCount > 0).length,
    workspaceRootCount: discovery.workspaceRoots.length
  };
}
