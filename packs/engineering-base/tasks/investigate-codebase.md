---
schema: looply/task@v1
name: investigate-codebase
agent: problem-investigator
summary: Deep dive into the codebase when looply artifacts are insufficient for root cause identification
execution:
  profile: implementation
  reasoning_effort: high
  context_budget: large
  latency_priority: medium
  preferred_hosts:
    - codex
  model_hint:
    provider: openai
    family: gpt-5
inputs:
  - triage-findings
  - scope-reference
context:
  - architecture-principles
outputs:
  - investigation-findings
dependencies:
  - triage-artifacts
---

# Task: investigate-codebase

## Objective

Realizar deep dive autonomo no codebase real quando os artefatos looply nao forem suficientes para identificar a causa raiz com confianca. Esta tarefa e condicional e so deve ser executada quando `artifact-triage` nao produziu hipoteses conclusivas.

## Execution

Prioriza busca profunda no codebase com ferramentas de exploracao (glob, grep, read). Alto consumo de contexto.

## Steps

1. Partir das hipoteses inconclusivas do `triage-findings` e do `scope-reference` para delimitar a busca.
2. Usar `glob` para localizar arquivos relevantes no modulo/componente sob investigacao.
3. Usar `grep` para buscar padroes relacionados ao sintoma do problema (ex: funcoes, handlers, rotas, queries).
4. Ler arquivos criticos identificados com `read` para entender a logica de execucao.
5. Rastrear o fluxo de dados e controle atraves dos arquivos para validar ou refutar cada hipotese.
6. Verificar testes existentes para entender o comportamento esperado.
7. Documentar evidencias encontradas no codebase para cada hipotese investigada.
8. Determinar causa raiz com base nas evidencias coletadas do codebase.
9. Registrar achados em `investigation-findings`.

## Deliverables

- investigation-findings com evidencias do codebase, causa raiz identificada (ou inconclusivo) e arquivos/linhas relevantes
