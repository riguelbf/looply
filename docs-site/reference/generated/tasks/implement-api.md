# implement-api

Describe how the backend agent should implement the approved API change

## Ownership

- agent: `backend`

## Inputs

- `tech-spec`
- `adr`

## Context

- `coding-standards`
- `architecture-principles`

## Outputs

- `code-change`
- `implementation-summary`

## Templates

- `implementation-summary-template`

## Checklists

- `code-review-checklist`

## Dependencies

- `create-tech-spec`

## Conteudo do artefato

# Task: implement-api

## Objective

Descrever claramente como o agente backend deve implementar a mudanca aprovada.

## Execution

Reservar budget maior de contexto para evitar perda de requisitos.

## Steps

1. Revisar tech spec e ADR.
2. Mapear modulo existente.
3. Implementar mudanca respeitando fronteiras do repositorio.
4. Atualizar testes e documentacao.
5. Produzir resumo de implementacao para review.

## Constraints

- nao inventar regra de negocio
- escalar gaps estruturais para architect

## Arquivo

- `packs/engineering-base/tasks/implement-api.md`

[Voltar para tasks](../tasks)
