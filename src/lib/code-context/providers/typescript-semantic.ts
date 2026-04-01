import path from "node:path";
import ts from "typescript";
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
  toRelativePath,
  type WorkspaceAnalysisResult
} from "./shared.js";

const TYPESCRIPT_ENTRYPOINT_FILES = new Set(["main.ts", "main.tsx", "index.ts", "index.tsx", "app.ts", "app.tsx"]);
const JAVASCRIPT_ENTRYPOINT_FILES = new Set(["main.js", "index.js", "app.js", "main.mjs", "index.mjs", "app.mjs"]);

export async function analyzeTypeScriptSemanticWorkspace(
  primaryContextRoot: string,
  workspace: CodeContextWorkspaceRoot,
  mode: "typescript" | "javascript"
): Promise<WorkspaceAnalysisResult> {
  const workspaceDir = path.resolve(primaryContextRoot, workspace.root);
  const programInfo = await createProgramForWorkspace(primaryContextRoot, workspace, workspaceDir, mode);
  if (!programInfo) {
    return {
      modules: [],
      symbols: [],
      relations: [],
      entrypoints: [],
      relatedTests: [],
      diagnostics: [createEmptyWorkspaceDiagnostic(workspace, `No ${workspace.language} source files found.`)]
    };
  }

  const { program, rootFileNames } = programInfo;
  const checker = program.getTypeChecker();
  const sourceFiles = rootFileNames
    .map((fileName) => program.getSourceFile(fileName))
    .filter((file): file is ts.SourceFile => file !== undefined)
    .filter((file) => !file.isDeclarationFile)
    .filter((file) => isWithinWorkspace(primaryContextRoot, workspace, file.fileName));

  const symbols: CodeContextSymbol[] = [];
  const relations: CodeContextRelation[] = [];
  const entrypoints: CodeContextEntrypoint[] = [];
  const relativeSourceFiles = sourceFiles.map((file) => toRelativePath(primaryContextRoot, file.fileName));

  for (const sourceFile of sourceFiles) {
    const relativeFile = toRelativePath(primaryContextRoot, sourceFile.fileName);
    symbols.push(...extractModuleExports(checker, sourceFile, workspace, relativeFile));
    relations.push(...extractImportRelations(sourceFile, workspace, relativeFile));
  }

  const entrypointFiles = mode === "typescript" ? TYPESCRIPT_ENTRYPOINT_FILES : JAVASCRIPT_ENTRYPOINT_FILES;
  for (const sourceFile of sourceFiles) {
    if (entrypointFiles.has(path.basename(sourceFile.fileName))) {
      const relativeFile = toRelativePath(primaryContextRoot, sourceFile.fileName);
      entrypoints.push({
        providerId: workspace.providerId,
        language: workspace.language,
        file: relativeFile,
        symbols: symbols.filter((symbol) => symbol.file === relativeFile && symbol.exported).map((symbol) => symbol.name)
      });
    }
  }

  const testFiles = relativeSourceFiles.filter((file) => isTestFile(file));
  const nonTestFiles = relativeSourceFiles.filter((file) => !isTestFile(file));
  const relatedTests = buildRelatedTests(workspace.providerId, workspace.language, nonTestFiles, testFiles);
  const modules = buildModules({
    primaryContextRoot,
    workspace,
    sourceFiles: nonTestFiles,
    symbols,
    entrypoints,
    relatedTests
  });
  const diagnostics = extractDiagnostics(program, primaryContextRoot, workspace);

  return {
    modules,
    symbols,
    relations,
    entrypoints,
    relatedTests,
    diagnostics
  };
}

