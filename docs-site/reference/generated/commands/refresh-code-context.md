# refresh-code-context

Refresh multi-language code-context discovery for the current repository. Generates `.looply/state/code-context.json` with modules, symbols, relations, entrypoints and related tests, and `.looply/state/knowledge-graph.json` with a persistent knowledge graph connecting code entities and database schemas.

## Knowledge Graph

O comando gera automaticamente um Knowledge Graph que resolve dependencias entre modulos, extrai schema de banco de dados (Prisma, Drizzle, TypeORM, migrations SQL) e conecta entidades de codigo a tabelas. O grafo e persistido como JSON e consultavel pela API `GraphQuery`.

## Arquivo de origem

- `src/commands/refresh-code-context.ts`
- `src/lib/code-context/manager.ts`
- `src/lib/code-context/graph-builder.ts`
- `src/lib/code-context/resolve-deps.ts`
- `src/lib/code-context/providers/database.ts`

## Options

- `--dir <dir>`: Target directory for code-context refresh (defaults to current directory)
- `--skip-graph`: Skip knowledge graph generation

[Voltar para comandos](../commands)
