---
schema: looply/workflow@v1
name: platform-foundation-evolution
summary: Evolve shared platform foundations, guardrails and enablement assets with governance and cost validation
execution:
  profile: structured-analysis
  reasoning_effort: high
  context_budget: large
  latency_priority: medium
  preferred_hosts:
    - codex
    - claude
inputs:
  - initiative
  - requirement-brief
  - tech-spec
phase: planning
orchestrator: delivery-orchestrator
stages:
  - name: foundation-design
    task: design-platform-foundation
    agent: platform-engineer
    inputs:
      - requirement-brief
      - tech-spec
    outputs:
      - tech-spec
  - name: governance-review
    task: assess-cloud-governance
    agent: cloud-governance
    depends_on:
      - foundation-design
    inputs:
      - tech-spec
    outputs:
      - review-report
  - name: cost-review
    task: review-workload-cost
    agent: finops
    depends_on:
      - governance-review
    inputs:
      - tech-spec
    outputs:
      - review-report
handoffs:
  - from: platform-engineer
    to: cloud-governance
    artifact: tech-spec
  - from: cloud-governance
    to: finops
    artifact: review-report
gates:
  - name: foundation-defined
    after_stage: foundation-design
    owner: platform-engineer
    requires_outputs:
      - tech-spec
    checklist: definition-of-done
    blocks_on_failure: true
  - name: governance-aligned
    after_stage: governance-review
    owner: cloud-governance
    requires_outputs:
      - review-report
    checklist: definition-of-done
    blocks_on_failure: true
  - name: platform-change-ready
    after_stage: cost-review
    owner: finops
    requires_outputs:
      - review-report
    checklist: definition-of-done
    blocks_on_failure: true
command:
  name: platform-foundation-evolution
  description: Evolve shared platform foundation with guardrails, governance and cost review
  argument_hint: <initiative-name> [constraints...]
  arguments:
    - name: initiative-name
      description: platform initiative, foundation slice or shared capability
      required: true
    - name: constraints
      description: optional product constraints, platform guardrails or rollout notes
      required: false
      variadic: true
outputs:
  - tech-spec
  - review-report
tasks:
  - design-platform-foundation
  - assess-cloud-governance
  - review-workload-cost
---

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
