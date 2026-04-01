import type { InferencePolicy } from "../project-context.js";
import type { ProjectMode } from "../host-publisher.js";

export const CODE_CONTEXT_VERSION = 1 as const;

export type CodeContextProviderId =
  | "dotnet-csharp"
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "yaml"
  | "shell";

export type CodeContextCoverage = "none" | "discovery" | "semantic";
export type CodeContextProviderStatus = "detected" | "unavailable";
export type CodeContextWorkspaceKind = "solution" | "project";
export type CodeContextConfidence = "high" | "medium";

export interface CodeContextProviderSummary {
  id: CodeContextProviderId;
  language: string;
  executable: string;
  executableAvailable: boolean;
  status: CodeContextProviderStatus;
  detectedRootCount: number;
  notes: string[];
}

export interface CodeContextWorkspaceRoot {
  id: string;
  providerId: CodeContextProviderId;
  language: string;
  root: string;
  kind: CodeContextWorkspaceKind;
  markers: string[];
  confidence: CodeContextConfidence;
}

export interface CodeContextModule {
  id: string;
  providerId: CodeContextProviderId;
  language: string;
  label: string;
  root: string;
  files: string[];
  publicSymbols: string[];
  dependsOnModules: string[];
  dependedOnByModules: string[];
  entryFiles: string[];
  testFiles: string[];
  confidence: CodeContextConfidence;
}

export interface CodeContextSymbol {
  providerId: CodeContextProviderId;
  language: string;
  name: string;
  kind: string;
  file: string;
  exported: boolean;
  references: number | null;
}

export interface CodeContextRelation {
  providerId: CodeContextProviderId;
  type: string;
  from: string;
  to: string;
}

export interface CodeContextEntrypoint {
  providerId: CodeContextProviderId;
  language: string;
  file: string;
  symbols: string[];
}

export interface CodeContextRelatedTest {
  providerId: CodeContextProviderId;
  language: string;
  source: string;
  test: string;
}

export interface CodeContextDiagnostic {
  providerId: CodeContextProviderId;
  severity: "info" | "warning" | "error";
  message: string;
}

export interface CodeContextDocument {
  version: typeof CODE_CONTEXT_VERSION;
  generatedAt: string;
  targetRoot: string;
  primaryContextRoot: string;
  projectMode: ProjectMode;
  inferencePolicy: InferencePolicy;
  coverage: CodeContextCoverage;
  providers: CodeContextProviderSummary[];
  workspaceRoots: CodeContextWorkspaceRoot[];
  modules: CodeContextModule[];
  symbols: CodeContextSymbol[];
  relations: CodeContextRelation[];
  entrypoints: CodeContextEntrypoint[];
  relatedTests: CodeContextRelatedTest[];
  diagnostics: CodeContextDiagnostic[];
  notes: string[];
}
