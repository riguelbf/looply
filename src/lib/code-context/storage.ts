import path from "node:path";
import fs from "fs-extra";
import type { CodeContextDocument } from "./schema.js";
import { KNOWLEDGE_GRAPH_VERSION, type KnowledgeGraph } from "./graph-schema.js";

export function resolveCodeContextFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "code-context.json");
}

export function resolveKnowledgeGraphFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "knowledge-graph.json");
}

export async function writeCodeContext(targetRoot: string, document: CodeContextDocument): Promise<string> {
  const file = resolveCodeContextFile(targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.writeJson(file, document, { spaces: 2 });
  return file;
}

export async function readCodeContext(targetRoot: string): Promise<CodeContextDocument | null> {
  const file = resolveCodeContextFile(targetRoot);
  if (!(await fs.pathExists(file))) {
    return null;
  }

  const raw = await fs.readJson(file);
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  return raw as CodeContextDocument;
}

export async function writeKnowledgeGraph(targetRoot: string, graph: KnowledgeGraph): Promise<string> {
  const file = resolveKnowledgeGraphFile(targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.writeJson(file, graph, { spaces: 2 });
  return file;
}

export async function readKnowledgeGraph(targetRoot: string): Promise<KnowledgeGraph | null> {
  const file = resolveKnowledgeGraphFile(targetRoot);
  if (!(await fs.pathExists(file))) {
    return null;
  }

  const raw = await fs.readJson(file);
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const version = (raw as Record<string, unknown>).version;
  if (version !== KNOWLEDGE_GRAPH_VERSION) {
    return null;
  }

  return raw as KnowledgeGraph;
}
