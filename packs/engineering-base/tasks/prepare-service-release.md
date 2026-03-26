---
schema: looply/task@v1
name: prepare-service-release
agent: devops
summary: Prepare the service release path from an approved technical review
execution:
  profile: publishing
  reasoning_effort: medium
  context_budget: medium
  latency_priority: low
  preferred_hosts:
    - codex
    - claude
  model_hint:
    provider: openai
    family: gpt-5
inputs:
  - review-report
  - implementation-summary
context:
  - architecture-principles
outputs:
  - release-plan
templates:
  - release-plan-template
checklists:
  - definition-of-done
dependencies:
  - review-code
---

# Task: prepare-service-release

## Objective

Preparar o plano de publicacao da mudanca aprovada, com pre-condicoes, rollout, verificacoes e rollback.

## Execution

Prioriza clareza operacional e sequencia segura de release.

## Steps

1. Revisar review report e resumo de implementacao.
2. Consolidar pre-condicoes de release.
3. Definir rollout, verificacao e rollback.
4. Preparar handoff para avaliacao de operabilidade.

## Deliverables

- release plan acionavel
- sequencia de publicacao
- verificacoes pos-release
- rollback explicito
