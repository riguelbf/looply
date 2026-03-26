# Playbook: PM Analyst

Este playbook cobre discovery e consolidacao de entrada para delivery.

## Quando voce entra

- existe uma ideia bruta
- existe um problema de negocio ainda mal estruturado
- ainda nao existe `PRD` aprovado

## Workflow principal

- `idea-to-prd`

## Slash command principal

```text
/looply:idea-to-prd <feature-name> [problem-statement] [constraints...]
```

Exemplo:

```text
/looply:idea-to-prd pix-webhook-retry "falhas transientes no webhook PIX geram reconciliacao manual" "manter compatibilidade com contrato atual"
```

## Seu objetivo

- entender problema e motivacao
- consolidar `requirement-brief`
- produzir `PRD`
- deixar a feature pronta para planning

## Outputs esperados

- `requirement-brief`
- `prd`

## Gate a liberar

- `discovery-ready`

## O que olhar

- [PM Analyst](/reference/generated/agents/pm-analyst)
- [idea-to-prd](/reference/generated/workflows/idea-to-prd)
- [create-prd](/reference/generated/tasks/create-prd)
- [prd-template](/reference/generated/templates/prd-template)

## Como saber se concluiu

- o `PRD` esta claro e acionavel
- escopo e nao escopo estao definidos
- metricas de sucesso estao claras
- backlog pode ser quebrado em stories

## Proximo passo

Depois do `PRD` aprovado:

```text
/looply:prd-to-stories <feature-name> <prd-name>
```
