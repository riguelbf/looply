---
schema: looply/task@v1
name: orchestrate-delivery
agent: delivery-orchestrator
summary: Coordinate the current workflow stage, gate status and next handoff
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
  - workflow-command
  - workflow-playbook
  - existing-artifacts
context:
  - glossary
  - architecture-principles
outputs:
  - feature-workflow-state
  - orchestration-status
  - next-action
templates:
  - workflow-status-template
  - workflow-decision-template
checklists:
  - definition-of-done
dependencies: []
---

# Task: orchestrate-delivery

## Objective

Coordenar a jornada ponta a ponta, decidir a fase atual, o gate atual e explicitar o proximo workflow e handoff.

## Execution

Usar o minimo de contexto necessario para ler workflow, status atual e outputs existentes.

## Inputs

- alias do workflow e argumentos recebidos
- workflow playbook publicado
- artefatos ja produzidos para a feature
- estado existente em `.looply/custom/features/<feature-name>/workflow-status.md`, quando existir
- configuracoes da instalacao em `.looply/state/project-context.json` e `.looply/state/interaction-policy.json`, quando existirem
- indice de contexto em `.looply/state/context-index.md` e contexto de projeto em `.looply/custom/project-context.md`, quando existirem

## Steps

1. Normalizar argumentos em feature, problema e restricoes.
2. Criar ou atualizar `.looply/custom/features/<feature-name>/workflow-status.md`.
3. Localizar o workflow e seu orquestrador.
4. Verificar quais outputs ja existem por stage.
5. Avaliar gates bloqueantes antes do proximo avancar.
6. Selecionar o proximo workflow, stage e agente responsavel.
7. Atualizar o estado com metrica de sucesso, artefato ativo, story selecionada quando houver, gate atual, workflow recomendado e rationale de decisao.
8. Preencher apenas o bloco de fase relevante entre `Discovery Focus`, `Planning Focus` e `Delivery Focus`.
9. Refletir no estado o `Project Context` e a `Interaction Policy` atuais da instalacao, incluindo `Context Status`, `Context Coverage` e `Context Validation Notes`.
10. Em `existing-project`, validar decisoes relevantes contra o codebase real se o contexto estiver vazio, draft, stale ou inconsistente.
11. Emitir um status curto e acionavel.

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

Regras visuais:

- abrir a resposta com uma tabela Markdown de duas colunas `Field | Value`
- na tabela, incluir no minimo `Feature`, `Host`, `Phase`, `Workflow`, `Current Stage`, `Current Gate`, `Active Artifact`, `Next Workflow`, `Next Agent`, `Next Task`, `Next Command` e `Ready For Next Gate`
- identificar explicitamente o host atual antes de sugerir o proximo comando
- usar comando host-aware: `/$alias` para Claude Code e `$looply-...` para Codex
- destacar nome de workflow, stage e task em negrito dentro das secoes
- manter uma linha em branco entre secoes
- nao usar emojis
- preferir frases curtas e acionaveis

## Constraints

- nao executar a task especializada no lugar do agente dono
- nao pular gates com `blocks_on_failure: true`
- nao declarar conclusao sem output exigido

## Deliverables

- status do workflow
- estado persistido da feature
- workflow recomendado
- story selecionada quando aplicavel
- readiness para o proximo gate
- gate atual
- proximo agente
- proxima task
- bloqueios ativos
- artefatos faltantes

## Escalation

- se faltar clareza de problema, redirecionar para `pm-analyst`
- se faltar desenho tecnico, redirecionar para `architect`
- se a implementacao estiver bloqueada, redirecionar para `backend`
- se o gate final falhar, redirecionar para `reviewer`
