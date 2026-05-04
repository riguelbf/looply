import { inferInferencePolicy, readProjectContextFile } from "../project-context.js";
import { isContextPerfMode, setPerfMetadata, withPerfSpan } from "../perf/session.js";
import { discoverCodeContext } from "./discovery.js";
import { analyzeWorkspace } from "./providers/index.js";
import { CODE_CONTEXT_VERSION, type CodeContextDocument } from "./schema.js";
import { writeCodeContext, writeKnowledgeGraph } from "./storage.js";
import { resolveModuleDependencies } from "./resolve-deps.js";
import { buildKnowledgeGraph, mergeNodes } from "./graph-builder.js";
import { extractDatabaseSchema } from "./providers/database.js";

export interface RefreshCodeContextResult {
  targetRoot: string;
  primaryContextRoot: string;
  projectMode: "existing-project" | "greenfield";
  inferencePolicy: ReturnType<typeof inferInferencePolicy>;
  codeContextFile: string;
  providerCount: number;
  workspaceRootCount: number;
  knowledgeGraphFile?: string;
}

export interface RefreshCodeContextOptions {
  skipGraph?: boolean;
}

export async function refreshCodeContext(
  targetRoot: string,
  options: RefreshCodeContextOptions = {}
): Promise<RefreshCodeContextResult> {
  const projectContext = await withPerfSpan("code-context.load-project-context", async () => readProjectContextFile(targetRoot));
  const projectMode = projectContext?.mode ?? "existing-project";
  const primaryContextRoot = projectContext?.primaryContextRoot ?? targetRoot;
  const inferencePolicy = projectContext?.inferencePolicy ?? inferInferencePolicy(projectMode);
  const discovery = await withPerfSpan("code-context.discover-workspaces", async () => discoverCodeContext(primaryContextRoot));
  const analyses = await withPerfSpan("code-context.analyze-workspaces", async () => Promise.all(
    discovery.workspaceRoots.map((workspace) => analyzeWorkspace(primaryContextRoot, workspace))
  ), { workspaceCount: discovery.workspaceRoots.length });

  const modules = analyses.flatMap((analysis) => analysis.modules);
  const symbols = analyses.flatMap((analysis) => analysis.symbols);
  const relations = analyses.flatMap((analysis) => analysis.relations);
  const entrypoints = analyses.flatMap((analysis) => analysis.entrypoints);
  const relatedTests = analyses.flatMap((analysis) => analysis.relatedTests);
  const diagnostics = analyses.flatMap((analysis) => analysis.diagnostics);
  const coverage = modules.length > 0 || symbols.length > 0 || entrypoints.length > 0 ? "semantic" : "discovery";
  setPerfMetadata("code-context.projectMode", projectMode);
  setPerfMetadata("code-context.providerCount", discovery.providers.filter((provider) => provider.detectedRootCount > 0).length);
  setPerfMetadata("code-context.workspaceRootCount", discovery.workspaceRoots.length);
  setPerfMetadata("code-context.moduleCount", modules.length);
  setPerfMetadata("code-context.symbolCount", symbols.length);
  setPerfMetadata("code-context.coverage", coverage);
  if (isContextPerfMode()) {
    setPerfMetadata("code-context.entrypointCount", entrypoints.length);
    setPerfMetadata("code-context.relatedTestCount", relatedTests.length);
    setPerfMetadata("code-context.diagnosticCount", diagnostics.length);
  }

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

  const codeContextFile = await withPerfSpan("code-context.write-document", async () => writeCodeContext(targetRoot, document));

  let knowledgeGraphFile: string | undefined;

  if (!options.skipGraph) {
    try {
      const resolvedModules = resolveModuleDependencies(document, primaryContextRoot);
      document.modules = resolvedModules;

      const graph = buildKnowledgeGraph(document, primaryContextRoot);

      const dbResult = await extractDatabaseSchema(primaryContextRoot);
      if (dbResult.nodes.length > 0) {
        mergeNodes(graph, dbResult.nodes, dbResult.edges);
      }

      setPerfMetadata("knowledge-graph.nodeCount", graph.nodes.length);
      setPerfMetadata("knowledge-graph.edgeCount", graph.edges.length);
      setPerfMetadata("knowledge-graph.dbNodeCount", dbResult.nodes.length);

      knowledgeGraphFile = await writeKnowledgeGraph(targetRoot, graph);
    } catch (error) {
      setPerfMetadata("knowledge-graph.error", String(error));
    }
  }

  return {
    targetRoot,
    primaryContextRoot,
    projectMode,
    inferencePolicy,
    codeContextFile,
    knowledgeGraphFile,
    providerCount: discovery.providers.filter((provider) => provider.detectedRootCount > 0).length,
    workspaceRootCount: discovery.workspaceRoots.length
  };
}
