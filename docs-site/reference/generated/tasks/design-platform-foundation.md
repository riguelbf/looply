# design-platform-foundation

Define or evolve shared platform foundation, templates and engineering guardrails

## Ownership

- agent: `platform-engineer`

## Inputs

- `requirement-brief`
- `tech-spec`

## Context

- `architecture-principles`
- `cloud-operating-model`

## Outputs

- `tech-spec`

## Templates

- `tech-spec-template`

## Checklists

- `definition-of-done`

## Dependencies

- `analyze-requirement`

## Conteudo do artefato

# Task: design-platform-foundation

## Objective

Definir foundation, templates e guardrails compartilhados para uso consistente pelos times de produto.

## Execution

Prioriza padronizacao, reaproveitamento, automacao e clareza de ownership.

## Steps

1. Confirmar o que deve virar baseline compartilhado e o que deve permanecer no workload.
2. Definir modulos de foundation, IaC base, networking, identidade, observabilidade e pipelines padrao.
3. Explicitar extensibilidade, guardrails e pontos de customizacao permitidos.
4. Validar impactos em governanca, operacao e custo.
5. Encerrar a etapa com tabela de concluidos e pendentes.

## Constraints

- nao transformar necessidade local de um unico time em baseline global sem evidencias
- nao depender de processo manual para seguir um guardrail critico

## Deliverables

- plano de foundation e guardrails
- ownership do baseline compartilhado
- tabela final da etapa com itens concluidos e pendentes

## Arquivo

- `packs/engineering-base/tasks/design-platform-foundation.md`

[Voltar para tasks](../tasks)
