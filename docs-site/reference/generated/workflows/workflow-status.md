# workflow-status

Resume or inspect the current status of a feature workflow

## Metadados

- phase: `status`
- orchestrator: `delivery-orchestrator`
- alias principal: `/looply:workflow-status`
- aliases: `/looply:resume`, `/looply:next`

## Slash Command

- command: `/looply:workflow-status`
- argument hint: `<feature-name> [session-label] [notes...]`
- hosts: `codex`, `claude`
- aliases: `/looply:resume`, `/looply:next`

### Argumentos

- `feature-name` required: short identifier of the feature being resumed
- `session-label` optional: optional label used to distinguish parallel sessions for the same project or feature
- `notes` optional, variadic: optional notes about blockers, context switches or newly discovered artifacts

## Inputs

- `feature-name`
- `feature-workflow-state`

## Outputs

- `feature-workflow-state`
- `next-action`

## Stages

### status-reconciliation

- task: `report-workflow-status`
- agent: `delivery-orchestrator`
- inputs: `feature-name`, `feature-workflow-state`
- outputs: `feature-workflow-state`, `next-action`

## Handoffs

- `delivery-orchestrator` -> `delivery-orchestrator` via `next-action`

## Gates

- `status-recorded` after `status-reconciliation` owner `delivery-orchestrator`

## Conteudo do artefato

# Workflow: workflow-status

## Objective

Retomar a entrega de uma feature sem depender de contexto implícito da conversa anterior.

## Orchestrator

`delivery-orchestrator` reconcilia o estado salvo, os outputs existentes e o proximo passo.

## Execution

Usar o estado persistido da feature como fonte rapida de retomada. Quando houver sessoes paralelas, usar `session-label` e o registro em `.looply/custom/session-links.json` para conectar a sessao atual ao trabalho certo.

## Sequence

1. `status-reconciliation` by `delivery-orchestrator`

## Quality Gates

- `status-recorded` bloqueia encerramento sem `feature-workflow-state` e `next-action`

## Arquivo

- `packs/engineering-base/workflows/workflow-status.md`

[Voltar para workflows](../workflows)
