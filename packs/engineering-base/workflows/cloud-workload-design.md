---
schema: looply/workflow@v1
name: cloud-workload-design
summary: Define cloud topology, governance posture and cost direction for a workload or distributed service change
execution:
  profile: structured-analysis
  reasoning_effort: high
  context_budget: large
  latency_priority: medium
  preferred_hosts:
    - codex
    - claude
inputs:
  - feature
  - prd
  - tech-spec
phase: planning
orchestrator: delivery-orchestrator
stages:
  - name: cloud-topology
    task: create-cloud-architecture
    agent: cloud-architect
    inputs:
      - prd
      - tech-spec
    outputs:
      - tech-spec
  - name: cloud-decision
    task: create-cloud-adr
    agent: cloud-architect
    depends_on:
      - cloud-topology
    inputs:
      - tech-spec
    outputs:
      - adr
  - name: governance-review
    task: assess-cloud-governance
    agent: cloud-governance
    depends_on:
      - cloud-decision
    inputs:
      - tech-spec
      - adr
    outputs:
      - review-report
  - name: cost-review
    task: review-workload-cost
    agent: finops
    depends_on:
      - governance-review
    inputs:
      - tech-spec
      - adr
    outputs:
      - review-report
handoffs:
  - from: cloud-architect
    to: cloud-governance
    artifact: adr
  - from: cloud-governance
    to: finops
    artifact: review-report
gates:
  - name: topology-defined
    after_stage: cloud-decision
    owner: cloud-architect
    requires_outputs:
      - tech-spec
      - adr
    checklist: definition-of-done
    blocks_on_failure: true
  - name: governance-aligned
    after_stage: governance-review
    owner: cloud-governance
    requires_outputs:
      - review-report
    checklist: definition-of-done
    blocks_on_failure: true
  - name: cloud-ready-for-delivery
    after_stage: cost-review
    owner: finops
    requires_outputs:
      - review-report
    checklist: definition-of-done
    blocks_on_failure: true
command:
  name: cloud-workload-design
  description: Define cloud topology, governance controls and cost posture for a workload change
  argument_hint: <feature-name> <scope-reference> [constraints...]
  arguments:
    - name: feature-name
      description: short identifier for the workload or feature
      required: true
    - name: scope-reference
      description: workload, service or initiative being assessed
      required: true
    - name: constraints
      description: optional constraints, guardrails or non-functional concerns
      required: false
      variadic: true
outputs:
  - tech-spec
  - adr
  - review-report
tasks:
  - create-cloud-architecture
  - create-cloud-adr
  - assess-cloud-governance
  - review-workload-cost
---

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
