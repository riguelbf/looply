import path from "node:path";
import fs from "fs-extra";
import { globby } from "globby";
import { readFiles, toRelativePath } from "./shared.js";
import type { KnowledgeNode, KnowledgeEdge } from "../graph-schema.js";

export interface DatabaseExtractResult {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

const PRISMA_SCHEMA_FILE = "prisma/schema.prisma";

export async function extractDatabaseSchema(
  primaryContextRoot: string
): Promise<DatabaseExtractResult> {
  const nodes: KnowledgeNode[] = [];
  const edges: KnowledgeEdge[] = [];

  const prismaResult = await extractPrismaSchema(primaryContextRoot);
  nodes.push(...prismaResult.nodes);
  edges.push(...prismaResult.edges);

  const drizzleResult = await extractDrizzleSchema(primaryContextRoot);
  nodes.push(...drizzleResult.nodes);
  edges.push(...drizzleResult.edges);

  const typeOrmResult = await extractTypeOrmSchema(primaryContextRoot);
  nodes.push(...typeOrmResult.nodes);
  edges.push(...typeOrmResult.edges);

  const sqlResult = await extractSqlMigrations(primaryContextRoot);
  nodes.push(...sqlResult.nodes);
  edges.push(...sqlResult.edges);

  const dedupedNodes = deduplicateNodes(nodes);
  const dedupedEdges = deduplicateEdges(edges);

  return { nodes: dedupedNodes, edges: dedupedEdges };
}

async function extractPrismaSchema(
  primaryContextRoot: string
): Promise<DatabaseExtractResult> {
  const nodes: KnowledgeNode[] = [];
  const edges: KnowledgeEdge[] = [];

  const schemaFile = path.join(primaryContextRoot, PRISMA_SCHEMA_FILE);
  if (!(await fs.pathExists(schemaFile))) {
    return { nodes, edges };
  }

  const content = await fs.readFile(schemaFile, "utf8");
  const relativeFile = PRISMA_SCHEMA_FILE;

  const modelRegex = /^\s*model\s+(\w+)\s*\{/gm;
  const enumRegex = /^\s*enum\s+(\w+)\s*\{/gm;

  let match: RegExpExecArray | null;
  const models: Array<{ name: string; startIndex: number; endIndex: number }> = [];

  while ((match = modelRegex.exec(content)) !== null) {
    const startIndex = match.index;
    const braceCount = findClosingBrace(content, content.indexOf("{", startIndex));
    models.push({ name: match[1], startIndex, endIndex: braceCount });
  }

  for (const model of models) {
    const modelBody = content.slice(
      content.indexOf("{", model.startIndex) + 1,
      model.endIndex
    );

    const tableId = `table:prisma:${model.name}`;
    nodes.push({
      id: tableId,
      kind: "table",
      label: model.name,
      provider: "prisma",
      file: relativeFile
    });

    const fieldLines = modelBody.split("\n");
    for (const line of fieldLines) {
      const fieldMatch = line.match(/^\s*(\w+)\s+(\w+)(\[\])?(\s*@[\w.]+(?:\([^)]*\))?)*/);
      if (!fieldMatch) continue;

      const fieldName = fieldMatch[1];
      const fieldType = fieldMatch[2] + (fieldMatch[3] ?? "");
      const rest = line.slice(fieldMatch[0].length);

      const isPk = /@id/.test(rest);
      const isUnique = /@unique/.test(rest);
      const isOptional = fieldName.endsWith("?") || /@default/.test(rest);
      const hasDefault = /@default/.test(rest);

      const cleanName = fieldName.replace(/\?$/, "");

      const columnId = `column:prisma:${model.name}:${cleanName}`;
      nodes.push({
        id: columnId,
        kind: "column",
        label: `${model.name}.${cleanName}`,
        provider: "prisma",
        file: relativeFile,
        metadata: {
          type: fieldType,
          nullable: isOptional && !hasDefault ? true : undefined,
          pk: isPk || undefined,
          unique: isUnique || undefined
        }
      });

      edges.push({
        type: "has_column",
        from: tableId,
        to: columnId
      });

      const relationMatch = rest.match(/@relation\([^)]*fields:\s*\[(\w+)\][^)]*references:\s*\[(\w+)\][^)]*\)/);
      if (relationMatch) {
        const fkField = relationMatch[1];
        const refField = relationMatch[2];

        const refModelMatch = line.match(/^\s*(\w+)\s+(\w+)/);
        if (refModelMatch) {
          const refModel = refModelMatch[2];
          const fkColumnId = `column:prisma:${model.name}:${fkField}`;
          const refColumnId = `column:prisma:${refModel}:${refField}`;

          if (!nodes.some((n) => n.id === fkColumnId)) {
            nodes.push({
              id: fkColumnId,
              kind: "column",
              label: `${model.name}.${fkField}`,
              provider: "prisma",
              file: relativeFile,
              metadata: { type: fieldType, fk: true }
            });
            edges.push({ type: "has_column", from: tableId, to: fkColumnId });
          }

          edges.push({
            type: "references_col",
            from: fkColumnId,
            to: refColumnId
          });
        }
      }
    }
  }

  return { nodes, edges };
}

