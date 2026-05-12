# /looply:problem-evaluator

Diagnose app problems using looply artifacts as primary source, with codebase deep-dive as fallback

## Uso

`/looply:problem-evaluator <feature-name> <scope-reference> [problem-description] [constraints...]`

## Workflow associado

- workflow: [problem-evaluator](../workflows/problem-evaluator)
- fase: `diagnosis`
- orchestrator: `problem-investigator`

## Hosts suportados

- `codex`
- `claude`

## Aliases

- Nenhum alias declarado.

## Argumentos

- `feature-name` required: short identifier for the feature or module being diagnosed
- `scope-reference` required: module, service or component under investigation
- `problem-description` optional: descricao do problema ou sintoma observado
- `constraints` optional variadic: optional constraints, boundaries or specific areas to investigate

## Quando usar

- quando houver um problema reportado no app que precisa de diagnostico de causa raiz
- quando artefatos looply (stories, specs, code-context.json, knowledge-graph.json) podem acelerar a investigacao
- quando o escopo do problema abrange multiplos modulos ou servicos

## Outputs esperados

- `diagnosis-report`

## Exemplo

```text
/problem-evaluator <feature-name> <scope-reference> [problem-description] [constraints...]
```

## Estagios

1. `context-assessment` — coleta e valida artefatos looply disponiveis
2. `artifact-triage` — analisa artefatos para formular hipoteses de causa raiz
3. `codebase-investigation` (condicional) — deep dive no codebase quando artefatos sao insuficientes
4. `diagnosis-report` — consolida evidencias e recomendacoes em relatorio final

[Voltar para slash commands](../slash-commands)
