import fs from "node:fs/promises";
import matter from "gray-matter";

export interface MarkdownArtifact {
  path: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export async function readMarkdownArtifact(filePath: string): Promise<MarkdownArtifact> {
  const source = await fs.readFile(filePath, "utf8");
  const parsed = matter(source);

  return {
    path: filePath,
    frontmatter: parsed.data,
    body: parsed.content
  };
}
