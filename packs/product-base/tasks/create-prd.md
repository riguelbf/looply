---
schema: looply/task@v1
name: create-prd
agent: pm-analyst
summary: Consolidate discovery into a PRD ready for delivery planning
execution:
  profile: structured-analysis
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
  - requirement-brief
context:
  - glossary
outputs:
  - prd
templates:
  - prd-template
checklists:
  - definition-of-done
dependencies:
  - analyze-requirement
---

# Task: create-prd

## Objective

Consolidar discovery em um PRD claro o suficiente para iniciar delivery planning.

## Execution

Priorizar clareza de negocio, escopo e criterios de sucesso sem antecipar desenho tecnico profundo.

## Steps

1. Revisar requirement brief e perguntas abertas.
2. Consolidar problema, objetivo e metricas de sucesso.
3. Delimitar escopo, nao escopo e regras de negocio.
4. Registrar dependencias, riscos e criterios para entrada em delivery.

## Deliverables

- PRD aprovado para planejamento
- riscos e dependencias
- criterio de entrada para stories
