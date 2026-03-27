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

1. Revisar a tech spec, os diagramas associados e o problema estrutural que precisa de decisao explicita.
2. Registrar contexto, drivers arquiteturais, restricoes e assuncoes.
3. Enumerar opcoes consideradas com trade-offs e motivos de descarte.
4. Declarar decisao, escopo da decisao e impacto esperado em componentes, contratos, dados e operacao.
5. Explicar consequencias positivas, negativas, riscos aceitos e custos de manutencao.
6. Registrar implicacoes de rollout, rollback, observabilidade, compatibilidade e follow-ups.
7. Finalizar com tabela objetiva do que foi decidido, do que foi concluido e do que permanece pendente.

## Deliverables

- ADR rastreavel e acionavel
- opcoes consideradas e rejeitadas
- impacto em arquitetura, dados, contratos e operacao
- tabela final da etapa com itens concluidos e pendentes
