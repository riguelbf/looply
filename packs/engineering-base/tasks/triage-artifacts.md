---
schema: looply/task@v1
name: triage-artifacts
agent: problem-investigator
summary: Analyze looply artifacts to narrow down root cause hypotheses
execution:
  profile: structured-analysis
  reasoning_effort: high
  context_budget: medium
  latency_priority: medium
  preferred_hosts:
    - codex
    - claude
  model_hint:
    provider: openai
    family: gpt-5
inputs:
  - context-assessment-report
context:
  - architecture-principles
outputs:
  - triage-findings
dependencies:
  - assess-problem-context
---

# Task: triage-artifacts

## Objective

Analisar os artefatos looply coletados para triangular evidencias e formular hipoteses de causa raiz, delimitando o escopo do problema a modulos ou componentes especificos.

## Execution

Prioriza analise estruturada com raciocinio profundo sobre os artefatos disponiveis.

## Steps

1. Cruzar o `problem-description` com as stories ativas da feature em `workflow-status.md`.
2. Consultar `code-context.json` para identificar modulos e simbolos no escopo do problema (`scope-reference`).
3. Consultar `knowledge-graph.json` para verificar schema de banco e dependencias entre modulos afetados.
4. Verificar specs e PRDs associados a feature para entender o comportamento esperado vs observado.
5. Formular hipoteses de causa raiz com base nas evidencias dos artefatos.
6. Para cada hipotese, listar evidencias corroborativas e contraditorias.
7. Se nenhuma hipotese tiver confianca suficiente, sinalizar necessidade de `codebase-investigation`.
8. Registrar hipoteses e nivel de confianca em `triage-findings`.

## Deliverables

- triage-findings com hipoteses de causa raiz, evidencias e nivel de confianca
- decisao explicita sobre necessidade de fallback para `codebase-investigation`
