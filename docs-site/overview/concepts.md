# Conceitos

## Pack

Unidade de distribuicao do looply. Um pack agrupa agents, tasks, workflows, templates, knowledge e checklists. Packs podem incluir outros packs (ex: `software-delivery-suite` inclui `product-base` e `engineering-base`).

### Managed Pack

Copia gerenciada de um pack instalada em `.looply/managed/packs/`. O looply sincroniza o conteudo dos packs fonte (`packs/`) para este diretorio durante `install` e `sync`. Os hosts consomem os artefatos a partir da copia gerenciada.

## Workflow

Artefato que descreve fases, stages, gates e handoffs. No `engineering-base`, os workflows seguem discovery, planning, delivery e diagnosis.

## Agent

Capacidade operacional especializada. Exemplo: `pm-analyst`, `architect`, `backend`, `reviewer`, `delivery-orchestrator`.

### context_slots

Cada agente declara no frontmatter quais contextos precisa receber para ser mais assertivo. O publisher do looply resolve slots `inline` durante `sync`/`install`; slots `reference` ficam para o host resolver em runtime.

| source | compose | descricao |
|---|---|---|
| `self.constraints` | `inline` | Restricoes do agente injetadas diretamente no skill |
| `self.knowledge_sources` | `inline` | Conteudo dos knowledge files lido e inlinado |
| `self.escalation_rules` | `inline` | Regras de escalacao visiveis no prompt |
| `rules` | `inline` | Project rules filtradas por categoria |
| `stage.inputs` | `reference` | Artefatos do stage anterior (host le em runtime) |
| `feature` | `reference` | Contexto da feature ativa (host resolve) |
| `workflow.ledger` | `reference` | Context Ledger da feature (decisoes acumuladas de todos os stages) |

## Task

Instrucoes de trabalho para um agent. O looply nao executa a task; ele publica o contrato para o host.

## Squad

Agrupamento de agentes, tasks, workflows e conhecimento sob um dominio. Exemplo: `architecture-squad` agrupa `architect`, `create-tech-spec`, `story-to-production` e `architecture-principles`. Definido via contrato `looply/squad@v1`.

## Feature

Unidade de trabalho rastreada pelo looply. Cada feature possui estado de workflow persistido em `.looply/custom/features/<feature-name>/` com `workflow-control.json`, `workflow-status.md`, `context-ledger.db` e artefatos de saida (stories, PRD, tech-spec, etc.).

## Context Ledger

Memoria compartilhada append-only por feature. Cada stage do workflow adiciona decisoes, rationale, constraints e riscos ao banco SQLite `context-ledger.db`. O CLI publica o template e as regras de execucao; os agentes (LLMs) interagem com o ledger atraves dos comandos `looply ledger read`, `looply ledger append` e `looply ledger summary`.

Duas zonas de leitura:
- Summary (3-5 linhas) — para agents com `context_budget: low`, via `looply ledger read --summary-only`
- Stage log completo — entradas estruturadas por stage, para budgets `medium+`, via `looply ledger read`

Integrado ao sistema de `context_slots` via source `workflow.ledger`. Registrado no `context-index.md` para descoberta automatica pelo LLM.

## Host

Ambiente de execucao onde o looply publica seus artefatos. Cada host (Codex, Claude Code) recebe skills, comandos, playbooks e arquivos de estado no seu formato nativo. O looply publica o contrato; o host executa.

## Platform Contracts

Contratos formais do modelo de dados do looply em `platform/contracts/`. Definem o schema YAML obrigatorio para cada tipo de artefato (`agent@v1`, `task@v1`, `workflow@v1`, `knowledge@v1`, `squad@v1`). Garantem consistencia entre packs e hosts.

## Publishing

Camada que materializa artefatos do looply no formato nativo de cada host. Gera skills, comandos, hints de execucao e arquivos de superficie. Comandos: `install`, `sync`, `upgrade`, `doctor`.

## Integrations

Contexto de integracoes externas em Markdown. Cada integracao (ex: Stripe, AWS) tem um arquivo `.looply/custom/integrations/<nome>.md` com detalhes de API, autenticacao e constraints. Comandos: `looply integrations list/add/configure`.

## Contexto

looply diferencia contexto de projeto, feature, sessao e integracao. Em `existing-project`, a politica correta e `codebase-first-with-artifact-acceleration`.

## Knowledge Graph

Grafo de conhecimento persistente que conecta entidades de codigo (modulos, arquivos, classes, funcoes), banco de dados (tabelas, colunas, foreign keys) e features. Gerado automaticamente pelo `refresh-code-context` e armazenado em `.looply/state/knowledge-graph.json`.

### Nos

| Kind | Descricao | Provider |
|------|-----------|----------|
| `module` | Agrupamento logico de arquivos (ex: `src/lib`) | typescript, python, etc. |
| `file` | Arquivo fonte | todos |
| `class` | Classe ou tipo | typescript, python, dotnet-csharp, java |
| `function` | Funcao ou metodo | typescript, javascript, python, shell |
| `table` | Tabela de banco de dados | prisma, drizzle, typeorm, sql |
| `column` | Coluna de tabela | prisma, drizzle, typeorm, sql |

### Arestas

| Type | Significado |
|------|-------------|
| `imports` | Modulo/arquivo importa outro |
| `contains` | Modulo contem arquivo, classe contem metodo |
| `belongs_to` | Entidade pertence a um modulo |
| `has_column` | Tabela possui coluna |
| `references_col` | FK referencia PK de outra tabela |
| `maps_to` | Classe/model mapeia para tabela |
| `impacts` | Story impacta entidade de codigo/banco |

### Database Schema Extraction

Extrai schema de banco sem conexao (Camada 1 - analise estatica):
- **Prisma**: `prisma/schema.prisma` — models, fields, `@relation`
- **Drizzle**: `pgTable`/`mysqlTable` — tabelas, colunas, `.references()`
- **TypeORM**: `@Entity()` decorators — entidades, colunas, relacoes
- **SQL migrations**: `**/migrations/**/*.sql` — `CREATE TABLE`, FK constraints

Zero credenciais sao lidas ou persistidas.

