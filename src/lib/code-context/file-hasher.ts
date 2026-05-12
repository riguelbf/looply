import path from "node:path";
import crypto from "node:crypto";
import fs from "fs-extra";
import { globby } from "globby";
import { CODE_CONTEXT_IGNORED_GLOBS } from "./providers/base.js";

export interface FileHashes {
  generatedAt: string;
  targetRoot: string;
  files: Record<string, string>;
}

export function resolveFileHashesFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "file-hashes.json");
}

export async function loadFileHashes(targetRoot: string): Promise<FileHashes | null> {
  const file = resolveFileHashesFile(targetRoot);
  if (!(await fs.pathExists(file))) {
    return null;
  }
  const raw = await fs.readJson(file);
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  return raw as FileHashes;
}

export async function saveFileHashes(targetRoot: string, hashes: FileHashes): Promise<string> {
  const file = resolveFileHashesFile(targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.writeJson(file, hashes, { spaces: 2 });
  return file;
}

export function computeFileHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export async function computeFileHashFromDisk(filePath: string): Promise<{ file: string; hash: string } | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return { file: filePath, hash: computeFileHash(content) };
  } catch {
    return null;
  }
}

export async function collectSourceFiles(targetRoot: string): Promise<string[]> {
  const files = await globby(["**/*.{ts,tsx,js,jsx,py,cs,java,yaml,yml,sh,prisma,sql}"], {
    cwd: targetRoot,
    absolute: true,
    onlyFiles: true,
    dot: true,
    ignore: CODE_CONTEXT_IGNORED_GLOBS,
  });
  return files;
}

export async function computeAllFileHashes(targetRoot: string): Promise<FileHashes> {
  const files = await collectSourceFiles(targetRoot);
  const entries = await Promise.all(
    files.map(async (file) => computeFileHashFromDisk(file))
  );
  const fileMap: Record<string, string> = {};
  for (const entry of entries) {
    if (entry) {
      fileMap[entry.file] = entry.hash;
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    targetRoot,
    files: fileMap,
  };
}

export interface StaleCheckResult {
  stale: boolean;
  changedFiles: string[];
  addedFiles: string[];
  removedFiles: string[];
  unchangedCount: number;
}

export function detectStaleFiles(previous: FileHashes, current: FileHashes): StaleCheckResult {
  const previousFiles = new Set(Object.keys(previous.files));
  const currentFiles = new Set(Object.keys(current.files));

  const changedFiles: string[] = [];
  const addedFiles: string[] = [];
  const removedFiles: string[] = [];
  let unchangedCount = 0;

  for (const file of currentFiles) {
    if (previousFiles.has(file)) {
      if (previous.files[file] !== current.files[file]) {
        changedFiles.push(file);
      } else {
        unchangedCount++;
      }
    } else {
      addedFiles.push(file);
    }
  }

  for (const file of previousFiles) {
    if (!currentFiles.has(file)) {
      removedFiles.push(file);
    }
  }

  return {
    stale: changedFiles.length > 0 || addedFiles.length > 0 || removedFiles.length > 0,
    changedFiles,
    addedFiles,
    removedFiles,
    unchangedCount,
  };
}

export async function isCodeContextFresh(targetRoot: string): Promise<{ fresh: boolean; changedFiles: string[]; reason?: string }> {
  const previous = await loadFileHashes(targetRoot);
  if (!previous) {
    return { fresh: false, changedFiles: [], reason: "no-previous-hashes" };
  }

  const current = await computeAllFileHashes(targetRoot);
  const result = detectStaleFiles(previous, current);

  if (result.stale) {
    const allChanged = [...result.changedFiles, ...result.addedFiles, ...result.removedFiles];
    return {
      fresh: false,
      changedFiles: allChanged,
      reason: `${result.changedFiles.length} changed, ${result.addedFiles.length} added, ${result.removedFiles.length} removed`,
    };
  }

  await saveFileHashes(targetRoot, current);
  return { fresh: true, changedFiles: [] };
}
