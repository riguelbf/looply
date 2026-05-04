import path from "node:path";
import type { CodeContextDocument, CodeContextModule } from "./schema.js";

export function resolveModuleDependencies(
  document: CodeContextDocument,
  primaryContextRoot: string
): CodeContextModule[] {
  const fileToModule = buildFileToModuleMap(document.modules);

  return document.modules.map((module) => {
    const dependsOn = resolveModuleImports(module, document, fileToModule, primaryContextRoot);
    return { ...module, dependsOnModules: dependsOn };
  }).map((module, _index, allModules) => {
    const depId = module.id;
    const dependedOnBy = allModules
      .filter((other) => other.dependsOnModules.includes(depId))
      .map((other) => other.id)
      .sort();
    return { ...module, dependedOnByModules: dependedOnBy };
  });
}

function buildFileToModuleMap(
  modules: CodeContextModule[]
): Map<string, CodeContextModule> {
  const map = new Map<string, CodeContextModule>();
  for (const module of modules) {
    for (const file of module.files) {
      map.set(file, module);
    }
  }
  return map;
}

function resolveModuleImports(
  module: CodeContextModule,
  document: CodeContextDocument,
  fileToModule: Map<string, CodeContextModule>,
  primaryContextRoot: string
): string[] {
  const importedModuleIds = new Set<string>();

  const ownFiles = new Set(module.files);

  const importRelations = document.relations.filter(
    (rel) =>
      rel.type === "imports" &&
      ownFiles.has(rel.from)
  );

  for (const rel of importRelations) {
    const targetModule = resolveImportTarget(
      rel.from,
      rel.to,
      fileToModule,
      primaryContextRoot
    );
    if (targetModule && targetModule.id !== module.id) {
      importedModuleIds.add(targetModule.id);
    }
  }

  return Array.from(importedModuleIds).sort();
}

function resolveImportTarget(
  fromFile: string,
  importSpecifier: string,
  fileToModule: Map<string, CodeContextModule>,
  primaryContextRoot: string
): CodeContextModule | null {
  if (importSpecifier.startsWith(".")) {
    const fromDir = path.dirname(fromFile);
    const resolved = path.normalize(path.join(fromDir, importSpecifier)).split(path.sep).join("/");

    const candidateFiles = [
      resolved,
      `${resolved}.ts`,
      `${resolved}.tsx`,
      `${resolved}.js`,
      `${resolved}.jsx`,
      `${resolved}.mjs`,
      `${resolved}.cjs`,
      `${resolved}.py`,
      `${resolved}/index.ts`,
      `${resolved}/index.tsx`,
      `${resolved}/index.js`,
      `${resolved}/index.mjs`,
      `${resolved}/index.py`
    ];

    for (const candidate of candidateFiles) {
      const mod = fileToModule.get(candidate);
      if (mod) {
        return mod;
      }
    }

    for (const candidate of candidateFiles) {
      const absPath = path.resolve(primaryContextRoot, candidate);
      for (const [file, mod] of fileToModule) {
        const absFile = path.resolve(primaryContextRoot, file);
        if (absFile === absPath) {
          return mod;
        }
      }
    }

    return null;
  }

  return null;
}
