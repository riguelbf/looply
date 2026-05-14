# triage-artifacts

Analyze looply artifacts to narrow down root cause hypotheses

## Ownership

- agent: `problem-investigator`

## Inputs

- `context-assessment-report`

## Context

- `architecture-principles`

## Outputs

- `triage-findings`

## Templates

- Nenhum item declarado.

## Checklists

- Nenhum item declarado.

## Dependencies

- `assess-problem-context`

## Conteudo do artefato

# Task: triage-artifacts

## Objective

Analisar os artefatos looply coletados para triangular evidencias e formular hipoteses de causa raiz, delimitando o escopo do problema a modulos ou componentes especificos.

## Execution

Prioriza analise estruturada com raciocinio profundo sobre os artefatos disponiveis.

## Steps

1. Cruzar o `problem-description` com as stories ativas da feature em `workflow-status.md`.
2. Consultar `code-context.json` para identificar modulos e simbolos no escopo do problema (`scope-reference`).
3. Consultar `knowledge-graph.json` para verificar schema de banco e dependencias entre modulos afetados.
4. Verificar specs e PRDs associados a feature para entender o comportamento esperado vs observado.
5. Formular hipoteses de causa raiz com base nas evidencias dos artefatos.
6. Para cada hipotese, listar evidencias corroborativas e contraditorias.
7. Se nenhuma hipotese tiver confianca suficiente, sinalizar necessidade de `codebase-investigation`.
8. Registrar hipoteses e nivel de confianca em `triage-findings`.

## Deliverables

- triage-findings com hipoteses de causa raiz, evidencias e nivel de confianca
- decisao explicita sobre necessidade de fallback para `codebase-investigation`

## Arquivo

- `packs/engineering-base/tasks/triage-artifacts.md`

[Voltar para tasks](../tasks)
