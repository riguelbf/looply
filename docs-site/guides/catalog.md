# Catalogo do Engineering Base

O pack `engineering-base` e a base operacional do looply para discovery, planning e delivery.

## Agentes

### `pm-analyst`

Responsavel por discovery, entendimento do problema, consolidacao do PRD e preparo da entrada para planning.

### `delivery-orchestrator`

Responsavel por coordenar workflow, gates, handoffs, retomada e estado da feature.

### `architect`

Responsavel por `tech-spec`, `ADR` e desenho tecnico antes da implementacao.

### `backend`

Responsavel pela implementacao da story e atualizacao dos artefatos tecnicos de entrega.

### `reviewer`

Responsavel por review, validacao de qualidade e readiness para release.

## Workflows

### `idea-to-prd`

Discovery. Parte de uma ideia ou problema e termina com `PRD`.

### `prd-to-stories`

Planning. Transforma `PRD` em backlog de stories.

### `story-to-production`

Delivery. Leva uma story selecionada por design tecnico, implementacao, review e release.

### `workflow-status`

Status e retomada. Reconcilia artefatos, sessao e proximo passo.

## Tasks centrais

- `analyze-requirement`
- `create-prd`
- `break-prd-into-stories`
- `create-tech-spec`
- `create-adr`
- `implement-api`
- `review-code`
- `report-workflow-status`
- `orchestrate-delivery`

## Como navegar

- detalhes de agentes: [Agents](/reference/generated/agents)
- detalhes de tasks: [Tasks](/reference/generated/tasks)
- detalhes de workflows: [Workflows](/reference/generated/workflows)
- detalhes de slash commands: [Slash Commands](/reference/generated/slash-commands)
