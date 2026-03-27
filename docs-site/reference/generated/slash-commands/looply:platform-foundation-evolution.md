# /looply:platform-foundation-evolution

Evolve shared platform foundation with guardrails, governance and cost review

## Uso

`/looply:platform-foundation-evolution <initiative-name> [constraints...]`

## Workflow associado

- workflow: [platform-foundation-evolution](../workflows/platform-foundation-evolution)
- fase: `planning`
- orchestrator: `delivery-orchestrator`

## Hosts suportados

- `codex`
- `claude`

## Aliases

- Nenhum alias declarado.

## Argumentos

- `initiative-name` required: platform initiative, foundation slice or shared capability
- `constraints` optional variadic: optional product constraints, platform guardrails or rollout notes

## Quando usar

- quando o workflow associado deve ser invocado manualmente no host

## Outputs esperados

- `tech-spec`
- `review-report`

## Exemplo

```text
/platform-foundation-evolution <initiative-name> [constraints...]
```

[Voltar para slash commands](../slash-commands)
