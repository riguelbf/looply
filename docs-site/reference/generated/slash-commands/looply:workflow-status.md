# /looply:workflow-status

Inspect or resume the current status of a looply feature workflow

## Uso

`/looply:workflow-status <feature-name> [session-label] [notes...]`

## Workflow associado

- workflow: [workflow-status](../workflows/workflow-status)
- fase: `status`
- orchestrator: `delivery-orchestrator`

## Hosts suportados

- `codex`
- `claude`

## Aliases

- `/looply:resume`
- `/looply:next`

## Argumentos

- `feature-name` required: short identifier of the feature being resumed
- `session-label` optional: optional label used to distinguish parallel sessions for the same project or feature
- `notes` optional variadic: optional notes about blockers, context switches or newly discovered artifacts

## Quando usar

- quando precisa retomar uma sessao, descobrir onde o trabalho parou ou ver o proximo passo
- quando ha varias sessoes abertas e voce precisa reconciliar a certa

## Outputs esperados

- `feature-workflow-state`
- `next-action`

## Exemplo

```text
/looply:workflow-status pix-webhook-retry backend-afternoon
```

[Voltar para slash commands](../slash-commands)
