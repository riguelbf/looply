import path from "node:path";
import fs from "fs-extra";
import type { CodeContextDocument } from "./schema.js";

export function resolveCodeContextFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "code-context.json");
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
