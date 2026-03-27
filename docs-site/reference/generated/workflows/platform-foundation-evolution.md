# platform-foundation-evolution

Evolve shared platform foundations, guardrails and enablement assets with governance and cost validation

## Metadados

- phase: `planning`
- orchestrator: `delivery-orchestrator`
- alias principal: `/looply:platform-foundation-evolution`

## Slash Command

- command: `/looply:platform-foundation-evolution`
- argument hint: `<initiative-name> [constraints...]`
- hosts: `codex`, `claude`

### Argumentos

- `initiative-name` required: platform initiative, foundation slice or shared capability
- `constraints` optional, variadic: optional product constraints, platform guardrails or rollout notes

## Inputs

- `initiative`
- `requirement-brief`
- `tech-spec`

## Outputs

- `tech-spec`
- `review-report`

## Stages

### foundation-design

- task: `design-platform-foundation`
- agent: `platform-engineer`
- inputs: `requirement-brief`, `tech-spec`
- outputs: `tech-spec`

### governance-review

- task: `assess-cloud-governance`
- agent: `cloud-governance`
- depends_on: `foundation-design`
- inputs: `tech-spec`
- outputs: `review-report`

### cost-review

- task: `review-workload-cost`
- agent: `finops`
- depends_on: `governance-review`
- inputs: `tech-spec`
- outputs: `review-report`

## Handoffs

- `platform-engineer` -> `cloud-governance` via `tech-spec`
- `cloud-governance` -> `finops` via `review-report`

## Gates

- `foundation-defined` after `foundation-design` owner `platform-engineer`
- `governance-aligned` after `governance-review` owner `cloud-governance`
- `platform-change-ready` after `cost-review` owner `finops`

## Conteudo do artefato

# Workflow: platform-foundation-evolution

## Objective

Evoluir foundation compartilhada, templates e guardrails sem misturar necessidade local com baseline global.

## Orchestrator

`delivery-orchestrator` coordena ownership entre plataforma, governanca e custo antes da mudanca virar baseline compartilhado.

## Execution

Usar este workflow quando a demanda principal for foundation, guardrails, pipelines, identidade, observabilidade padrao ou templates de plataforma.

## Sequence

1. `foundation-design` by `platform-engineer`
2. `governance-review` by `cloud-governance`
3. `cost-review` by `finops`

## Quality Gates

- `foundation-defined` bloqueia encerramento sem baseline, ownership e pontos de extensao claros
- `governance-aligned` bloqueia avancar sem aderencia a politicas obrigatorias
- `platform-change-ready` bloqueia transicao sem impacto de custo e ownership claros

## Arquivo

- `packs/engineering-base/workflows/platform-foundation-evolution.md`

[Voltar para workflows](../workflows)
