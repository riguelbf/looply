---
schema: looply/task@v1
name: report-workflow-status
agent: delivery-orchestrator
summary: Reconcile workflow progress and update the persisted feature status
execution:
  profile: structured-analysis
  reasoning_effort: medium
  context_budget: medium
  latency_priority: high
  preferred_hosts:
    - codex
    - claude
  model_hint:
    provider: openai
    family: gpt-5
inputs:
  - feature-name
  - workflow-playbook
  - persisted-state
  - known-artifacts
context:
  - glossary
outputs:
  - feature-workflow-state
  - next-action
templates:
  - workflow-status-template
  - workflow-decision-template
checklists:
  - definition-of-done
dependencies:
  - orchestrate-delivery
---

# Task: report-workflow-status

## Objective

Retomar ou inspecionar uma feature em andamento sem reler todo o fluxo manualmente.

## Execution

Usar contexto pequeno e foco em reconciliar estado persistido, outputs produzidos e proximo passo.

## Steps

1. Abrir `.looply/custom/features/<feature-name>/workflow-status.md` se existir.
2. Comparar o estado salvo com os outputs exigidos pelo workflow.
3. Confirmar a fase atual, a story selecionada, o gate atual e o proximo stage elegivel.
4. Decidir o proximo workflow recomendado para a feature.
5. Atualizar o arquivo de estado com readiness de gate, bloqueios, criterio de aceite da story e rationale.
6. Refletir no estado o `Project Context` e a `Interaction Policy` atuais da instalacao, incluindo `Context Status`, `Context Coverage` e `Context Validation Notes`.
7. Em `existing-project`, validar decisoes relevantes contra o codebase real se o contexto estiver vazio, draft, stale ou inconsistente.
8. Preencher apenas o bloco de fase relevante entre `Discovery Focus`, `Planning Focus` e `Delivery Focus`.
9. Emitir um resumo curto com o proximo agente e a proxima task.

## Response Format

Responder na conversa usando estes titulos em Markdown, nesta ordem:

1. `# Workflow Update`
2. `## Workflow`
3. `## Stage`
4. `## Current Task`
5. `## Gate`
6. `## Active Artifact`
7. `## Decision`
8. `## Next Step`
9. `## Missing Artifacts`
10. `## Blockers`

Regras visuais:

- destacar nome de workflow, stage e task em negrito dentro das secoes
- manter uma linha em branco entre secoes
- nao usar emojis
- preferir frases curtas e acionaveis

## Deliverables

- arquivo de estado atualizado
- resumo do progresso atual
- workflow recomendado para continuar
- bloqueios ativos e readiness do proximo gate
- proxima acao recomendada
