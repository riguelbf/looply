---
schema: looply/task@v1
name: break-prd-into-stories
agent: pm-analyst
summary: Decompose an approved PRD into delivery-ready stories
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
  - prd
context:
  - glossary
outputs:
  - story-backlog
templates:
  - story-backlog-template
  - story-template
checklists:
  - definition-of-done
dependencies:
  - create-prd
---

# Task: break-prd-into-stories

## Objective

Quebrar um PRD aprovado em stories pequenas, independentes e prontas para delivery.

## Execution

Usar recortes incrementais e orientados a valor, evitando stories grandes demais.

## Steps

1. Revisar escopo, nao escopo e criterios de sucesso do PRD.
2. Separar fluxos principais e fluxos de excecao.
3. Criar stories pequenas com objetivo, criterio de aceite e dependencias.
4. Ordenar backlog sugerido para execucao.

## Deliverables

- story backlog
- stories com criterios de aceite
- dependencias explicitas entre stories
