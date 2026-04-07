# Fluxo de Workflows

Os workflows publicados pelo `software-delivery-suite` combinam discovery, planning e delivery com handoffs claros e gates explicitos.

## Example Guidance

Por default, o Looply publica exemplos curados para ajudar o host a calibrar:

- formato de `PRD`
- formato de `story`
- updates de `workflow-status`
- reports como `review-report`

Se o usuario quiser reduzir peso de contexto durante troubleshooting de latencia:

- `looply icl set reduced`
- `looply icl set off`

O workflow continua igual. O que muda e apenas a camada de guidance adicional.

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

## Intervencoes controladas

Nem todo fluxo segue em linha reta. O `looply` agora aceita intervencoes controladas sem perder rastreabilidade.

Casos cobertos:

- `looply replay <feature> --from <checkpoint>`
- `looply run-task <feature> <task>`
- `looply run-agent <feature> <agent> --task <task>`
- `looply reconcile <feature>`

Essas acoes:

- preservam o historico anterior
- marcam outputs posteriores como `superseded` quando houver replay
- registram intervencoes manuais no estado da feature
- recalculam o proximo caminho recomendado

Use `looply status` para confirmar:

- `execution-mode`
- `replayed-from`
- `superseded-outputs`
- `recommended-recovery-command`
- ultimas intervencoes

## Referencia detalhada

- [Workflows](/reference/generated/workflows)
- [Slash Commands](/reference/generated/slash-commands)
- [Catalogo do Engineering Base](/guides/catalog)
