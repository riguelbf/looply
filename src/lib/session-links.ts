import path from "node:path";
import fs from "fs-extra";

export interface SessionLinkEntry {
  label: string;
  feature: string;
  workflow?: string;
  lastCommand?: string;
  lastUpdatedAt?: string;
}

export interface SessionLinksDocument {
  version: number;
  sessions: SessionLinkEntry[];
}

export function resolveSessionLinksFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "custom", "session-links.json");
}

export async function ensureSessionLinksFile(targetRoot: string): Promise<string> {
  const file = resolveSessionLinksFile(targetRoot);
  if (!(await fs.pathExists(file))) {
    await fs.ensureDir(path.dirname(file));
    await fs.writeJson(file, { version: 1, sessions: [] } satisfies SessionLinksDocument, { spaces: 2 });
  }

  return file;
}

export async function readSessionLinks(targetRoot: string): Promise<SessionLinksDocument> {
  const file = await ensureSessionLinksFile(targetRoot);
  const raw = await fs.readJson(file);
  if (typeof raw !== "object" || raw === null || !Array.isArray((raw as { sessions?: unknown }).sessions)) {
    return {
      version: 1,
      sessions: []
    };
  }

  return {
    version: typeof (raw as { version?: unknown }).version === "number" ? (raw as { version: number }).version : 1,
    sessions: (raw as { sessions: unknown[] }).sessions
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        label: String(item.label ?? ""),
        feature: String(item.feature ?? ""),
        workflow: typeof item.workflow === "string" ? item.workflow : undefined,
        lastCommand: typeof item.lastCommand === "string" ? item.lastCommand : undefined,
        lastUpdatedAt: typeof item.lastUpdatedAt === "string" ? item.lastUpdatedAt : undefined
      }))
      .filter((item) => item.label !== "" && item.feature !== "")
  };
}

export async function upsertSessionLink(
  targetRoot: string,
  input: {
    label: string;
    feature: string;
    workflow?: string;
    lastCommand?: string;
  }
): Promise<string> {
  const file = await ensureSessionLinksFile(targetRoot);
  const current = await readSessionLinks(targetRoot);
  const nextEntry: SessionLinkEntry = {
    label: input.label,
    feature: input.feature,
    workflow: input.workflow,
    lastCommand: input.lastCommand,
    lastUpdatedAt: new Date().toISOString()
  };

  const sessions = current.sessions.filter((session) => session.label !== input.label);
  sessions.push(nextEntry);

  await fs.writeJson(file, {
    version: current.version,
    sessions: sessions.sort((left, right) => left.label.localeCompare(right.label))
  } satisfies SessionLinksDocument, { spaces: 2 });

  return file;
}

export async function removeSessionLink(targetRoot: string, label: string): Promise<string> {
  const file = await ensureSessionLinksFile(targetRoot);
  const current = await readSessionLinks(targetRoot);
  await fs.writeJson(file, {
    version: current.version,
    sessions: current.sessions.filter((session) => session.label !== label)
  } satisfies SessionLinksDocument, { spaces: 2 });
  return file;
}
