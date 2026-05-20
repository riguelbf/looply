import path from "node:path";
import fs from "fs-extra";
import Database from "better-sqlite3";

export interface LedgerEntry {
  id: number;
  stage: string;
  decision: string;
  rationale: string;
  constraints: string;
  risks: string;
  createdAt: string;
}

export interface LedgerSummary {
  content: string;
  updatedAt: string;
}

export interface LedgerReadResult {
  summary: LedgerSummary;
  entries: LedgerEntry[];
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stage TEXT NOT NULL,
  decision TEXT NOT NULL,
  rationale TEXT NOT NULL DEFAULT '',
  constraints TEXT NOT NULL DEFAULT '',
  risks TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS summary (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  content TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO summary (id, content) VALUES (1, '');
`;

export function resolveLedgerFile(targetRoot: string, feature: string): string {
  return path.join(targetRoot, ".looply", "custom", "features", feature, "context-ledger.db");
}

function openDb(dbPath: string): Database.Database {
  fs.ensureDirSync(path.dirname(dbPath));
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA_SQL);
  return db;
}

export function initLedger(targetRoot: string, feature: string): string {
  const dbPath = resolveLedgerFile(targetRoot, feature);
  const db = openDb(dbPath);
  db.close();
  return dbPath;
}

export function ensureLedger(targetRoot: string, feature: string): string {
  const dbPath = resolveLedgerFile(targetRoot, feature);
  if (!fs.pathExistsSync(dbPath)) {
    return initLedger(targetRoot, feature);
  }
  return dbPath;
}

export function readLedger(targetRoot: string, feature: string): LedgerReadResult {
  const dbPath = resolveLedgerFile(targetRoot, feature);
  if (!fs.pathExistsSync(dbPath)) {
    return { summary: { content: "", updatedAt: "" }, entries: [] };
  }

  const db = openDb(dbPath);
  const summaryRow = db.prepare("SELECT content, updated_at FROM summary WHERE id = 1").get() as
    | { content: string; updated_at: string }
    | undefined;
  const entries = db.prepare(
    "SELECT id, stage, decision, rationale, constraints, risks, created_at FROM entries ORDER BY id DESC"
  ).all() as Array<{
    id: number;
    stage: string;
    decision: string;
    rationale: string;
    constraints: string;
    risks: string;
    created_at: string;
  }>;
  db.close();

  return {
    summary: {
      content: summaryRow?.content ?? "",
      updatedAt: summaryRow?.updated_at ?? ""
    },
    entries: entries.map((row) => ({
      id: row.id,
      stage: row.stage,
      decision: row.decision,
      rationale: row.rationale,
      constraints: row.constraints,
      risks: row.risks,
      createdAt: row.created_at
    }))
  };
}

export function appendLedgerEntry(
  targetRoot: string,
  feature: string,
  input: {
    stage: string;
    decision: string;
    rationale?: string;
    constraints?: string;
    risks?: string;
  }
): LedgerEntry {
  const dbPath = ensureLedger(targetRoot, feature);
  const db = openDb(dbPath);
  const stmt = db.prepare(
    "INSERT INTO entries (stage, decision, rationale, constraints, risks) VALUES (?, ?, ?, ?, ?)"
  );
  const result = stmt.run(
    input.stage,
    input.decision,
    input.rationale ?? "",
    input.constraints ?? "",
    input.risks ?? ""
  );
  const inserted = db.prepare(
    "SELECT id, stage, decision, rationale, constraints, risks, created_at FROM entries WHERE id = ?"
  ).get(result.lastInsertRowid) as {
    id: number;
    stage: string;
    decision: string;
    rationale: string;
    constraints: string;
    risks: string;
    created_at: string;
  };
  db.close();

  return {
    id: inserted.id,
    stage: inserted.stage,
    decision: inserted.decision,
    rationale: inserted.rationale,
    constraints: inserted.constraints,
    risks: inserted.risks,
    createdAt: inserted.created_at
  };
}

export function readLedgerSummary(
  targetRoot: string,
  feature: string
): LedgerSummary {
  const dbPath = resolveLedgerFile(targetRoot, feature);
  if (!fs.pathExistsSync(dbPath)) {
    return { content: "", updatedAt: "" };
  }

  const db = openDb(dbPath);
  const row = db.prepare("SELECT content, updated_at FROM summary WHERE id = 1").get() as
    | { content: string; updated_at: string }
    | undefined;
  db.close();

  return {
    content: row?.content ?? "",
    updatedAt: row?.updated_at ?? ""
  };
}

export function updateLedgerSummary(
  targetRoot: string,
  feature: string,
  content: string
): LedgerSummary {
  const dbPath = ensureLedger(targetRoot, feature);
  const db = openDb(dbPath);
  db.prepare(
    "INSERT INTO summary (id, content, updated_at) VALUES (1, ?, datetime('now')) ON CONFLICT(id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at"
  ).run(content);
  const row = db.prepare("SELECT content, updated_at FROM summary WHERE id = 1").get() as {
    content: string;
    updated_at: string;
  };
  db.close();

  return {
    content: row.content,
    updatedAt: row.updated_at
  };
}

export function readLedgerEntriesOnly(
  targetRoot: string,
  feature: string
): LedgerEntry[] {
  return readLedger(targetRoot, feature).entries;
}
