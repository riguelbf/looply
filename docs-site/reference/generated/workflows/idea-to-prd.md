# idea-to-prd

Discovery workflow from raw idea to approved PRD

## Metadados

- phase: `discovery`
- orchestrator: `delivery-orchestrator`
- alias principal: `/looply:idea-to-prd`

## Slash Command

- command: `/looply:idea-to-prd`
- argument hint: `<feature-name> [problem-statement] [constraints...]`
- hosts: `codex`, `claude`

### Argumentos

- `feature-name` required: short identifier for the feature or initiative
- `problem-statement` optional: user problem or desired business outcome
- `constraints` optional, variadic: optional constraints, dependencies or business notes

## Inputs

- `idea`

## Outputs

- `prd`

## Stages

### requirement-analysis

- task: `analyze-requirement`
- agent: `pm-analyst`
- inputs: `idea`
- outputs: `requirement-brief`

### prd-definition

- task: `create-prd`
- agent: `pm-analyst`
- depends_on: `requirement-analysis`
- inputs: `requirement-brief`
- outputs: `prd`

## Handoffs

- `pm-analyst` -> `pm-analyst` via `prd`

## Gates

- `discovery-ready` after `prd-definition` owner `pm-analyst`

## Conteudo do artefato

# Workflow: idea-to-prd

## Objective

Separar a fase de discovery e consolidar um PRD claro antes de iniciar delivery.

## Orchestrator

`delivery-orchestrator` cria ou atualiza o estado da feature, acompanha discovery e bloqueia a transicao sem PRD aprovado.

## Execution

Usar o minimo de contexto necessario para sair de ideia bruta para um PRD acionavel.

## Sequence

1. `requirement-analysis` by `pm-analyst`
2. `prd-definition` by `pm-analyst`

## Quality Gates

- `discovery-ready` bloqueia encerramento sem `requirement-brief` e `prd`

## Arquivo

- `packs/engineering-base/workflows/idea-to-prd.md`

[Voltar para workflows](../workflows)
