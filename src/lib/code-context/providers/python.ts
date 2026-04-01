import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import type {
  CodeContextDiagnostic,
  CodeContextEntrypoint,
  CodeContextRelation,
  CodeContextSymbol,
  CodeContextWorkspaceRoot
} from "../schema.js";
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

const execFileAsync = promisify(execFile);

export async function analyzePythonWorkspace(
  primaryContextRoot: string,
  workspace: CodeContextWorkspaceRoot
): Promise<WorkspaceAnalysisResult> {
  const workspaceDir = path.resolve(primaryContextRoot, workspace.root);
  const files = await collectWorkspaceFiles(primaryContextRoot, workspace, ["**/*.py"]);
  if (files.length === 0) {
    return {
      modules: [],
      symbols: [],
      relations: [],
      entrypoints: [],
      relatedTests: [],
      diagnostics: [createEmptyWorkspaceDiagnostic(workspace, "No Python source files found.")]
    };
  }

  try {
    const semantic = await runPythonSemanticHelper(primaryContextRoot, workspaceDir);
    const sourceFiles = semantic.files;
    const testFiles = sourceFiles.filter((file) => isTestFile(file));
    const nonTestFiles = sourceFiles.filter((file) => !isTestFile(file));
    const relatedTests = buildRelatedTests(workspace.providerId, workspace.language, nonTestFiles, testFiles);
    const modules = buildModules({
      primaryContextRoot,
      workspace,
      sourceFiles: nonTestFiles,
      symbols: semantic.symbols,
      entrypoints: semantic.entrypoints,
      relatedTests
    });

    return {
      modules,
      symbols: semantic.symbols,
      relations: semantic.relations,
      entrypoints: semantic.entrypoints,
      relatedTests,
      diagnostics: semantic.diagnostics
    };
  } catch (error) {
    const loadedFiles = await readFiles(files);
    const sourceFiles = loadedFiles.map(({ file }) => toRelativePath(primaryContextRoot, file));
    const symbols: CodeContextSymbol[] = [];
    const entrypoints: CodeContextEntrypoint[] = [];

    for (const { file, source } of loadedFiles) {
      const relativeFile = toRelativePath(primaryContextRoot, file);
      for (const symbol of extractPythonSymbols(relativeFile, source, workspace)) {
        symbols.push(symbol);
      }
      if (path.basename(file) === "main.py" || path.basename(file) === "app.py" || path.basename(file) === "__main__.py" || /if __name__ == ["']__main__["']/.test(source)) {
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
      diagnostics: [
        {
          providerId: workspace.providerId,
          severity: "warning",
          message: `Semantic Python analysis failed and fallback heuristics were used: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}

async function runPythonSemanticHelper(
  primaryContextRoot: string,
  workspaceDir: string
): Promise<{
  files: string[];
  symbols: CodeContextSymbol[];
  relations: CodeContextRelation[];
  entrypoints: CodeContextEntrypoint[];
  diagnostics: CodeContextDiagnostic[];
}> {
  const providerFile = fileURLToPath(import.meta.url);
  const helperScript = path.resolve(path.dirname(providerFile), "../../../../tools/code-context-python-helper.py");
  const { stdout, stderr } = await execFileAsync("python3", [helperScript, "--workspace-root", workspaceDir], {
    cwd: primaryContextRoot,
    maxBuffer: 10 * 1024 * 1024
  });

  const payload = JSON.parse(stdout) as {
    Files: string[];
    Symbols: Array<{ Name: string; Kind: string; File: string; Exported: boolean }>;
    Relations: Array<{ Type: string; From: string; To: string }>;
    Entrypoints: Array<{ File: string; Symbols: string[] }>;
    Diagnostics: Array<{ Severity: "info" | "warning" | "error"; Message: string }>;
  };

  return {
    files: payload.Files ?? [],
    symbols: (payload.Symbols ?? []).map((symbol) => ({
      providerId: "python",
      language: "Python",
      name: symbol.Name,
      kind: symbol.Kind,
      file: path.posix.join(workspaceDir === primaryContextRoot ? "" : path.relative(primaryContextRoot, workspaceDir).split(path.sep).join("/"), symbol.File).replace(/^\/+/, ""),
      exported: symbol.Exported,
      references: null
    })),
    relations: (payload.Relations ?? []).map((relation) => ({
      providerId: "python",
      type: relation.Type,
      from: path.posix.join(workspaceDir === primaryContextRoot ? "" : path.relative(primaryContextRoot, workspaceDir).split(path.sep).join("/"), relation.From).replace(/^\/+/, ""),
      to: relation.To
    })),
    entrypoints: (payload.Entrypoints ?? []).map((entrypoint) => ({
      providerId: "python",
      language: "Python",
      file: path.posix.join(workspaceDir === primaryContextRoot ? "" : path.relative(primaryContextRoot, workspaceDir).split(path.sep).join("/"), entrypoint.File).replace(/^\/+/, ""),
      symbols: entrypoint.Symbols ?? []
    })),
    diagnostics: [
      ...(payload.Diagnostics ?? []).map((diagnostic) => ({
        providerId: "python" as const,
        severity: diagnostic.Severity,
        message: diagnostic.Message
      })),
      ...(stderr.trim() !== ""
        ? [{
            providerId: "python" as const,
            severity: "info" as const,
            message: stderr.trim()
          }]
        : [])
    ]
  };
}

function extractPythonSymbols(
  file: string,
  source: string,
  workspace: CodeContextWorkspaceRoot
): CodeContextSymbol[] {
  const regexes = [
    /class\s+([A-Z][A-Za-z0-9_]*)/g,
    /def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g
  ];

  return regexes.flatMap((regex) =>
    Array.from(source.matchAll(regex))
      .map((match) => match[1])
      .filter((name) => !name.startsWith("_"))
      .map((name) => ({
        providerId: workspace.providerId,
        language: workspace.language,
        name,
        kind: /^[A-Z]/.test(name) ? "class" : "function",
        file,
        exported: true,
        references: null
      }))
  );
}
