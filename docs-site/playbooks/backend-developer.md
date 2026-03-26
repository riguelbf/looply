# Playbook: Backend Developer

Este playbook cobre a fase de implementacao no codebase.

## Quando voce entra

- existe uma story selecionada
- `tech-spec` e `ADR` ja estao disponiveis
- o gate de design ja pode liberar implementacao

## Workflow principal

- `story-to-production`

## Seu foco

- implementar a story no codebase
- atualizar artefatos tecnicos da entrega
- preparar o handoff para review

## Outputs esperados

- `implementation-summary`
- alteracoes de codigo coerentes com o design

## Task central

- [implement-api](/reference/generated/tasks/implement-api)

## O que olhar

- [Backend](/reference/generated/agents/backend)
- [story-to-production](/reference/generated/workflows/story-to-production)
- [coding-standards](/reference/generated/knowledge/coding-standards)
- [implementation-summary-template](/reference/generated/templates/implementation-summary-template)
- [code-review-checklist](/reference/generated/checklists/code-review-checklist)

## Como saber se concluiu

- a story foi implementada
- codigo segue os standards do projeto
- riscos e limites da implementacao foram documentados
- existe contexto suficiente para o reviewer

## Retomada

Se perder contexto:

```text
/looply:workflow-status <feature-name>
/looply:resume <feature-name> <session-label>
```
