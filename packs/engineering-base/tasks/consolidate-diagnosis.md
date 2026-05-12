---
schema: looply/task@v1
name: consolidate-diagnosis
agent: problem-investigator
summary: Consolidate findings into a structured diagnosis report with evidence and recommendations
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
  - triage-findings
  - investigation-findings
context:
  - architecture-principles
outputs:
  - diagnosis-report
dependencies:
  - triage-artifacts
  - investigate-codebase
---

# Task: consolidate-diagnosis

## Objective

Consolidar todos os achados (de artefatos e/ou codebase) em um relatorio de diagnostico estruturado, com evidencias, severidade, modulos afetados e recomendacoes acionaveis.

## Execution

Prioriza sintese clara e acionavel. Nivel medio de raciocinio e contexto.

## Steps

1. Consolidar evidencias do `triage-findings` (artefatos) e `investigation-findings` (codebase, se executado).
2. Determinar a causa raiz com maior confianca baseada nas evidencias disponiveis.
3. Descartar hipoteses alternativas com justificativa explicita.
4. Classificar severidade do problema (critical, high, medium, low).
5. Listar modulos, arquivos e entidades de banco afetados.
6. Estimar impacto (usuarios afetados, funcionalidades degradadas, dados em risco).
7. Recomendar proximo passo acionavel:
   - Se causa raiz mapeia para feature existente: sugerir `$looply-story-to-production`
   - Se causa raiz e um novo problema: sugerir `$looply-idea-to-prd`
   - Se correcao e trivial e direta: sugerir implementacao imediata
8. Registrar tudo em `diagnosis-report`.

## Deliverables

- diagnosis-report com: causa raiz, evidencias, severidade, modulos afetados, impacto e recomendacao de proximo passo
