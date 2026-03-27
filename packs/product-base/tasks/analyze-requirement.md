---
schema: looply/task@v1
name: analyze-requirement
agent: pm-analyst
summary: Transform an idea into a clear requirement brief
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
  - idea
context:
  - glossary
outputs:
  - requirement-brief
templates:
  - requirement-brief-template
checklists:
  - definition-of-done
dependencies: []
---

# Task: analyze-requirement

## Objective

Transformar uma ideia inicial em um briefing claro de negocio para arquitetura.

## Execution

Usar analise estruturada sem desperdiçar contexto.

## Steps

1. Identificar problema do usuario e objetivo de negocio.
2. Identificar se o trabalho e para projeto novo ou para projeto existente.
3. Perguntar se o baseline esperado e basico ou com boas praticas completas.
4. Levantar stack backend ou frontend, banco, autenticacao inicial e restricoes operacionais ja definidas.
5. Delimitar escopo e nao escopo.
6. Levantar ambiguidade, restricoes e dependencias.
7. Registrar riscos e perguntas abertas.

## Deliverables

- briefing de requisito
- objetivo de negocio
- perguntas abertas
- baseline inicial de stack e arquitetura
