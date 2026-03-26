import path from "node:path";
import { globby } from "globby";

export async function listAvailablePacks(sourceRoot: string): Promise<string[]> {
  const matches = await globby("packs/*/pack.md", {
    cwd: sourceRoot,
    onlyFiles: true
  });

  return matches.map((match) => path.basename(path.dirname(match))).sort((left, right) => left.localeCompare(right));
}
