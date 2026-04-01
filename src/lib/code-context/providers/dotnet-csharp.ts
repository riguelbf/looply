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
let builtDotnetHelperDll: string | null = null;

export async function analyzeDotnetCSharpWorkspace(
  primaryContextRoot: string,
  workspace: CodeContextWorkspaceRoot
): Promise<WorkspaceAnalysisResult> {
  const workspaceDir = path.resolve(primaryContextRoot, workspace.root);
  const files = await collectWorkspaceFiles(primaryContextRoot, workspace, ["**/*.cs"]);
  if (files.length === 0) {
    return {
      modules: [],
      symbols: [],
      relations: [],
      entrypoints: [],
      relatedTests: [],
      diagnostics: [createEmptyWorkspaceDiagnostic(workspace, "No C# source files found.")]
    };
  }

  const sdkDir = await resolveLatestDotnetSdkDir();
  if (!sdkDir) {
    return {
      modules: [],
      symbols: [],
      relations: [],
      entrypoints: [],
      relatedTests: [],
      diagnostics: [createEmptyWorkspaceDiagnostic(workspace, "No .NET SDK directory could be resolved for semantic analysis.")]
    };
  }

  try {
    const semantic = await runDotnetSemanticHelper(primaryContextRoot, workspaceDir, sdkDir);
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
      for (const symbol of extractCSharpSymbols(relativeFile, source, workspace)) {
        symbols.push(symbol);
      }
      if (path.basename(file) === "Program.cs" || /static\s+void\s+Main\s*\(/.test(source)) {
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
          message: `Semantic .NET analysis failed and fallback heuristics were used: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}

function extractCSharpSymbols(
  file: string,
  source: string,
  workspace: CodeContextWorkspaceRoot
): CodeContextSymbol[] {
  const regexes = [
    /public\s+(?:sealed\s+|abstract\s+)?class\s+([A-Z][A-Za-z0-9_]*)/g,
    /public\s+interface\s+([A-Z][A-Za-z0-9_]*)/g,
    /public\s+record\s+([A-Z][A-Za-z0-9_]*)/g,
    /public\s+enum\s+([A-Z][A-Za-z0-9_]*)/g,
    /public\s+struct\s+([A-Z][A-Za-z0-9_]*)/g
  ];

  return regexes.flatMap((regex) =>
    Array.from(source.matchAll(regex)).map((match) => ({
      providerId: workspace.providerId,
      language: workspace.language,
      name: match[1],
      kind: inferCSharpKind(match[0]),
      file,
      exported: true,
      references: null
    }))
  );
}

function inferCSharpKind(source: string): string {
  if (source.includes("interface")) return "interface";
  if (source.includes("record")) return "record";
  if (source.includes("enum")) return "enum";
  if (source.includes("struct")) return "struct";
  return "class";
}

async function resolveLatestDotnetSdkDir(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("dotnet", ["--list-sdks"]);
    const lines = stdout.split("\n").map((line) => line.trim()).filter((line) => line !== "");
    const last = lines.at(-1);
    if (!last) {
      return null;
    }
    const match = last.match(/\[(.+)\]$/);
    if (!match) {
      return null;
    }
    const version = last.split(" ")[0];
    return path.join(match[1], version);
  } catch {
    return null;
  }
}

async function runDotnetSemanticHelper(
  primaryContextRoot: string,
  workspaceDir: string,
  sdkDir: string
): Promise<{
  files: string[];
  symbols: CodeContextSymbol[];
  relations: CodeContextRelation[];
  entrypoints: CodeContextEntrypoint[];
  diagnostics: CodeContextDiagnostic[];
}> {
  const providerFile = fileURLToPath(import.meta.url);
  const helperProject = path.resolve(path.dirname(providerFile), "../../../../tools/code-context-dotnet-helper/Looply.CodeContext.Dotnet.csproj");
  const helperDll = await ensureDotnetHelperBuilt(helperProject, sdkDir);
  const dotnetFormatDir = path.join(sdkDir, "DotnetTools", "dotnet-format");
  const env = {
    ...process.env,
    LOOPLY_DOTNET_SDK_DIR: sdkDir,
    LOOPLY_DOTNET_FORMAT_DIR: dotnetFormatDir
  };

  const { stdout, stderr } = await execFileAsync(
    "dotnet",
    [helperDll, "--workspace-root", workspaceDir],
    {
      cwd: primaryContextRoot,
      env,
      maxBuffer: 10 * 1024 * 1024
    }
  );

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
      providerId: "dotnet-csharp",
      language: ".NET / C#",
      name: symbol.Name,
      kind: symbol.Kind,
      file: symbol.File,
      exported: symbol.Exported,
      references: null
    })),
    relations: (payload.Relations ?? []).map((relation) => ({
      providerId: "dotnet-csharp",
      type: relation.Type,
      from: relation.From,
      to: relation.To
    })),
    entrypoints: (payload.Entrypoints ?? []).map((entrypoint) => ({
      providerId: "dotnet-csharp",
      language: ".NET / C#",
      file: entrypoint.File,
      symbols: entrypoint.Symbols ?? []
    })),
    diagnostics: [
      ...(payload.Diagnostics ?? []).map((diagnostic) => ({
        providerId: "dotnet-csharp" as const,
        severity: diagnostic.Severity,
        message: diagnostic.Message
      })),
      ...(stderr.trim() !== ""
        ? [{
            providerId: "dotnet-csharp" as const,
            severity: "info" as const,
            message: stderr.trim()
          }]
        : [])
    ]
  };
}

async function ensureDotnetHelperBuilt(helperProject: string, sdkDir: string): Promise<string> {
  if (builtDotnetHelperDll) {
    return builtDotnetHelperDll;
  }

  const dotnetFormatDir = path.join(sdkDir, "DotnetTools", "dotnet-format");
  const env = {
    ...process.env,
    LOOPLY_DOTNET_SDK_DIR: sdkDir,
    LOOPLY_DOTNET_FORMAT_DIR: dotnetFormatDir
  };

  await execFileAsync("dotnet", ["build", helperProject], {
    cwd: path.dirname(helperProject),
    env,
    maxBuffer: 10 * 1024 * 1024
  });

  builtDotnetHelperDll = path.join(path.dirname(helperProject), "bin", "Debug", "net9.0", "Looply.CodeContext.Dotnet.dll");
  return builtDotnetHelperDll;
}
