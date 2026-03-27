# create-cloud-adr

Register a cloud architecture decision in ADR format

## Ownership

- agent: `cloud-architect`

## Inputs

- `tech-spec`

## Context

- `architecture-principles`
- `cloud-operating-model`

## Outputs

- `adr`

## Templates

- `adr-template`

## Checklists

- `definition-of-done`

## Dependencies

- `create-cloud-architecture`

## Conteudo do artefato

# Task: create-cloud-adr

## Objective

Registrar uma decisao arquitetural cloud de forma rastreavel, com foco em topologia, ownership, operacao, seguranca e custo.

## Execution

Prioriza trade-offs estruturais e clareza sobre impacto em workload, plataforma, governanca e finops.

## Steps

1. Revisar cloud tech spec, diagramas e o problema estrutural que exige decisao.
2. Registrar contexto, drivers arquiteturais, restricoes, assuncoes e ownership entre workload, plataforma e governanca.
3. Enumerar opcoes consideradas, incluindo alternativas sincronas e assincronas quando relevante.
4. Declarar a decisao e seu impacto em topologia, operacao, seguranca, custo e resiliencia.
5. Explicar consequencias positivas, negativas, riscos aceitos e follow-ups operacionais.
6. Finalizar com tabela objetiva do que foi decidido, concluido e pendente.

## Constraints

- nao decidir filas, eventos ou async-first sem explicitar ganho, operacao e idempotencia
- nao deslocar responsabilidade de plataforma, governanca ou custo sem justificar ownership

## Deliverables

- ADR cloud rastreavel e acionavel
- trade-offs de topologia, operacao, seguranca e custo
- ownership explicito entre times
- tabela final da etapa com itens concluidos e pendentes

## Arquivo

- `packs/engineering-base/tasks/create-cloud-adr.md`

[Voltar para tasks](../tasks)
