import path from "node:path";
import type { CodeContextEntrypoint, CodeContextSymbol, CodeContextWorkspaceRoot } from "../schema.js";
import {
  buildModules,
  buildRelatedTests,
  collectWorkspaceFiles,
  createEmptyWorkspaceDiagnostic,
  isTestFile,
  readFiles,
  toRelativePath,
  type WorkspaceAnalysisResult
} from "./shared.js";

export async function analyzeJavaWorkspace(
  primaryContextRoot: string,
  workspace: CodeContextWorkspaceRoot
): Promise<WorkspaceAnalysisResult> {
  const files = await collectWorkspaceFiles(primaryContextRoot, workspace, ["**/*.java"]);
  if (files.length === 0) {
    return {
      modules: [],
      symbols: [],
      relations: [],
      entrypoints: [],
      relatedTests: [],
      diagnostics: [createEmptyWorkspaceDiagnostic(workspace, "No Java source files found.")]
    };
  }

  const loadedFiles = await readFiles(files);
  const sourceFiles = loadedFiles.map(({ file }) => toRelativePath(primaryContextRoot, file));
  const symbols: CodeContextSymbol[] = [];
  const entrypoints: CodeContextEntrypoint[] = [];

  for (const { file, source } of loadedFiles) {
    const relativeFile = toRelativePath(primaryContextRoot, file);
    for (const symbol of extractJavaSymbols(relativeFile, source, workspace)) {
      symbols.push(symbol);
    }
    if (path.basename(file) === "Main.java" || /public\s+static\s+void\s+main\s*\(/.test(source)) {
      entrypoints.push({
        providerId: workspace.providerId,
        language: workspace.language,
        file: relativeFile,
        symbols: symbols.filter((symbol) => symbol.file === relativeFile && symbol.exported).map((symbol) => symbol.name)
      });
    }
  }

  const testFiles = sourceFiles.filter((file) => isTestFile(file));
  const nonTestFiles = sourceFiles.filter((file) => !isTestFile(file));
  const relatedTests = buildRelatedTests(workspace.providerId, workspace.language, nonTestFiles, testFiles);
  const modules = buildModules({
    primaryContextRoot,
    workspace,
    sourceFiles: nonTestFiles,
    symbols,
    entrypoints,
    relatedTests
  });

  return {
    modules,
    symbols,
    relations: [],
    entrypoints,
    relatedTests,
    diagnostics: []
  };
}

function extractJavaSymbols(
  file: string,
  source: string,
  workspace: CodeContextWorkspaceRoot
): CodeContextSymbol[] {
  const regexes = [
    /public\s+class\s+([A-Z][A-Za-z0-9_]*)/g,
    /public\s+interface\s+([A-Z][A-Za-z0-9_]*)/g,
    /public\s+record\s+([A-Z][A-Za-z0-9_]*)/g,
    /public\s+enum\s+([A-Z][A-Za-z0-9_]*)/g
  ];

  return regexes.flatMap((regex) =>
    Array.from(source.matchAll(regex)).map((match) => ({
      providerId: workspace.providerId,
      language: workspace.language,
      name: match[1],
      kind: inferJavaKind(match[0]),
      file,
      exported: true,
      references: null
    }))
  );
}

function inferJavaKind(source: string): string {
  if (source.includes("interface")) return "interface";
  if (source.includes("record")) return "record";
  if (source.includes("enum")) return "enum";
  return "class";
}
