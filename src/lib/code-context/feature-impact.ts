import type { FeatureWorkflowState } from "../feature-workflow-state.js";
import type { CodeContextDocument } from "./schema.js";
import type { KnowledgeGraph } from "./graph-schema.js";
import { createGraphQuery, type GraphQuery } from "./graph-query.js";

const STOPWORDS = new Set([
  "agent",
  "artifact",
  "code",
  "context",
  "current",
  "delivery",
  "feature",
  "flow",
  "gate",
  "implementation",
  "looply",
  "next",
  "production",
  "production-ready",
  "stage",
  "status",
  "story",
  "task",
  "tech",
  "workflow"
]);

export interface FeatureCodeImpact {
  relevantFiles: string[];
  relevantModules: string[];
  relevantSymbols: string[];
  relatedTests: string[];
}

export function deriveFeatureCodeImpact(
  feature: Pick<
    FeatureWorkflowState,
    "feature" | "selectedStory" | "activeArtifact" | "nextTask" | "nextHandoff" | "completedOutputs" | "missingOutputs"
  >,
  codeContext: CodeContextDocument | null
): FeatureCodeImpact {
  return deriveFeatureCodeImpactWithGraph(feature, codeContext, null);
}

export function deriveFeatureCodeImpactWithGraph(
  feature: Pick<
    FeatureWorkflowState,
    "feature" | "selectedStory" | "activeArtifact" | "nextTask" | "nextHandoff" | "completedOutputs" | "missingOutputs"
  >,
  codeContext: CodeContextDocument | null,
  knowledgeGraph: KnowledgeGraph | null
): FeatureCodeImpact {
  if (!codeContext) {
    return {
      relevantFiles: [],
      relevantModules: [],
      relevantSymbols: [],
      relatedTests: []
    };
  }

  const tokens = tokenize([
    feature.feature,
    feature.selectedStory,
    feature.activeArtifact,
    feature.nextTask,
    feature.nextHandoff,
    ...feature.completedOutputs,
    ...feature.missingOutputs
  ].join(" "));

  if (tokens.length === 0) {
    return {
      relevantFiles: [],
      relevantModules: [],
      relevantSymbols: [],
      relatedTests: []
    };
  }

  if (knowledgeGraph) {
    const graphQuery = createGraphQuery(knowledgeGraph);
    const graphResults = deriveFromGraph(graphQuery, codeContext, tokens);
    if (graphResults.relevantModules.length > 0 || graphResults.relevantFiles.length > 0) {
      return graphResults;
    }
  }

  return deriveFromTokenMatching(codeContext, tokens);
}

function deriveFromGraph(
  graphQuery: GraphQuery,
  codeContext: CodeContextDocument,
  tokens: string[]
): FeatureCodeImpact {
  const matchedModuleIds = new Set<string>();
  const matchedFiles = new Set<string>();
  const matchedSymbols = new Set<string>();

  for (const token of tokens) {
    const graphMatches = graphQuery.search(token);

    for (const node of graphMatches) {
      if (node.kind === "module") {
        matchedModuleIds.add(node.id);
        addModuleFiles(node.id, matchedFiles, codeContext);
      } else if (node.kind === "file" && node.file) {
        matchedFiles.add(node.file);
      } else if (node.kind === "table" || node.kind === "column") {
        const moduleNodes = graphQuery.dependentsOf(node.id)
          .filter((n) => n.kind === "module");
        for (const modNode of moduleNodes) {
          matchedModuleIds.add(modNode.id);
          addModuleFiles(modNode.id, matchedFiles, codeContext);
        }
      }
    }
  }

  for (const moduleId of matchedModuleIds) {
    const neighborhood = graphQuery.neighborhood(moduleId, 1);
    for (const node of neighborhood.nodes) {
      if (node.kind === "module") {
        matchedModuleIds.add(node.id);
        addModuleFiles(node.id, matchedFiles, codeContext);
      } else if (node.kind === "file" && node.file) {
        matchedFiles.add(node.file);
      }
    }
  }

  const relevantModules = Array.from(matchedModuleIds)
    .map((id) => codeContext.modules.find((m) => m.id === id)?.label)
    .filter((label): label is string => label !== undefined)
    .slice(0, 4);

  const relevantFiles = Array.from(matchedFiles).slice(0, 10);

  for (const file of relevantFiles) {
    const symbols = codeContext.symbols.filter((s) => s.file === file);
    for (const symbol of symbols) {
      matchedSymbols.add(symbol.name);
    }
  }

  for (const token of tokens) {
    for (const symbol of codeContext.symbols) {
      if (symbol.name.toLowerCase().includes(token)) {
        matchedSymbols.add(symbol.name);
      }
    }
  }

  const relevantSymbols = Array.from(matchedSymbols).slice(0, 12);

  const relatedTests = codeContext.relatedTests
    .filter((item) => relevantFiles.includes(item.source))
    .map((item) => item.test)
    .slice(0, 10);

  return {
    relevantFiles,
    relevantModules,
    relevantSymbols,
    relatedTests
  };
}

function deriveFromTokenMatching(
  codeContext: CodeContextDocument,
  tokens: string[]
): FeatureCodeImpact {
  const matchedModules = codeContext.modules
    .map((module) => ({
      module,
      score: score(module.label, tokens) + score(module.files.join(" "), tokens)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((entry) => entry.module);

  const relevantModules = matchedModules.map((module) => module.label);
  const relevantFiles = Array.from(new Set(matchedModules.flatMap((module) => module.files))).slice(0, 10);
  const relevantSymbols = codeContext.symbols
    .filter((symbol) => relevantFiles.includes(symbol.file) || score(symbol.name, tokens) > 0)
    .map((symbol) => symbol.name)
    .slice(0, 12);
  const relatedTests = codeContext.relatedTests
    .filter((item) => relevantFiles.includes(item.source))
    .map((item) => item.test)
    .slice(0, 10);

  return {
    relevantFiles,
    relevantModules,
    relevantSymbols,
    relatedTests
  };
}

function addModuleFiles(
  moduleId: string,
  fileSet: Set<string>,
  codeContext: CodeContextDocument
): void {
  const module = codeContext.modules.find((m) => m.id === moduleId);
  if (!module) return;
  for (const file of module.files) {
    fileSet.add(file);
  }
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !STOPWORDS.has(token));
}

function score(value: string, tokens: string[]): number {
  const normalized = value.toLowerCase();
  return tokens.reduce((total, token) => total + (normalized.includes(token) ? 1 : 0), 0);
}
