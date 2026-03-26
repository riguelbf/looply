# /looply:story-to-production

Execute delivery for a single approved story until release planning

## Uso

`/looply:story-to-production <feature-name> <story-reference> [constraints...]`

## Workflow associado

- workflow: [story-to-production](../workflows/story-to-production)
- fase: `delivery`
- orchestrator: `delivery-orchestrator`

## Hosts suportados

- `codex`
- `claude`

## Aliases

- Nenhum alias declarado.

## Argumentos

- `feature-name` required: short identifier for the feature in delivery
- `story-reference` required: story to be delivered in this cycle
- `constraints` optional variadic: optional delivery notes, blockers or implementation constraints

## Quando usar

- quando uma story ja foi selecionada e voce quer avancar em design tecnico, implementacao e release
- quando planning ja gerou backlog e a feature entrou em delivery

## Outputs esperados

- `release-plan`
- `operability-report`

## Exemplo

```text
/looply:story-to-production pix-webhook-retry story-01-retry-automatico
```

[Voltar para slash commands](../slash-commands)
