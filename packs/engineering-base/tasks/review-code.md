---
schema: looply/task@v1
name: review-code
agent: reviewer
summary: Review the implementation against architecture and quality expectations
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
  - implementation-summary
  - tech-spec
context:
  - coding-standards
outputs:
  - review-report
templates:
  - review-report-template
checklists:
  - code-review-checklist
dependencies:
  - implement-api
---

# Task: review-code

## Objective

Revisar a mudanca implementada e validar se ela esta pronta para publicacao.

## Execution

Prioriza equilibrio entre custo e profundidade de revisao.

## Steps

1. Comparar implementacao com tech spec.
2. Validar testes e tratamento de erro.
3. Revisar aderencia arquitetural.
4. Emitir parecer com bloqueios ou aprovacao.
