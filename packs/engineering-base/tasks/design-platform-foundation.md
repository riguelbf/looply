---
schema: looply/task@v1
name: design-platform-foundation
agent: platform-engineer
summary: Define or evolve shared platform foundation, templates and engineering guardrails
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
  - requirement-brief
  - tech-spec
context:
  - architecture-principles
  - cloud-operating-model
outputs:
  - tech-spec
templates:
  - tech-spec-template
checklists:
  - definition-of-done
dependencies:
  - analyze-requirement
---

# Task: design-platform-foundation

## Objective

Definir foundation, templates e guardrails compartilhados para uso consistente pelos times de produto.

## Execution

Prioriza padronizacao, reaproveitamento, automacao e clareza de ownership.

## Steps

1. Confirmar o que deve virar baseline compartilhado e o que deve permanecer no workload.
2. Definir modulos de foundation, IaC base, networking, identidade, observabilidade e pipelines padrao.
3. Explicitar extensibilidade, guardrails e pontos de customizacao permitidos.
4. Validar impactos em governanca, operacao e custo.
5. Encerrar a etapa com tabela de concluidos e pendentes.

## Constraints

- nao transformar necessidade local de um unico time em baseline global sem evidencias
- nao depender de processo manual para seguir um guardrail critico

## Deliverables

- plano de foundation e guardrails
- ownership do baseline compartilhado
- tabela final da etapa com itens concluidos e pendentes
