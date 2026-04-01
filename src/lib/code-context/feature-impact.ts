import type { FeatureWorkflowState } from "../feature-workflow-state.js";
import type { CodeContextDocument } from "./schema.js";

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
