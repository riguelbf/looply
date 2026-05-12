---
schema: looply/task@v1
name: assess-problem-context
agent: problem-investigator
summary: Collect and validate available looply artifacts for the problem scope
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
  - problem-description
  - feature-name
  - scope-reference
context:
  - architecture-principles
outputs:
  - context-assessment-report
dependencies: []
---

# Task: assess-problem-context

## Objective

Coletar e validar todos os artefatos looply disponiveis para o escopo do problema, determinando se sao suficientes para diagnostico ou se o fallback de codebase sera necessario.

## Execution

Prioriza coleta rapida e validacao de frescor dos artefatos.

## Steps

1. Verificar existencia e frescor de `.looply/state/code-context.json` (grafo de modulos, simbolos, dependencias).
2. Verificar existencia e frescor de `.looply/state/knowledge-graph.json` (schema de banco, dependencias entre modulos).
3. Coletar `workflow-status.md` da feature se existir (stories ativas, specs, estado atual).
4. Validar status de cada artefato (`active`, `draft`, `stale`, `empty`) conforme `context-index.md`.
5. Se `code-context.json` ou `knowledge-graph.json` estiverem stale ou ausentes, sugerir `looply refresh-code-context`.
6. Determinar se o conjunto de artefatos e suficiente para prosseguir com `artifact-triage` ou se `codebase-investigation` sera necessario como fallback.
7. Registrar resultado em `context-assessment-report`.

## Deliverables

- context-assessment-report com status de cada artefato e decisao sobre necessidade de fallback
