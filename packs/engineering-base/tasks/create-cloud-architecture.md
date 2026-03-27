---
schema: looply/task@v1
name: create-cloud-architecture
agent: cloud-architect
summary: Produce a cloud architecture specification for workload or platform decisions
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
  - create-tech-spec
---

# Task: create-cloud-architecture

## Objective

Produzir uma especificacao cloud clara para workload, plataforma ou topologia distribuida.

## Execution

Prioriza topologia, resiliencia, networking, mensageria, seguranca, custo e fronteiras operacionais.

## Steps

1. Identificar se a demanda e de workload, plataforma compartilhada ou guardrail transversal.
2. Delimitar ownership entre time de produto, plataforma, governanca e finops.
3. Modelar topologia cloud, runtime, dados, networking e observabilidade.
4. No baseline avancado, avaliar filas, eventos e async-first quando houver ganho real de resiliencia ou escala.
5. Explicitar trade-offs de custo, operacao, seguranca e acoplamento.
6. Produzir fechamento da etapa com tabela de concluidos e pendentes.

## Constraints

- nao mover responsabilidade de plataforma para workload sem justificativa
- nao introduzir assincronia sem estrategia de operacao e idempotencia

## Deliverables

- tech spec cloud
- fronteiras de ownership explicitas
- estrategia sincrona vs assincrona documentada
- tabela final da etapa com itens concluidos e pendentes
