import path from "node:path";
import fs from "fs-extra";
import type { PerfCommandEvent } from "./schema.js";

export function resolvePerfEventsFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "perf-events.jsonl");
}

export async function appendPerfEvent(targetRoot: string, event: PerfCommandEvent): Promise<string> {
  const file = resolvePerfEventsFile(targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.appendFile(file, `${JSON.stringify(event)}\n`, "utf8");
  return file;
}

export async function readPerfEvents(targetRoot: string): Promise<PerfCommandEvent[]> {
  const file = resolvePerfEventsFile(targetRoot);
  if (!(await fs.pathExists(file))) {
    return [];
  }

  const source = await fs.readFile(file, "utf8");
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as PerfCommandEvent];
      } catch {
        return [];
      }
    });
}

