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
10. Finalizar com tabela objetiva separando o que foi concluido e o que segue pendente.

## Response Format

Responder na conversa usando estes titulos em Markdown, nesta ordem:

1. `# Workflow Update`
2. `## Summary Table`
3. `## Workflow`
4. `## Stage`
5. `## Current Task`
6. `## Gate`
7. `## Active Artifact`
8. `## Decision`
9. `## Next Step`
10. `## Host`
11. `## Next Command`
12. `## Missing Artifacts`
13. `## Blockers`
14. `## Completion Table`

Regras visuais:

- abrir a resposta com uma tabela Markdown de duas colunas `Field | Value`
- na tabela, incluir no minimo `Feature`, `Host`, `Phase`, `Workflow`, `Current Stage`, `Current Gate`, `Active Artifact`, `Next Workflow`, `Next Agent`, `Next Task`, `Next Command` e `Ready For Next Gate`
- identificar explicitamente o host atual antes de sugerir o proximo comando
- usar comando host-aware: `/$alias` para Claude Code e `$looply-...` para Codex
- encerrar a resposta com uma tabela Markdown contendo pelo menos `Item`, `Status` e `Notes`, usando `Done` e `Pending` como valores de status
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
