# /looply:prd-to-stories

Break an approved PRD into delivery-ready stories

## Uso

`/looply:prd-to-stories <feature-name> [prd-reference] [notes...]`

## Workflow associado

- workflow: [prd-to-stories](../workflows/prd-to-stories)
- fase: `planning`
- orchestrator: `pm-analyst`

## Hosts suportados

- `codex`
- `claude`

## Aliases

- Nenhum alias declarado.

## Argumentos

- `feature-name` required: short identifier for the feature being planned
- `prd-reference` optional: optional path or reference to the PRD artifact
- `notes` optional variadic: optional planning notes, sequencing or constraints

## Quando usar

- quando o PRD ja esta consolidado e voce quer quebrar em backlog acionavel
- quando discovery terminou e planning vai começar

## Outputs esperados

- `story-backlog`

## Exemplo

```text
/looply:prd-to-stories pix-webhook-retry prd-pix-webhook-retry
```

[Voltar para slash commands](../slash-commands)
