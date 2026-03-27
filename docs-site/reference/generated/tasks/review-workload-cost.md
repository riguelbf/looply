# review-workload-cost

Review workload and platform cost posture, allocation and optimization opportunities

## Ownership

- agent: `finops`

## Inputs

- `tech-spec`
- `release-plan`
- `operability-report`

## Context

- `cloud-operating-model`

## Outputs

- `review-report`

## Templates

- `review-report-template`

## Checklists

- `definition-of-done`

## Dependencies

- `create-cloud-architecture`

## Conteudo do artefato

# Task: review-workload-cost

## Objective

Avaliar visibilidade, ownership e oportunidades de otimizacao de custo para workload ou baseline compartilhado.

## Execution

Prioriza atribuicao de custo, previsibilidade e otimizacao pragmatica.

## Steps

1. Separar custo de workload e custo de plataforma compartilhada.
2. Validar tagging, ownership, rateio, budget e previsibilidade.
3. Identificar quick wins e alavancas estruturais de otimizacao.
4. Explicitar trade-offs com confiabilidade, seguranca e produto.
5. Encerrar a etapa com tabela de concluidos e pendentes.

## Constraints

- nao recomendar economia que degrade requisitos essenciais sem trade-off aprovado
- nao tratar custo sem ownership claro

## Deliverables

- review report de custo
- ownership e alavancas de otimizacao explicitas
- tabela final da etapa com itens concluidos e pendentes

## Arquivo

- `packs/engineering-base/tasks/review-workload-cost.md`

[Voltar para tasks](../tasks)
