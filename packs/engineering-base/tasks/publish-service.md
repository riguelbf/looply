---
schema: looply/task@v1
name: publish-service
agent: reviewer
summary: Prepare and describe the publication path for an approved change
execution:
  profile: publishing
  reasoning_effort: low
  context_budget: small
  latency_priority: low
  preferred_hosts:
    - codex
    - claude
  model_hint:
    provider: openai
    family: gpt-5
inputs:
  - review-report
context:
  - coding-standards
outputs:
  - release-plan
templates:
  - release-plan-template
checklists:
  - definition-of-done
dependencies:
  - review-code
---

# Task: publish-service

## Objective

Descrever como a mudanca aprovada deve seguir para publicacao.

## Execution

Usar perfil mais barato e objetivo para preparacao de release.

## Steps

1. Confirmar aprovacoes.
2. Registrar pre-condicoes de release.
3. Definir ordem de publicacao.
4. Documentar rollback e verificacoes pos-publicacao.
