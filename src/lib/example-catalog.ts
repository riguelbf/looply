import type { CatalogArtifact } from "./artifact-catalog.js";
import type { ExampleFrontmatter } from "./artifact-schema.js";

export interface CatalogExampleArtifact extends CatalogArtifact {
  type: "example";
  frontmatter: ExampleFrontmatter;
}

export function listCatalogExamples(input: {
  artifacts: CatalogArtifact[];
  pack: string;
  packClosure?: string[];
}): CatalogExampleArtifact[] {
  const allowedPacks = new Set(input.packClosure ?? [input.pack]);
  return input.artifacts
    .filter((artifact): artifact is CatalogExampleArtifact => artifact.type === "example")
    .filter((artifact) => allowedPacks.has(artifact.pack))
    .map((artifact) => artifact as CatalogExampleArtifact)
    .sort((left, right) => left.name.localeCompare(right.name));
}
