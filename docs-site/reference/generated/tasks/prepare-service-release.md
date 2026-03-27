# prepare-service-release

Prepare the service release path from an approved technical review

## Ownership

- agent: `devops`

## Inputs

- `review-report`
- `implementation-summary`

## Context

- `architecture-principles`

## Outputs

- `release-plan`

## Templates

- `release-plan-template`

## Checklists

- `definition-of-done`

## Dependencies

- `review-code`

## Conteudo do artefato

# Task: prepare-service-release

## Objective

Preparar o plano de publicacao da mudanca aprovada, com pre-condicoes, rollout, verificacoes e rollback.

## Execution

Prioriza clareza operacional e sequencia segura de release.

## Steps

1. Revisar review report e resumo de implementacao.
2. Consolidar pre-condicoes de release.
3. Definir rollout, verificacao e rollback.
4. Preparar handoff para avaliacao de operabilidade.

## Deliverables

- release plan acionavel
- sequencia de publicacao
- verificacoes pos-release
- rollback explicito
- tabela final da etapa com itens concluidos e pendentes

## Arquivo

- `packs/engineering-base/tasks/prepare-service-release.md`

[Voltar para tasks](../tasks)
