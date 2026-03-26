import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function resolveLooplySourceRoot(override?: string): string {
  if (override) {
    return path.resolve(override);
  }

  const fromModule = findLooplySourceRoot(path.dirname(fileURLToPath(import.meta.url)));
  if (fromModule) {
    return fromModule;
  }

  const fromWorkingDirectory = findLooplySourceRoot(process.cwd());
  if (fromWorkingDirectory) {
    return fromWorkingDirectory;
  }

  throw new Error("Could not resolve looply source root. Use --source-root to point to a directory that contains packs/.");
}

function findLooplySourceRoot(startDirectory: string): string | null {
  let currentDirectory = path.resolve(startDirectory);

  while (true) {
    if (looksLikeLooplyRoot(currentDirectory)) {
      return currentDirectory;
    }

    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      return null;
    }

    currentDirectory = parentDirectory;
  }
}

function looksLikeLooplyRoot(directory: string): boolean {
  return fs.existsSync(path.join(directory, "packs")) && fs.existsSync(path.join(directory, "package.json"));
}
