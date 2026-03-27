import path from "node:path";
import { globby } from "globby";
import { readMarkdownArtifact } from "./markdown-artifact.js";
import type { PackFrontmatter } from "./artifact-schema.js";
import type { CatalogArtifact } from "./artifact-catalog.js";

export interface PackDefinition {
  name: string;
  file: string;
  frontmatter: PackFrontmatter;
}

export async function listAvailablePacks(sourceRoot: string): Promise<string[]> {
  const definitions = await loadPackDefinitions(sourceRoot);
  return definitions.map((definition) => definition.name).sort((left, right) => left.localeCompare(right));
}

export async function loadPackDefinitions(sourceRoot: string): Promise<PackDefinition[]> {
  const matches = await globby("packs/*/pack.md", {
    cwd: sourceRoot,
    onlyFiles: true,
    absolute: true
  });

  const definitions: PackDefinition[] = [];

  for (const file of matches) {
    const parsed = await readMarkdownArtifact(file);
    const name = String(parsed.frontmatter.name ?? path.basename(path.dirname(file)));
    definitions.push({
      name,
      file: path.relative(sourceRoot, file),
      frontmatter: parsed.frontmatter as PackFrontmatter
    });
  }

  return definitions.sort((left, right) => left.name.localeCompare(right.name));
}

export async function resolvePackClosure(sourceRoot: string, packName: string): Promise<string[]> {
  const definitions = await loadPackDefinitions(sourceRoot);
  return resolvePackClosureFromDefinitions(packName, definitions);
}

export function resolvePackClosureFromDefinitions(packName: string, definitions: PackDefinition[]): string[] {
  const definitionMap = new Map(definitions.map((definition) => [definition.name, definition]));
  const visited = new Set<string>();
  const ordered: string[] = [];

  const visit = (name: string) => {
    if (visited.has(name)) {
      return;
    }

    const definition = definitionMap.get(name);
    if (!definition) {
      throw new Error(`Unknown pack referenced in includes.packs: ${name}`);
    }

    visited.add(name);
    ordered.push(name);

    for (const includedPack of definition.frontmatter.includes.packs) {
      visit(includedPack);
    }
  };

  visit(packName);
  return ordered;
}

export function filterArtifactsForPackClosure(input: {
  pack: string;
  artifacts: CatalogArtifact[];
  packClosure: string[];
}): CatalogArtifact[] {
  const allowed = new Set(input.packClosure);
  return input.artifacts.filter((artifact) => allowed.has(artifact.pack));
}
