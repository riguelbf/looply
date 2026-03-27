# create-cloud-architecture

Produce a cloud architecture specification for workload or platform decisions

## Ownership

- agent: `cloud-architect`

## Inputs

- `story`
- `prd`
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

- `create-tech-spec`

## Conteudo do artefato

# Task: create-cloud-architecture

## Objective

Produzir uma especificacao cloud clara para workload, plataforma ou topologia distribuida.

## Execution

Prioriza topologia, resiliencia, networking, mensageria, seguranca, custo e fronteiras operacionais.

## Steps

1. Identificar se a demanda e de workload, plataforma compartilhada ou guardrail transversal.
2. Delimitar ownership entre time de produto, plataforma, governanca e finops.
3. Modelar topologia cloud, runtime, dados, networking e observabilidade.
4. No baseline avancado, avaliar filas, eventos e async-first quando houver ganho real de resiliencia ou escala.
5. Explicitar trade-offs de custo, operacao, seguranca e acoplamento.
6. Produzir fechamento da etapa com tabela de concluidos e pendentes.

## Constraints

- nao mover responsabilidade de plataforma para workload sem justificativa
- nao introduzir assincronia sem estrategia de operacao e idempotencia

## Deliverables

- tech spec cloud
- fronteiras de ownership explicitas
- estrategia sincrona vs assincrona documentada
- tabela final da etapa com itens concluidos e pendentes

## Arquivo

- `packs/engineering-base/tasks/create-cloud-architecture.md`

[Voltar para tasks](../tasks)