async function createProgramForWorkspace(
  primaryContextRoot: string,
  workspace: CodeContextWorkspaceRoot,
  workspaceDir: string,
  mode: "typescript" | "javascript"
): Promise<{ program: ts.Program; rootFileNames: string[] } | null> {
  const tsconfigPath = mode === "typescript" ? path.join(workspaceDir, "tsconfig.json") : null;
  if (tsconfigPath && ts.sys.fileExists(tsconfigPath)) {
    const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    if (!configFile.error && configFile.config) {
      const parsed = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        workspaceDir,
        { noEmit: true },
        tsconfigPath
      );
      const rootFileNames = parsed.fileNames.filter((fileName) =>
        isWithinWorkspace(primaryContextRoot, workspace, fileName)
      );
      if (rootFileNames.length === 0) {
        return null;
      }
      return {
        program: ts.createProgram({
          rootNames: rootFileNames,
          options: { ...parsed.options, noEmit: true }
        }),
        rootFileNames
      };
    }
  }

  const patterns = mode === "typescript"
    ? ["**/*.ts", "**/*.tsx"]
    : ["**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"];
  const files = await collectWorkspaceFiles(primaryContextRoot, workspace, patterns);
  if (files.length === 0) {
    return null;
  }

  const rootFileNames = files.filter((fileName) => isWithinWorkspace(primaryContextRoot, workspace, fileName));
  return {
    program: ts.createProgram({
      rootNames: rootFileNames,
      options: {
        allowJs: mode === "javascript",
        checkJs: false,
        noEmit: true,
        skipLibCheck: true,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        jsx: ts.JsxEmit.ReactJSX
      }
    }),
    rootFileNames
  };
}

function extractModuleExports(
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  workspace: CodeContextWorkspaceRoot,
  relativeFile: string
): CodeContextSymbol[] {
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) {
    return extractTopLevelDeclarations(sourceFile, workspace, relativeFile);
  }

  const exportedSymbols = checker.getExportsOfModule(moduleSymbol);
  if (exportedSymbols.length === 0) {
    return extractTopLevelDeclarations(sourceFile, workspace, relativeFile);
  }

  return exportedSymbols
    .map((symbol) => normalizeExportedSymbol(checker, symbol, workspace, relativeFile))
    .filter((symbol): symbol is CodeContextSymbol => symbol !== null);
}

function normalizeExportedSymbol(
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
  workspace: CodeContextWorkspaceRoot,
  relativeFile: string
): CodeContextSymbol | null {
  const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const declarations = target.declarations ?? symbol.declarations ?? [];
  const firstDeclaration = declarations[0];
  const name = resolveSymbolName(symbol, target, firstDeclaration);
  if (!name) {
    return null;
  }

  return {
    providerId: workspace.providerId,
    language: workspace.language,
    name,
    kind: resolveDeclarationKind(firstDeclaration),
    file: relativeFile,
    exported: true,
    references: null
  };
}

function extractTopLevelDeclarations(
  sourceFile: ts.SourceFile,
  workspace: CodeContextWorkspaceRoot,
  relativeFile: string
): CodeContextSymbol[] {
  const symbols: CodeContextSymbol[] = [];

  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement) && statement.name) {
      symbols.push(buildSymbol(workspace, relativeFile, statement.name.text, "class", hasExportModifier(statement)));
      continue;
    }

    if (ts.isFunctionDeclaration(statement) && statement.name) {
      symbols.push(buildSymbol(workspace, relativeFile, statement.name.text, "function", hasExportModifier(statement)));
      continue;
    }

    if (ts.isInterfaceDeclaration(statement)) {
      symbols.push(buildSymbol(workspace, relativeFile, statement.name.text, "interface", hasExportModifier(statement)));
      continue;
    }

    if (ts.isTypeAliasDeclaration(statement)) {
      symbols.push(buildSymbol(workspace, relativeFile, statement.name.text, "type", hasExportModifier(statement)));
      continue;
    }

    if (ts.isEnumDeclaration(statement)) {
      symbols.push(buildSymbol(workspace, relativeFile, statement.name.text, "enum", hasExportModifier(statement)));
      continue;
    }

    if (ts.isVariableStatement(statement)) {
      const exported = hasExportModifier(statement);
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          symbols.push(buildSymbol(workspace, relativeFile, declaration.name.text, "variable", exported));
        }
      }
    }
  }

  return symbols.filter((symbol) => symbol.exported);
}

