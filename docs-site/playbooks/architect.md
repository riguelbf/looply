# Playbook: Architect

Este playbook cobre o inicio do delivery quando a story ja foi selecionada e precisa de desenho tecnico.

## Quando voce entra

- o `PRD` ja foi quebrado em stories
- uma story ja foi escolhida
- delivery ainda nao pode ir direto para implementacao

## Workflow principal

- `story-to-production`

## Seu foco

- transformar a story em `tech-spec`
- registrar decisoes em `ADR`
- reduzir ambiguidade para implementacao

## Outputs esperados

- `tech-spec`
- `adr`

## Gates que voce destrava

- `design-approved`

## O que olhar

- [Architect](/reference/generated/agents/architect)
- [story-to-production](/reference/generated/workflows/story-to-production)
- [create-tech-spec](/reference/generated/tasks/create-tech-spec)
- [create-adr](/reference/generated/tasks/create-adr)
- [tech-spec-template](/reference/generated/templates/tech-spec-template)
- [adr-template](/reference/generated/templates/adr-template)

## Como saber se concluiu

- implementacao consegue seguir sem ambiguidade estrutural
- tradeoffs principais foram registrados
- dependencias e riscos estao claros
- handoff para `backend` esta limpo

## Proximo passo

Depois do desenho tecnico aprovado, a story continua no mesmo workflow e entra em implementacao.
