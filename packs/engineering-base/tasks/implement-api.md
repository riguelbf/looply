---
schema: looply/task@v1
name: implement-api
agent: backend
summary: Describe how the backend agent should implement the approved API change
execution:
  profile: implementation
  reasoning_effort: high
  context_budget: large
  latency_priority: medium
  preferred_hosts:
    - codex
  model_hint:
    provider: openai
    family: gpt-5
inputs:
  - tech-spec
  - adr
context:
  - coding-standards
  - architecture-principles
outputs:
  - code-change
  - implementation-summary
templates:
  - implementation-summary-template
checklists:
  - code-review-checklist
dependencies:
  - create-tech-spec
---

# Task: implement-api

## Objective

Descrever claramente como o agente backend deve implementar a mudanca aprovada.

## Execution

Reservar budget maior de contexto para evitar perda de requisitos.

## Steps

1. Revisar tech spec e ADR.
2. Mapear modulo existente.
3. Implementar mudanca respeitando fronteiras do repositorio.
4. Atualizar testes e documentacao.
5. Produzir resumo de implementacao para review.

## Constraints

- nao inventar regra de negocio
- escalar gaps estruturais para architect
