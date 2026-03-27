# /looply:idea-to-prd

Start discovery and consolidate an idea into an approved PRD

## Uso

`/looply:idea-to-prd <feature-name> [problem-statement] [constraints...]`

## Workflow associado

- workflow: [idea-to-prd](../workflows/idea-to-prd)
- fase: `discovery`
- orchestrator: `pm-analyst`

## Hosts suportados

- `codex`
- `claude`

## Aliases

- Nenhum alias declarado.

## Argumentos

- `feature-name` required: short identifier for the feature or initiative
- `problem-statement` optional: user problem or desired business outcome
- `constraints` optional variadic: optional constraints, dependencies or business notes

## Quando usar

- quando voce tem uma ideia bruta ou problema de negocio e quer abrir discovery
- quando ainda nao existe PRD aprovado para a feature

## Outputs esperados

- `prd`

## Exemplo

```text
/looply:idea-to-prd pix-webhook-retry "falhas transientes no webhook PIX geram reconciliacao manual" "manter compatibilidade com contrato atual"
```

[Voltar para slash commands](../slash-commands)
