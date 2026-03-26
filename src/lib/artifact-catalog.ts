import path from "node:path";
import { globby } from "globby";
import { readMarkdownArtifact } from "./markdown-artifact.js";

export type CatalogArtifactType =
  | "pack"
  | "agent"
  | "task"
  | "workflow"
  | "knowledge"
  | "checklist"
  | "template";

export interface CatalogArtifact {
  type: CatalogArtifactType;
  name: string;
  file: string;
  pack: string;
  schema?: string;
  summary?: string;
  frontmatter: Record<string, unknown>;
}

export async function loadArtifactCatalog(sourceRoot: string): Promise<CatalogArtifact[]> {
  const files = await globby("packs/**/*.md", {
    cwd: sourceRoot,
    absolute: true,
    onlyFiles: true
  });

  const artifacts: CatalogArtifact[] = [];

  for (const file of files) {
    const relativeFile = path.relative(sourceRoot, file);
    const artifactType = inferArtifactType(relativeFile);
    if (!artifactType) {
      continue;
    }

    const parsed = await readMarkdownArtifact(file);
    const pack = relativeFile.split(path.sep)[1];
    const name = String(parsed.frontmatter.name ?? path.basename(relativeFile, ".md"));

    artifacts.push({
      type: artifactType,
      name,
      file: relativeFile,
      pack,
      schema: typeof parsed.frontmatter.schema === "string" ? parsed.frontmatter.schema : undefined,
      summary: typeof parsed.frontmatter.summary === "string" ? parsed.frontmatter.summary : undefined,
      frontmatter: parsed.frontmatter
    });
  }

  return artifacts.sort((left, right) => left.name.localeCompare(right.name));
}

export function inferArtifactType(relativeFile: string): CatalogArtifactType | null {
  if (relativeFile.endsWith("/pack.md")) {
    return "pack";
  }

  if (relativeFile.includes("/agents/")) {
    return "agent";
  }

  if (relativeFile.includes("/tasks/")) {
    return "task";
  }

  if (relativeFile.includes("/workflows/")) {
    return "workflow";
  }

  if (relativeFile.includes("/knowledge/")) {
    return "knowledge";
  }

  if (relativeFile.includes("/checklists/")) {
    return "checklist";
  }

  if (relativeFile.includes("/templates/")) {
    return "template";
  }

  return null;
}
