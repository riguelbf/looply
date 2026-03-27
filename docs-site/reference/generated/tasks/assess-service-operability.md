# assess-service-operability

Assess service operability and production readiness before release

## Ownership

- agent: `sre`

## Inputs

- `release-plan`
- `implementation-summary`

## Context

- `architecture-principles`

## Outputs

- `operability-report`

## Templates

- `operability-report-template`

## Checklists

- `definition-of-done`

## Dependencies

- `prepare-service-release`

## Conteudo do artefato

# Task: assess-service-operability

## Objective

Avaliar readiness operacional da mudanca antes de liberar o gate final de release.

## Execution

Prioriza risco operacional, observabilidade, verificacao e rollback.

## Steps

1. Revisar release plan e resumo de implementacao.
2. Validar sinais minimos de monitoracao e verificacao.
3. Avaliar risco operacional residual.
4. Emitir parecer de readiness ou bloqueio.

## Deliverables

- operability report
- riscos operacionais
- status de release readiness
- tabela final da etapa com itens concluidos e pendentes

## Arquivo

- `packs/engineering-base/tasks/assess-service-operability.md`

[Voltar para tasks](../tasks)
