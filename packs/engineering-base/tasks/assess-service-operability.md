---
schema: looply/task@v1
name: assess-service-operability
agent: sre
summary: Assess service operability and production readiness before release
execution:
  profile: review
  reasoning_effort: medium
  context_budget: medium
  latency_priority: medium
  preferred_hosts:
    - codex
    - claude
  model_hint:
    provider: openai
    family: gpt-5
inputs:
  - release-plan
  - implementation-summary
context:
  - architecture-principles
outputs:
  - operability-report
templates:
  - operability-report-template
checklists:
  - definition-of-done
dependencies:
  - prepare-service-release
---

# Task: assess-service-operability

## Objective

Avaliar readiness operacional da mudanca antes de liberar o gate final de release.

## Execution

Prioriza risco operacional, observabilidade, verificacao e rollback.

## Steps

1. Revisar release plan e resumo de implementacao.
2. Validar sinais minimos de monitoracao e verificacao.
3. Avaliar risco operacional residual.
4. Emitir parecer de readiness ou bloqueio.
5. Registrar contrato explicito de handoff final ou de retorno.

## Deliverables

- operability report
- riscos operacionais
- status de release readiness
- handoff contract com receiver, readiness, blockers, next command e artefatos exigidos
- tabela final da etapa com itens concluidos e pendentes