function extractImportRelations(
  sourceFile: ts.SourceFile,
  workspace: CodeContextWorkspaceRoot,
  relativeFile: string
): CodeContextRelation[] {
  const relations: CodeContextRelation[] = [];

  for (const statement of sourceFile.statements) {
    if ((ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier) {
      const specifier = statement.moduleSpecifier;
      if (ts.isStringLiteral(specifier)) {
        relations.push({
          providerId: workspace.providerId,
          type: "imports",
          from: relativeFile,
          to: specifier.text
        });
      }
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          declaration.initializer &&
          ts.isCallExpression(declaration.initializer) &&
          ts.isIdentifier(declaration.initializer.expression) &&
          declaration.initializer.expression.text === "require"
        ) {
          const [arg] = declaration.initializer.arguments;
          if (arg && ts.isStringLiteral(arg)) {
            relations.push({
              providerId: workspace.providerId,
              type: "imports",
              from: relativeFile,
              to: arg.text
            });
          }
        }
      }
    }
  }

  return relations;
}

function extractDiagnostics(
  program: ts.Program,
  primaryContextRoot: string,
  workspace: CodeContextWorkspaceRoot
): CodeContextDiagnostic[] {
  return ts.getPreEmitDiagnostics(program)
    .filter((diagnostic) => {
      if (!diagnostic.file) {
        return false;
      }
      return isWithinWorkspace(primaryContextRoot, workspace, diagnostic.file.fileName);
    })
    .slice(0, 50)
    .map((diagnostic) => ({
      providerId: workspace.providerId,
      severity: diagnostic.category === ts.DiagnosticCategory.Error
        ? "error"
        : diagnostic.category === ts.DiagnosticCategory.Warning
          ? "warning"
          : "info",
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
    }));
}

function resolveSymbolName(
  symbol: ts.Symbol,
  target: ts.Symbol,
  declaration: ts.Declaration | undefined
): string | null {
  if (symbol.name !== "default" && symbol.name !== "__export") {
    return symbol.name;
  }
  if (target.name !== "default" && target.name !== "__export") {
    return target.name;
  }
  const namedDeclaration = declaration as ts.NamedDeclaration | undefined;
  if (namedDeclaration?.name && ts.isIdentifier(namedDeclaration.name)) {
    return namedDeclaration.name.text;
  }
  if (declaration && ts.isExportAssignment(declaration)) {
    return "default";
  }
  return null;
}

function resolveDeclarationKind(declaration: ts.Declaration | undefined): string {
  if (!declaration) return "unknown";
  if (ts.isClassDeclaration(declaration) || ts.isClassExpression(declaration)) return "class";
  if (ts.isFunctionDeclaration(declaration) || ts.isMethodDeclaration(declaration)) return "function";
  if (ts.isInterfaceDeclaration(declaration)) return "interface";
  if (ts.isTypeAliasDeclaration(declaration)) return "type";
  if (ts.isEnumDeclaration(declaration)) return "enum";
  if (ts.isVariableDeclaration(declaration)) return "variable";
  return "unknown";
}

function buildSymbol(
  workspace: CodeContextWorkspaceRoot,
  relativeFile: string,
  name: string,
  kind: string,
  exported: boolean
): CodeContextSymbol {
  return {
    providerId: workspace.providerId,
    language: workspace.language,
    name,
    kind,
    file: relativeFile,
    exported,
    references: null
  };
}

function hasExportModifier(node: ts.Node): boolean {
  return ts.canHaveModifiers(node)
    ? Boolean(ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword))
    : false;
}

function isWithinWorkspace(primaryContextRoot: string, workspace: CodeContextWorkspaceRoot, fileName: string): boolean {
  const workspaceDir = path.resolve(primaryContextRoot, workspace.root);
  const relative = path.relative(workspaceDir, fileName);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative) || path.resolve(fileName) === workspaceDir;
}
