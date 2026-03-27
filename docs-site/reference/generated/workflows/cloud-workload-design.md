# cloud-workload-design

Define cloud topology, governance posture and cost direction for a workload or distributed service change

## Metadados

- phase: `planning`
- orchestrator: `delivery-orchestrator`
- alias principal: `/looply:cloud-workload-design`

## Slash Command

- command: `/looply:cloud-workload-design`
- argument hint: `<feature-name> <scope-reference> [constraints...]`
- hosts: `codex`, `claude`

### Argumentos

- `feature-name` required: short identifier for the workload or feature
- `scope-reference` required: workload, service or initiative being assessed
- `constraints` optional, variadic: optional constraints, guardrails or non-functional concerns

## Inputs

- `feature`
- `prd`
- `tech-spec`

## Outputs

- `tech-spec`
- `adr`
- `review-report`

## Stages

### cloud-topology

- task: `create-cloud-architecture`
- agent: `cloud-architect`
- inputs: `prd`, `tech-spec`
- outputs: `tech-spec`

### cloud-decision

- task: `create-cloud-adr`
- agent: `cloud-architect`
- depends_on: `cloud-topology`
- inputs: `tech-spec`
- outputs: `adr`

### governance-review

- task: `assess-cloud-governance`
- agent: `cloud-governance`
- depends_on: `cloud-decision`
- inputs: `tech-spec`, `adr`
- outputs: `review-report`

### cost-review

- task: `review-workload-cost`
- agent: `finops`
- depends_on: `governance-review`
- inputs: `tech-spec`, `adr`
- outputs: `review-report`

## Handoffs

- `cloud-architect` -> `cloud-governance` via `adr`
- `cloud-governance` -> `finops` via `review-report`

## Gates

- `topology-defined` after `cloud-decision` owner `cloud-architect`
- `governance-aligned` after `governance-review` owner `cloud-governance`
- `cloud-ready-for-delivery` after `cost-review` owner `finops`

## Conteudo do artefato

# Workflow: cloud-workload-design

## Objective

Definir topologia cloud, trade-offs async-first, controles de governanca e postura de custo antes de um workload avancar.

## Orchestrator

`delivery-orchestrator` acompanha ownership, gates e o proximo especialista.

## Execution

Usar este workflow quando o problema principal for arquitetura cloud, distribuicao entre servicos, mensageria, governanca ou custo estrutural.

## Sequence

1. `cloud-topology` by `cloud-architect`
2. `cloud-decision` by `cloud-architect`
3. `governance-review` by `cloud-governance`
4. `cost-review` by `finops`

## Quality Gates

- `topology-defined` bloqueia avancar sem `tech-spec` e `adr`
- `governance-aligned` bloqueia encerramento sem revisão de controles obrigatorios
- `cloud-ready-for-delivery` bloqueia transicao sem postura de custo e ownership claros

## Arquivo

- `packs/engineering-base/workflows/cloud-workload-design.md`

[Voltar para workflows](../workflows)
