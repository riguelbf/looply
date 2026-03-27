# /looply:cloud-workload-design

Define cloud topology, governance controls and cost posture for a workload change

## Uso

`/looply:cloud-workload-design <feature-name> <scope-reference> [constraints...]`

## Workflow associado

- workflow: [cloud-workload-design](../workflows/cloud-workload-design)
- fase: `planning`
- orchestrator: `delivery-orchestrator`

## Hosts suportados

- `codex`
- `claude`

## Aliases

- Nenhum alias declarado.

## Argumentos

- `feature-name` required: short identifier for the workload or feature
- `scope-reference` required: workload, service or initiative being assessed
- `constraints` optional variadic: optional constraints, guardrails or non-functional concerns

## Quando usar

- quando o workflow associado deve ser invocado manualmente no host

## Outputs esperados

- `tech-spec`
- `adr`
- `review-report`

## Exemplo

```text
/cloud-workload-design <feature-name> <scope-reference> [constraints...]
```

[Voltar para slash commands](../slash-commands)
