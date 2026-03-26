# Fluxo de Workflows

Os workflows do `engineering-base` separam discovery, planning e delivery para manter handoffs claros e gates explicitos.

## Sequencia recomendada

1. `idea-to-prd`
2. `prd-to-stories`
3. `story-to-production`
4. `workflow-status`, `resume` ou `next`

## Discovery

`idea-to-prd` transforma problema inicial em `PRD`.

### Agente principal

- `pm-analyst`

### Output principal

- `prd`

## Planning

`prd-to-stories` converte o `PRD` em backlog de stories.

### Agentes principais

- `pm-analyst`
- `delivery-orchestrator`

### Output principal

- `story-backlog`

## Delivery

`story-to-production` conduz design tecnico, implementacao, review e release da story selecionada.

### Agentes principais

- `architect`
- `backend`
- `reviewer`
- `delivery-orchestrator`

### Outputs principais

- `tech-spec`
- `adr`
- `implementation-summary`
- `review-report`
- `release-plan`

## Retomada

Use:

- `/looply:workflow-status`
- `/looply:resume`
- `/looply:next`

Quando houver varias sessoes abertas, vincule `session-label`.

## Referencia detalhada

- [Workflows](/reference/generated/workflows)
- [Slash Commands](/reference/generated/slash-commands)
- [Catalogo do Engineering Base](/guides/catalog)
