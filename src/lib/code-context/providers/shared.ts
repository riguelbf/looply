import path from "node:path";
import fs from "fs-extra";
import { globby } from "globby";
import type {
  CodeContextDiagnostic,
  CodeContextEntrypoint,
  CodeContextModule,
  CodeContextRelation,
  CodeContextRelatedTest,
  CodeContextSymbol,
  CodeContextWorkspaceRoot
} from "../schema.js";
import { CODE_CONTEXT_IGNORED_GLOBS } from "./base.js";

const MAX_FILES_PER_WORKSPACE = 250;

export interface WorkspaceAnalysisResult {
  modules: CodeContextModule[];
  symbols: CodeContextSymbol[];
  relations: CodeContextRelation[];
  entrypoints: CodeContextEntrypoint[];
  relatedTests: CodeContextRelatedTest[];
  diagnostics: CodeContextDiagnostic[];
}

export async function collectWorkspaceFiles(
  primaryContextRoot: string,
  workspace: CodeContextWorkspaceRoot,
  patterns: string[]
): Promise<string[]> {
  const absoluteRoot = path.resolve(primaryContextRoot, workspace.root);
  const files = await globby(patterns, {
    cwd: absoluteRoot,
    absolute: true,
    onlyFiles: true,
    dot: true,
    ignore: CODE_CONTEXT_IGNORED_GLOBS
  });

  return files.slice(0, MAX_FILES_PER_WORKSPACE);
}

export async function readFiles(files: string[]): Promise<Array<{ file: string; source: string }>> {
  return Promise.all(
    files.map(async (file) => ({
      file,
      source: await fs.readFile(file, "utf8")
    }))
  );
}

export function toRelativePath(primaryContextRoot: string, file: string): string {
  return path.relative(primaryContextRoot, file).split(path.sep).join("/");
}

export function isTestFile(file: string): boolean {
  return /(^|\/)(__tests__|tests)\//.test(file) || /\.(test|spec)\./.test(file) || /Test\.[A-Za-z0-9]+$/.test(file);
}

export function basenameWithoutKnownSuffix(file: string): string {
  const base = path.basename(file).replace(/\.[^.]+$/, "");
  return base
    .replace(/(\.test|\.spec)$/i, "")
    .replace(/Test$/i, "")
    .replace(/Tests$/i, "");
}

export function buildRelatedTests(
  providerId: CodeContextWorkspaceRoot["providerId"],
  language: string,
  sourceFiles: string[],
  testFiles: string[]
): CodeContextRelatedTest[] {
  const testsByBase = new Map<string, string[]>();
  for (const testFile of testFiles) {
    const key = basenameWithoutKnownSuffix(testFile).toLowerCase();
    const bucket = testsByBase.get(key) ?? [];
    bucket.push(testFile);
    testsByBase.set(key, bucket);
  }

  const relatedTests: CodeContextRelatedTest[] = [];
  for (const sourceFile of sourceFiles) {
    const key = basenameWithoutKnownSuffix(sourceFile).toLowerCase();
    for (const testFile of testsByBase.get(key) ?? []) {
      relatedTests.push({
        providerId,
        language,
        source: sourceFile,
        test: testFile
      });
    }
  }

  return relatedTests;
}

export function buildModules(input: {
  primaryContextRoot: string;
  workspace: CodeContextWorkspaceRoot;
  sourceFiles: string[];
  symbols: CodeContextSymbol[];
  entrypoints: CodeContextEntrypoint[];
  relatedTests: CodeContextRelatedTest[];
}): CodeContextModule[] {
  const grouped = new Map<string, Set<string>>();

  for (const file of input.sourceFiles) {
    const relWithinRoot = input.workspace.root === "."
      ? file
      : path.relative(input.workspace.root, file).split(path.sep).join("/");
    const segments = relWithinRoot.split("/").filter(Boolean);
    const moduleKey = segments.length >= 2 ? `${segments[0]}/${segments[1]}` : segments[0] ?? input.workspace.root;
    const bucket = grouped.get(moduleKey) ?? new Set<string>();
    bucket.add(file);
    grouped.set(moduleKey, bucket);
  }

  return Array.from(grouped.entries()).map(([moduleKey, files]) => {
    const fileList = Array.from(files).sort();
    const publicSymbols = input.symbols
      .filter((symbol) => fileList.includes(symbol.file) && symbol.exported)
      .map((symbol) => symbol.name)
      .sort();
    const entryFiles = input.entrypoints
      .filter((entrypoint) => fileList.includes(entrypoint.file))
      .map((entrypoint) => entrypoint.file)
      .sort();
    const testFiles = input.relatedTests
      .filter((item) => fileList.includes(item.source))
      .map((item) => item.test)
      .sort();

    return {
      id: `${input.workspace.id}:${moduleKey}`,
      providerId: input.workspace.providerId,
      language: input.workspace.language,
      label: moduleKey,
      root: input.workspace.root,
      files: fileList,
      publicSymbols,
      dependsOnModules: [],
      dependedOnByModules: [],
      entryFiles,
      testFiles,
      confidence: input.workspace.confidence
    } satisfies CodeContextModule;
  });
}

export function createEmptyWorkspaceDiagnostic(
  workspace: CodeContextWorkspaceRoot,
  message: string
): CodeContextDiagnostic {
  return {
    providerId: workspace.providerId,
    severity: "info",
    message: `${workspace.root}: ${message}`
  };
}
