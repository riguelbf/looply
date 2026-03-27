# prd-to-stories

Delivery planning workflow from approved PRD to story backlog

## Metadados

- phase: `planning`
- orchestrator: `pm-analyst`
- alias principal: `/looply:prd-to-stories`

## Slash Command

- command: `/looply:prd-to-stories`
- argument hint: `<feature-name> [prd-reference] [notes...]`
- hosts: `codex`, `claude`

### Argumentos

- `feature-name` required: short identifier for the feature being planned
- `prd-reference` optional: optional path or reference to the PRD artifact
- `notes` optional, variadic: optional planning notes, sequencing or constraints

## Inputs

- `prd`

## Outputs

- `story-backlog`

## Stages

### story-planning

- task: `break-prd-into-stories`
- agent: `pm-analyst`
- inputs: `prd`
- outputs: `story-backlog`

## Handoffs

- `pm-analyst` -> `pm-analyst` via `story-backlog`

## Gates

- `planning-ready` after `story-planning` owner `pm-analyst`

## Conteudo do artefato

# Workflow: prd-to-stories

## Objective

Transformar um PRD aprovado em backlog de stories pequenas e prontas para delivery.

## Orchestrator

`pm-analyst` conduz o planejamento e fecha o gate de planning-ready.

## Execution

Usar recortes incrementais para evitar stories grandes demais e sem criterio de aceite.

## Sequence

1. `story-planning` by `pm-analyst`

## Quality Gates

- `planning-ready` bloqueia encerramento sem `story-backlog`

## Arquivo

- `packs/product-base/workflows/prd-to-stories.md`

[Voltar para workflows](../workflows)
