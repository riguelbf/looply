# Arquitetura

## Camadas

### Core

- artefatos Markdown com frontmatter
- validacao
- regras de contexto
- metadados de execucao

### Publishing

- adapters por host
- materializacao de arquivos nativos
- `install`, `sync`, `upgrade`, `doctor`

### Operation

- comandos CLI
- contexto de projeto, feature, sessao e integracoes
- workflow status e retomada de sessoes

## Modulos do repositorio

- `src/lib/code-context/`: descoberta multi-linguagem, providers, graph builder, query API e resolucao de dependencias
  - `schema.ts`: tipos do `CodeContextDocument` (modulos, simbolos, relacoes)
  - `graph-schema.ts`: tipos do `KnowledgeGraph` (KnowledgeNode, KnowledgeEdge)
  - `manager.ts`: orquestrador do `refresh-code-context`
  - `providers/`: 7 providers de linguagem + `database.ts` (Prisma, Drizzle, TypeORM, SQL)
  - `graph-builder.ts`: construtor do Knowledge Graph
  - `resolve-deps.ts`: cross-module dependency resolver
  - `graph-query.ts`: API de consulta (`neighborhood`, `path`, `dependentsOf`)
  - `feature-impact.ts`: mapeamento feature→codigo com graph traversal + fallback token-matching
  - `storage.ts`: persistencia de `code-context.json` e `knowledge-graph.json`
- `src/lib/`: contratos, helpers e fluxos compartilhados
- `src/hosts/`: adapters e publicacao por host
- `src/validation/`: validacao de packs
- `packs/`: artefatos publicados (fonte)
- `.looply/managed/packs/`: packs gerenciados (runtime)
- `.looply/custom/features/`: features em progresso com estado de workflow persistido (`workflow-status.md`, `context-ledger.md`, `workflow-control.json`)
- `.looply/state/`: arquivos de estado operacional (playbooks, hints, comandos)
- `platform/contracts/`: contratos formais do modelo de dados (agent, task, workflow, knowledge, squad)
- `tools/`: helpers de descoberta de codigo (.NET, Python)
- `docs-site/`: portal de documentacao

