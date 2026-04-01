import path from "node:path";
import YAML from "yaml";
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

type YamlRecord = Record<string, unknown>;

export async function analyzeYamlWorkspace(
  primaryContextRoot: string,
  workspace: CodeContextWorkspaceRoot
): Promise<WorkspaceAnalysisResult> {
  const files = await collectWorkspaceFiles(primaryContextRoot, workspace, ["**/*.yml", "**/*.yaml"]);
  if (files.length === 0) {
    return {
      modules: [],
      symbols: [],
      relations: [],
      entrypoints: [],
      relatedTests: [],
      diagnostics: [createEmptyWorkspaceDiagnostic(workspace, "No YAML files found.")]
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
    const documents = YAML.parseAllDocuments(source, {
      prettyErrors: false,
      strict: false
    });

    const fileSymbols = new Set<string>();
    const fileEntrypointSymbols = new Set<string>();

    for (const document of documents) {
      for (const error of document.errors) {
        diagnostics.push({
          providerId: workspace.providerId,
          severity: "error",
          message: `${relativeFile}: ${error.message}`
        });
      }

      for (const warning of document.warnings) {
        diagnostics.push({
          providerId: workspace.providerId,
          severity: "warning",
          message: `${relativeFile}: ${warning.message}`
        });
      }

      const parsed = document.toJS() as unknown;
      if (!isRecord(parsed)) {
        continue;
      }

      for (const key of Object.keys(parsed)) {
        if (fileSymbols.has(`key:${key}`)) {
          continue;
        }
        fileSymbols.add(`key:${key}`);
        symbols.push(buildSymbol(workspace, relativeFile, key, "key"));
      }

      const workflowName = analyzeGithubWorkflow(parsed, relativeFile, workspace, symbols, relations, fileSymbols);
      if (workflowName) {
        fileEntrypointSymbols.add(workflowName);
      }

      const yamlEntrypoints = analyzeYamlInfrastructure(parsed, relativeFile, workspace, symbols, relations, fileSymbols);
      for (const symbolName of yamlEntrypoints) {
        fileEntrypointSymbols.add(symbolName);
      }
    }

    if (fileEntrypointSymbols.size > 0) {
      entrypoints.push({
        providerId: workspace.providerId,
        language: workspace.language,
        file: relativeFile,
        symbols: Array.from(fileEntrypointSymbols).sort()
      });
    }
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

function analyzeGithubWorkflow(
  root: YamlRecord,
  relativeFile: string,
  workspace: CodeContextWorkspaceRoot,
  symbols: CodeContextSymbol[],
  relations: CodeContextRelation[],
  fileSymbols: Set<string>
): string | null {
  if (!("jobs" in root) && !("on" in root)) {
    return null;
  }

  const workflowName = asString(root.name) ?? path.basename(relativeFile, path.extname(relativeFile));
  maybePushSymbol(symbols, fileSymbols, buildSymbol(workspace, relativeFile, workflowName, "workflow"));

  const jobs = root.jobs;
  if (isRecord(jobs)) {
    for (const [jobName, jobConfig] of Object.entries(jobs)) {
      const jobSymbol = `job:${jobName}`;
      maybePushSymbol(symbols, fileSymbols, buildSymbol(workspace, relativeFile, jobSymbol, "job"));
      relations.push({
        providerId: workspace.providerId,
        type: "defines-job",
        from: relativeFile,
        to: jobSymbol
      });

      if (!isRecord(jobConfig)) {
        continue;
      }

      for (const need of toStringList(jobConfig.needs)) {
        relations.push({
          providerId: workspace.providerId,
          type: "depends-on-job",
          from: jobSymbol,
          to: `job:${need}`
        });
      }

      for (const actionRef of extractWorkflowUses(jobConfig.steps)) {
        relations.push({
          providerId: workspace.providerId,
          type: "uses-action",
          from: jobSymbol,
          to: actionRef
        });
      }
    }
  }

  return workflowName;
}

function analyzeYamlInfrastructure(
  root: YamlRecord,
  relativeFile: string,
  workspace: CodeContextWorkspaceRoot,
  symbols: CodeContextSymbol[],
  relations: CodeContextRelation[],
  fileSymbols: Set<string>
): string[] {
  const entrypoints = new Set<string>();

  const services = root.services;
  if (isRecord(services)) {
    for (const serviceName of Object.keys(services)) {
      const symbolName = `service:${serviceName}`;
      maybePushSymbol(symbols, fileSymbols, buildSymbol(workspace, relativeFile, symbolName, "service"));
      relations.push({
        providerId: workspace.providerId,
        type: "defines-service",
        from: relativeFile,
        to: symbolName
      });
      entrypoints.add(symbolName);
    }
  }

  const kind = asString(root.kind);
  const metadata = isRecord(root.metadata) ? root.metadata : null;
  const metadataName = metadata ? asString(metadata.name) : null;
  if (kind) {
    const resourceSymbol = metadataName ? `${kind}/${metadataName}` : kind;
    maybePushSymbol(symbols, fileSymbols, buildSymbol(workspace, relativeFile, resourceSymbol, "resource"));
    relations.push({
      providerId: workspace.providerId,
      type: "resource-kind",
      from: relativeFile,
      to: kind
    });
    entrypoints.add(resourceSymbol);
  }

  return Array.from(entrypoints);
}

function extractWorkflowUses(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }
    const uses = asString(entry.uses);
    return uses ? [uses] : [];
  });
}

function maybePushSymbol(symbols: CodeContextSymbol[], fileSymbols: Set<string>, symbol: CodeContextSymbol): void {
  const dedupeKey = `${symbol.file}:${symbol.kind}:${symbol.name}`;
  if (fileSymbols.has(dedupeKey)) {
    return;
  }
  fileSymbols.add(dedupeKey);
  symbols.push(symbol);
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

function isRecord(value: unknown): value is YamlRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function toStringList(value: unknown): string[] {
  if (typeof value === "string" && value.trim() !== "") {
    return [value];
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim() !== "");
}
