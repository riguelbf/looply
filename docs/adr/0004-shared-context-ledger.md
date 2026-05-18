# ADR 0004 - Shared Context Ledger

## Status

Accepted

## Context

O looply persiste decisoes de workflow em `workflow-status.md` (campo unico `decisionRationale`) e em artefatos de handoff (tech-spec, ADR, implementation-summary). Porem o `decisionRationale` e uma string plana que e sobrescrita a cada atualizacao do arquivo — o historico de decisoes de stages anteriores se perde.

Alem disso, os artefatos profundos de conhecimento (knowledge-graph.json, code-context.json) nao estao registrados no context-index.md, tornando-os invisiveis para o LLM em runtime.

Agentes com `context_budget: low` nao tem como ler todos os artefatos de stages anteriores sem estourar a janela de contexto.

## Decision

1. Criar um **Context Ledger** por feature: `.looply/custom/features/<name>/context-ledger.md` — append-only, escrito e lido pelos proprios agentes (LLMs), nao pelo CLI.

2. Estrutura com duas zonas: `## Context Summary` (3-5 linhas para budgets baixos) e `## Stage Log` (entradas completas por stage).

3. Registrar knowledge-graph.json, code-context.json e context-ledger.md no `context-index.md` para descoberta automatica.

4. Adicionar **Pre-Action Gate** nos entrypoints de todos os hosts (AGENTS.md, OPENCODE.md, CLAUDE.md) — 6 regras obrigatorias antes de qualquer code change.

5. Novo source `workflow.ledger` no sistema de `context_slots` para agentes que quiserem referencia-lo explicitamente.

6. Budget-aware: agents com budget `low` leem apenas o Summary; `medium+` leem o ledger completo.

## Consequences

- O historico de decisoes acumula naturalmente entre stages sem depender do agente lembrar de preservar conteudo anterior
- Agentes com budget baixo conseguem acessar memoria compartilhada sem estourar contexto
- O knowledge-graph e code-context passam a ser descobertos automaticamente pelo LLM
- O enforcement via entrypoint garante que mesmo sessoes sem invocacao explicita de workflow acessem o estado looply
- Zero novas dependencias — tudo filesystem, puro Markdown
- O CLI nao escreve o ledger — apenas publica o template e as regras de execucao nos SKILL.md
