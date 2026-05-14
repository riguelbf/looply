import path from "node:path";
import { globby } from "globby";
import { readMarkdownArtifact } from "./markdown-artifact.js";
import { mcpSchema, type McpFrontmatter } from "./artifact-schema.js";

export function resolveMcpDir(sourceRoot: string): string {
  return path.join(sourceRoot, "packs", "engineering-base", "mcp");
}

export async function listMcpTemplates(sourceRoot: string): Promise<McpFrontmatter[]> {
  const mcpDir = resolveMcpDir(sourceRoot);
  const files = await globby("*.md", {
    cwd: mcpDir,
    absolute: true,
    onlyFiles: true
  });

  const templates: McpFrontmatter[] = [];

  for (const file of files) {
    const parsed = await readMarkdownArtifact(file);
    const result = mcpSchema.safeParse(parsed.frontmatter);
    if (result.success) {
      templates.push(result.data);
    }
  }

  return templates.sort((a, b) => a.label.localeCompare(b.label));
}

export async function loadMcpTemplate(sourceRoot: string, name: string): Promise<McpFrontmatter | null> {
  const mcpDir = resolveMcpDir(sourceRoot);
  const file = path.join(mcpDir, `${name}.md`);

  try {
    const parsed = await readMarkdownArtifact(file);
    const result = mcpSchema.safeParse(parsed.frontmatter);
    if (result.success) {
      return result.data;
    }
    return null;
  } catch {
    return null;
  }
}
