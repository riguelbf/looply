import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type {
  CodeContextDiagnostic,
  CodeContextEntrypoint,
  CodeContextRelation,
  CodeContextSymbol,
  CodeContextWorkspaceRoot
} from "../schema.js";
import {
  buildModules,
  collectWorkspaceFiles,
  createEmptyWorkspaceDiagnostic,
  readFiles,
  toRelativePath,
  type WorkspaceAnalysisResult
} from "./shared.js";

const execFileAsync = promisify(execFile);
const COMMAND_KEYWORDS = new Set([
  "if",
  "then",
  "else",
  "elif",
  "fi",
  "for",
  "while",
  "do",
  "done",
  "case",
  "esac",
  "function",
  "select",
  "until",
  "in",
  "time",
  "source",
  ".",
  "{",
  "}",
  "[[",
  "]]",
  "[",
  "]"
]);

export async function analyzeShellWorkspace(
  primaryContextRoot: string,
  workspace: CodeContextWorkspaceRoot
): Promise<WorkspaceAnalysisResult> {
  const files = await collectWorkspaceFiles(primaryContextRoot, workspace, ["**/*.sh", "**/*.bash", "**/*.zsh", "**/.envrc"]);
  if (files.length === 0) {
    return {
      modules: [],
      symbols: [],
      relations: [],
      entrypoints: [],
      relatedTests: [],
      diagnostics: [createEmptyWorkspaceDiagnostic(workspace, "No shell files found.")]
    };
  }

  const loadedFiles = await readFiles(files);
  const sourceFiles = loadedFiles.map(({ file }) => toRelativePath(primaryContextRoot, file));
  const symbols: CodeContextSymbol[] = [];
  const relations: CodeContextRelation[] = [];
  const entrypoints: CodeContextEntrypoint[] = [];
  const diagnostics: CodeContextDiagnostic[] = [];

  for (const { file, source } of loadedFiles) {
    const relativeFile = toRelativePath(primaryContextRoot, file);
    const script = analyzeShellScript(relativeFile, source, workspace);
    symbols.push(...script.symbols);
    relations.push(...script.relations);

    if (script.entrypointSymbols.length > 0 || isShellEntrypoint(source, relativeFile)) {
      entrypoints.push({
        providerId: workspace.providerId,
        language: workspace.language,
        file: relativeFile,
        symbols: script.entrypointSymbols
      });
    }

    diagnostics.push(...await lintShellFile(file, relativeFile, workspace.providerId));
  }

  const modules = buildModules({
    primaryContextRoot,
    workspace,
    sourceFiles,
    symbols,
    entrypoints,
    relatedTests: []
  });

  return {
    modules,
    symbols,
    relations,
    entrypoints,
    relatedTests: [],
    diagnostics
  };
}

function analyzeShellScript(
  relativeFile: string,
  source: string,
  workspace: CodeContextWorkspaceRoot
): {
  symbols: CodeContextSymbol[];
  relations: CodeContextRelation[];
  entrypointSymbols: string[];
} {
  const symbols: CodeContextSymbol[] = [];
  const relations: CodeContextRelation[] = [];
  const entrypointSymbols = new Set<string>();
  const symbolKeys = new Set<string>();
  const lines = source.split(/\r?\n/);

  for (const line of lines) {
    const stripped = stripInlineComment(line).trim();
    if (stripped === "") {
      continue;
    }

    const functionMatch = stripped.match(/^(?:function\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*\(\)\s*\{/)
      ?? stripped.match(/^function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/);
    if (functionMatch) {
      const functionName = functionMatch[1];
      if (!symbolKeys.has(`function:${functionName}`)) {
        symbolKeys.add(`function:${functionName}`);
        symbols.push(buildSymbol(workspace, relativeFile, functionName, "function"));
      }
      entrypointSymbols.add(functionName);
      continue;
    }

    const assignmentMatch = stripped.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (assignmentMatch && !assignmentMatch[1].includes("-")) {
      const variableName = assignmentMatch[1];
      if (!symbolKeys.has(`variable:${variableName}`)) {
        symbolKeys.add(`variable:${variableName}`);
        symbols.push(buildSymbol(workspace, relativeFile, variableName, "variable"));
      }
    }

    const sourceMatch = stripped.match(/^(?:source|\.)\s+["']?([^"'\s;]+)["']?/);
    if (sourceMatch) {
      relations.push({
        providerId: workspace.providerId,
        type: "sources",
        from: relativeFile,
        to: sourceMatch[1]
      });
    }

    const commandName = extractCommandName(stripped);
    if (commandName) {
      relations.push({
        providerId: workspace.providerId,
        type: "invokes",
        from: relativeFile,
        to: commandName
      });
    }
  }

  return {
    symbols,
    relations,
    entrypointSymbols: Array.from(entrypointSymbols).sort()
  };
}

function stripInlineComment(line: string): string {
  let result = "";
  let inSingle = false;
  let inDouble = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const prev = index > 0 ? line[index - 1] : "";

    if (char === "'" && !inDouble && prev !== "\\") {
      inSingle = !inSingle;
      result += char;
      continue;
    }

    if (char === "\"" && !inSingle && prev !== "\\") {
      inDouble = !inDouble;
      result += char;
      continue;
    }

    if (char === "#" && !inSingle && !inDouble) {
      break;
    }

    result += char;
  }

  return result;
}

function extractCommandName(line: string): string | null {
  if (line.startsWith("export ") || line.startsWith("local ") || line.startsWith("readonly ")) {
    return null;
  }

  const pipelineHead = line.split(/[|;&]/, 1)[0]?.trim() ?? "";
  if (pipelineHead === "") {
    return null;
  }

  const firstToken = pipelineHead.split(/\s+/, 1)[0] ?? "";
  if (firstToken === "" || COMMAND_KEYWORDS.has(firstToken)) {
    return null;
  }
  if (firstToken.includes("=") || firstToken.startsWith("$") || firstToken.startsWith("(")) {
    return null;
  }

  return firstToken;
}

function isShellEntrypoint(source: string, relativeFile: string): boolean {
  return source.startsWith("#!") || path.basename(relativeFile) === ".envrc";
}

async function lintShellFile(
  file: string,
  relativeFile: string,
  providerId: CodeContextWorkspaceRoot["providerId"]
): Promise<CodeContextDiagnostic[]> {
  const shell = resolveLintShell(file);
  if (!shell) {
    return [];
  }

  try {
    await execFileAsync(shell.command, shell.args.concat(file), {
      maxBuffer: 1024 * 1024
    });
    return [];
  } catch (error) {
    const stderr = error instanceof Error && "stderr" in error ? String((error as { stderr?: string }).stderr ?? "") : "";
    const message = stderr.trim() || `${relativeFile}: shell syntax validation failed.`;
    return [{
      providerId,
      severity: "error",
      message
    }];
  }
}

function resolveLintShell(file: string): { command: string; args: string[] } | null {
  const base = path.basename(file);
  if (base === ".envrc" || file.endsWith(".sh") || file.endsWith(".bash")) {
    return { command: "bash", args: ["-n"] };
  }
  if (file.endsWith(".zsh")) {
    return { command: "zsh", args: ["-n"] };
  }
  return null;
}

function buildSymbol(
  workspace: CodeContextWorkspaceRoot,
  file: string,
  name: string,
  kind: string
): CodeContextSymbol {
  return {
    providerId: workspace.providerId,
    language: workspace.language,
    name,
    kind,
    file,
    exported: true,
    references: null
  };
}