function findClosingBrace(content: string, startIndex: number): number {
  let depth = 0;
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === "{") depth++;
    if (content[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return content.length - 1;
}

async function extractDrizzleSchema(
  primaryContextRoot: string
): Promise<DatabaseExtractResult> {
  const nodes: KnowledgeNode[] = [];
  const edges: KnowledgeEdge[] = [];

  const files = await globby(["**/db/schema.ts", "**/schema.ts", "**/db/**/*.ts"], {
    cwd: primaryContextRoot,
    absolute: true,
    onlyFiles: true,
    ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"]
  });

  for (const file of files.slice(0, 50)) {
    const content = await fs.readFile(file, "utf8");

    if (!/(pgTable|mysqlTable|sqliteTable)\s*\(/.test(content)) {
      continue;
    }

    const relativeFile = toRelativePath(primaryContextRoot, file);
    const tableRegex = /(?:pgTable|mysqlTable|sqliteTable)\s*\(\s*["'](\w+)["']\s*,\s*\{([^}]*)\}/g;

    let match: RegExpExecArray | null;
    while ((match = tableRegex.exec(content)) !== null) {
      const tableName = match[1];
      const body = match[2];

      const tableId = `table:drizzle:${tableName}`;
      nodes.push({
        id: tableId,
        kind: "table",
        label: tableName,
        provider: "drizzle",
        file: relativeFile
      });

      const columnRegex = /(\w+)\s*:\s*\w+\s*\(["'](\w+)["']\)/g;
      let colMatch: RegExpExecArray | null;
      while ((colMatch = columnRegex.exec(body)) !== null) {
        const colName = colMatch[1];
        const dbType = colMatch[2];

        const columnId = `column:drizzle:${tableName}:${colName}`;
        const colDef = body.slice(colMatch.index + colMatch[0].length, body.length);

        nodes.push({
          id: columnId,
          kind: "column",
          label: `${tableName}.${colName}`,
          provider: "drizzle",
          file: relativeFile,
          metadata: {
            type: dbType,
            pk: /\.primaryKey\(\)/.test(colDef) || undefined
          }
        });

        edges.push({
          type: "has_column",
          from: tableId,
          to: columnId
        });

        const refMatch = colDef.match(/\.references\(\s*\(\s*\)\s*=>\s*\w+\.(\w+)/);
        if (refMatch) {
          const refCol = refMatch[1];
          const refTableMatch = colDef.match(/\.references\(\s*\(\s*\)\s*=>\s*(\w+)\.(\w+)/);
          if (refTableMatch) {
            const refTable = refTableMatch[1];
            const refColumnId = `column:drizzle:${refTable}:${refCol}`;
            edges.push({
              type: "references_col",
              from: columnId,
              to: refColumnId
            });
          }
        }
      }
    }
  }

  return { nodes, edges };
}

async function extractTypeOrmSchema(
  primaryContextRoot: string
): Promise<DatabaseExtractResult> {
  const nodes: KnowledgeNode[] = [];
  const edges: KnowledgeEdge[] = [];

  const files = await globby(["**/*.entity.ts", "**/*.entity.js", "**/entities/**/*.ts"], {
    cwd: primaryContextRoot,
    absolute: true,
    onlyFiles: true,
    ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"]
  });

  for (const file of files.slice(0, 50)) {
    const content = await fs.readFile(file, "utf8");

    if (!/@Entity\s*\(/.test(content)) {
      continue;
    }

    const relativeFile = toRelativePath(primaryContextRoot, file);
    const classRegex = /(?:export\s+)?class\s+(\w+)/;
    const classMatch = classRegex.exec(content);
    const className = classMatch ? classMatch[1] : path.basename(file, ".ts").replace(".entity", "");

    const tableName = className
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .toLowerCase();

    const tableId = `table:typeorm:${tableName}`;
    nodes.push({
      id: tableId,
      kind: "table",
      label: tableName,
      provider: "typeorm",
      file: relativeFile,
      metadata: { className }
    });

    const columnRegex = /@Column\s*\(\s*(?:\{[^}]*\}\s*)?\)?\s*(?:export\s+)?\w+\??\s*:\s*(\w+)\s*;/g;
    let colMatch: RegExpExecArray | null;
    while ((colMatch = columnRegex.exec(content)) !== null) {
      const colType = colMatch[1];
      const beforeMatch = content.slice(Math.max(0, colMatch.index - 200), colMatch.index);
      const fieldMatch = beforeMatch.match(/(\w+)\??\s*:\s*\w+\s*;?\s*$/);

      if (fieldMatch) {
        const colName = fieldMatch[1].replace(/\?$/, "");

        const columnId = `column:typeorm:${tableName}:${colName}`;
        nodes.push({
          id: columnId,
          kind: "column",
          label: `${tableName}.${colName}`,
          provider: "typeorm",
          file: relativeFile,
          metadata: { type: colType }
        });

        edges.push({
          type: "has_column",
          from: tableId,
          to: columnId
        });
      }
    }

    const pkColumnRegex = /@PrimaryColumn\s*\(\s*(?:\{[^}]*\}\s*)?\)?\s*(?:export\s+)?(\w+)\??\s*:/g;
    while ((colMatch = pkColumnRegex.exec(content)) !== null) {
      const colName = colMatch[1];
      const columnId = `column:typeorm:${tableName}:${colName}`;
      const existingNode = nodes.find((n) => n.id === columnId);
      if (existingNode) {
        (existingNode.metadata ??= {}).pk = true;
      }
    }
  }

  return { nodes, edges };
}

async function extractSqlMigrations(
  primaryContextRoot: string
): Promise<DatabaseExtractResult> {
  const nodes: KnowledgeNode[] = [];
  const edges: KnowledgeEdge[] = [];

  const files = await globby(["**/migrations/**/*.sql", "**/*.sql"], {
    cwd: primaryContextRoot,
    absolute: true,
    onlyFiles: true,
    ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**", "**/vendor/**"]
  });

  for (const file of files.slice(0, 100)) {
    const content = await fs.readFile(file, "utf8");
    const relativeFile = toRelativePath(primaryContextRoot, file);

    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`|"|\[)?(\w+)(?:`|"|\])?\s*\(([\s\S]*?)\)\s*;/gi;

    let match: RegExpExecArray | null;
    while ((match = createTableRegex.exec(content)) !== null) {
      const tableName = match[1];
      const body = match[2];

      const tableId = `table:sql:${tableName}`;
      if (!nodes.some((n) => n.id === tableId)) {
        nodes.push({
          id: tableId,
          kind: "table",
          label: tableName,
          provider: "sql",
          file: relativeFile
        });
      }

      const columnLines = body.split(",").map((l) => l.trim());
      for (const colLine of columnLines) {
        const colMatch = colLine.match(/^\s*(?:`|"|\[)?(\w+)(?:`|"|\])?\s+(\w+)/i);
        if (!colMatch) continue;

        const colName = colMatch[1];
        const colType = colMatch[2].toLowerCase();

        if (["primary", "foreign", "constraint", "unique", "index", "check"].includes(colName.toLowerCase())) {
          continue;
        }

        const columnId = `column:sql:${tableName}:${colName}`;
        if (!nodes.some((n) => n.id === columnId)) {
          nodes.push({
            id: columnId,
            kind: "column",
            label: `${tableName}.${colName}`,
            provider: "sql",
            file: relativeFile,
            metadata: {
              type: colType,
              nullable: !/NOT\s+NULL/i.test(colLine) || undefined,
              pk: /PRIMARY\s+KEY/i.test(colLine) || undefined,
              defaultValue: extractDefaultValue(colLine) || undefined
            }
          });

          if (!edges.some((e) => e.type === "has_column" && e.from === tableId && e.to === columnId)) {
            edges.push({
              type: "has_column",
              from: tableId,
              to: columnId
            });
          }
        }
      }

      const fkRegex = /FOREIGN\s+KEY\s*\((?:\x60|"|\[)?(\w+)(?:\x60|"|\])?\s*\)\s*REFERENCES\s+(?:\x60|"|\[)?(\w+)(?:\x60|"|\])?\s*\((?:\x60|"|\[)?(\w+)(?:\x60|"|\])?\)/gi;
      while ((match = fkRegex.exec(body)) !== null) {
        const fkCol = match[1];
        const refTable = match[2];
        const refCol = match[3];

        edges.push({
          type: "references_col",
          from: `column:sql:${tableName}:${fkCol}`,
          to: `column:sql:${refTable}:${refCol}`
        });
      }
    }
  }

  return { nodes, edges };
}

function extractDefaultValue(colLine: string): string | null {
  const defMatch = colLine.match(/DEFAULT\s+(.+?)(?:,|$)/i);
  if (defMatch) {
    return defMatch[1].trim().replace(/['"]/g, "");
  }
  return null;
}

function deduplicateNodes(nodes: KnowledgeNode[]): KnowledgeNode[] {
  const seen = new Set<string>();
  return nodes.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });
}

function deduplicateEdges(edges: KnowledgeEdge[]): KnowledgeEdge[] {
  const seen = new Set<string>();
  return edges.filter((e) => {
    const key = `${e.type}:${e.from}:${e.to}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
