---
schema: looply/task@v1
name: create-adr
agent: architect
summary: Register a technical decision in ADR format
execution:
  profile: structured-analysis
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
  - tech-spec
context:
  - architecture-principles
outputs:
  - adr
templates:
  - adr-template
checklists:
  - definition-of-done
dependencies:
  - create-tech-spec
---

# Task: create-adr

## Objective

Registrar a decisao arquitetural de forma rastreavel.

## Execution

Prioriza saida estruturada e objetiva.

## Steps

1. Definir contexto.
2. Registrar opcoes consideradas.
3. Declarar decisao.
4. Explicar consequencias.
