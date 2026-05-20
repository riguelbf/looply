# ADR 0005 - Context Ledger Migration to SQLite

## Status

Accepted

## Context

O context ledger atual (`context-ledger.md`) e um arquivo Markdown append-only lido e escrito diretamente por agentes LLM. Embora a abordagem tenha cumprido o objetivo de simplicidade (zero dependencias), ela apresenta limitacoes:

1. **Parsing fragil**: Agentes precisam parsear Markdown para extrair entradas por stage e diferenciar o summary do stage log. Erros de parsing (formatacao inconsistente, heading levels errados) sao comuns entre modelos diferentes.

2. **Sem estrutura**: Nao ha garantia de que campos como `decision`, `rationale`, `constraints` e `risks` estao sempre presentes ou corretamente separados.

3. **Concorrencia**: Se dois agentes tentam escrever no mesmo arquivo simultaneamente, pode haver corrupcao ou perda de dados.

4. **Query semantica**: Buscar decisoes por stage ou por constraint especifico requer parsing manual do Markdown.

5. **Evolucao do schema**: Adicionar novos campos (ex: `related_artifacts`, `review_status`) no Markdown requer atualizar templates e instrucoes de parsing em todos os hosts.

## Decision

1. **Migrar de `context-ledger.md` para `context-ledger.db` (SQLite)** como formato de persistencia do context ledger.

2. **Schema com duas tabelas**:
   - `entries` (id, stage, decision, rationale, constraints, risks, created_at)
   - `summary` (id=1, content, updated_at) — linha unica com o resumo atual

3. **App interno `looply ledger`**: O CLI looply fornece um subcomando `ledger` que encapsula todas as operacoes de leitura/escrita no SQLite. Agentes LLM interagem com o ledger atraves deste comando, nao diretamente com SQL ou arquivos.

4. **Biblioteca `better-sqlite3`**: Sincrona, madura, sem dependencias de runtime alem da compilacao nativa no `npm install`. O banco SQLite e um arquivo unico no filesystem, mantendo a simplicidade do modelo anterior.

5. **Operacoes expostas**:
   - `looply ledger init --feature <name>` — cria o banco com schema
   - `looply ledger read --feature <name> [--summary-only]` — le entradas no formato JSON
   - `looply ledger append --feature <name> ...` — insere nova entrada de stage
   - `looply ledger summary update --feature <name> --text <text>` — atualiza o resumo

## Consequences

- Agentes nao precisam mais parsear Markdown para acessar o context ledger — recebem JSON estruturado
- O schema garante que todos os campos obrigatorios estao presentes em cada entrada
- SQLite oferece atomicidade nas escritas, eliminando risco de corrupcao por concorrencia
- Novas dependencias: `better-sqlite3` (build-time, nao runtime para o usuario final)
- O arquivo `context-ledger-template.md` deixa de existir; a iniciativa do banco e feita via `looply ledger init`
- As instrucoes nos SKILL.md e entrypoints sao atualizadas para referenciar `looply ledger` em vez de leitura/escrita direta de Markdown
- O context-index.md referencia `context-ledger.db` em vez de `context-ledger.md`
