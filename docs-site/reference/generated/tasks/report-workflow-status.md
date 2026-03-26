# report-workflow-status

Reconcile workflow progress and update the persisted feature status

## Ownership

- agent: `delivery-orchestrator`

## Inputs

- `feature-name`
- `workflow-playbook`
- `persisted-state`
- `known-artifacts`

## Context

- `glossary`

## Outputs

- `feature-workflow-state`
- `next-action`

## Templates

- `workflow-status-template`
- `workflow-decision-template`

## Checklists

- `definition-of-done`

## Dependencies

- `orchestrate-delivery`

## Conteudo do artefato

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
2. `## Summary Table`
3. `## Workflow`
4. `## Stage`
5. `## Current Task`
6. `## Gate`
7. `## Active Artifact`
8. `## Decision`
9. `## Next Step`
10. `## Missing Artifacts`
11. `## Blockers`

Regras visuais:

- abrir a resposta com uma tabela Markdown de duas colunas `Field | Value`
- na tabela, incluir no minimo `Feature`, `Phase`, `Workflow`, `Current Stage`, `Current Gate`, `Active Artifact`, `Next Workflow`, `Next Agent`, `Next Task` e `Ready For Next Gate`
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

## Arquivo

- `packs/engineering-base/tasks/report-workflow-status.md`

[Voltar para tasks](../tasks)
