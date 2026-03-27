---
schema: looply/task@v1
name: review-workload-cost
agent: finops
summary: Review workload and platform cost posture, allocation and optimization opportunities
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
  - tech-spec
  - release-plan
  - operability-report
context:
  - cloud-operating-model
outputs:
  - review-report
templates:
  - review-report-template
checklists:
  - definition-of-done
dependencies:
  - create-cloud-architecture
---

# Task: review-workload-cost

## Objective

Avaliar visibilidade, ownership e oportunidades de otimizacao de custo para workload ou baseline compartilhado.

## Execution

Prioriza atribuicao de custo, previsibilidade e otimizacao pragmatica.

## Steps

1. Separar custo de workload e custo de plataforma compartilhada.
2. Validar tagging, ownership, rateio, budget e previsibilidade.
3. Identificar quick wins e alavancas estruturais de otimizacao.
4. Explicitar trade-offs com confiabilidade, seguranca e produto.
5. Encerrar a etapa com tabela de concluidos e pendentes.

## Constraints

- nao recomendar economia que degrade requisitos essenciais sem trade-off aprovado
- nao tratar custo sem ownership claro

## Deliverables

- review report de custo
- ownership e alavancas de otimizacao explicitas
- tabela final da etapa com itens concluidos e pendentes
