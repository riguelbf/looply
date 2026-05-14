# assess-problem-context

Collect and validate available looply artifacts for the problem scope

## Ownership

- agent: `problem-investigator`

## Inputs

- `problem-description`
- `feature-name`
- `scope-reference`

## Context

- `architecture-principles`

## Outputs

- `context-assessment-report`

## Templates

- Nenhum item declarado.

## Checklists

- Nenhum item declarado.

## Dependencies

- Nenhum item declarado.

## Conteudo do artefato

# Task: assess-problem-context

## Objective

Coletar e validar todos os artefatos looply disponiveis para o escopo do problema, determinando se sao suficientes para diagnostico ou se o fallback de codebase sera necessario.

## Execution

Prioriza coleta rapida e validacao de frescor dos artefatos.

## Steps

1. Verificar existencia e frescor de `.looply/state/code-context.json` (grafo de modulos, simbolos, dependencias).
2. Verificar existencia e frescor de `.looply/state/knowledge-graph.json` (schema de banco, dependencias entre modulos).
3. Coletar `workflow-status.md` da feature se existir (stories ativas, specs, estado atual).
4. Validar status de cada artefato (`active`, `draft`, `stale`, `empty`) conforme `context-index.md`.
5. Se `code-context.json` ou `knowledge-graph.json` estiverem stale ou ausentes, sugerir `looply refresh-code-context`.
6. Determinar se o conjunto de artefatos e suficiente para prosseguir com `artifact-triage` ou se `codebase-investigation` sera necessario como fallback.
7. Registrar resultado em `context-assessment-report`.

## Deliverables

- context-assessment-report com status de cada artefato e decisao sobre necessidade de fallback

## Arquivo

- `packs/engineering-base/tasks/assess-problem-context.md`

[Voltar para tasks](../tasks)
