---
schema: looply/task@v1
name: create-tech-spec
agent: architect
summary: Produce a technical specification from an approved story and PRD context
execution:
  profile: structured-analysis
  reasoning_effort: high
  context_budget: large
  latency_priority: medium
  preferred_hosts:
    - codex
    - claude
  model_hint:
    provider: openai
    family: gpt-5
inputs:
  - story
  - prd
context:
  - architecture-principles
outputs:
  - tech-spec
templates:
  - tech-spec-template
checklists:
  - definition-of-done
dependencies:
  - break-prd-into-stories
---

# Task: create-tech-spec

## Objective

Produzir uma especificacao tecnica clara, implementavel e revisavel a partir de uma story aprovada.

## Execution

Usar mais contexto e maior profundidade de raciocinio.

## Steps

1. Revisar PRD e story selecionada.
2. Definir arquitetura e trade-offs para o recorte da story.
3. Modelar componentes e contratos.
4. Identificar riscos, observabilidade e dependencias tecnicas.

## Deliverables

- tech spec
- riscos
- decisoes tecnicas principais
