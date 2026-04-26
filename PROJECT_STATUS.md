# Project Status

Este arquivo existe para registrar onde o projeto parou, o que ja foi concluido e qual e o proximo corte de implementacao. A ideia e manter este estado versionado junto com o repositorio.

## Como usar

- atualize este arquivo ao final de cada slice relevante
- mantenha `In Progress` curto e objetivo
- mova itens fechados para `Recently Completed`
- use `Next Up` para o que deve vir na sequencia

## Snapshot

- Project: `looply`
- Stage: `v2 hardening + local desktop expansion`
- Primary focus: plataforma de artefatos para engenharia com IA assistida, com operacao CLI-first e companion desktop local
- Hosts: `Claude Code`, `Codex`
- Main pack: `engineering-base`

## In Progress

- fechar o primeiro slice de `cli-autocomplete` a partir da arvore real do Commander
- evoluir `multi-language-code-context` para ser consumido por `status` e pelo desktop
- consolidar `ICL example guidance` como default dos workflows relevantes
- amadurecer o companion desktop local com overview, features, integrations e actions seguras
- alinhar `refresh-context`, `refresh-code-context` e `project-snapshot` com o estado real do repositorio

## Next Up

- concluir a primeira entrega de autocomplete em `bash` e `zsh`
- decidir se `code-context` fica separado de `refresh-context` ou vira uma etapa integrada
- expandir o desktop para detalhes de workflow, feature control e retomada
- finalizar a historia de integracoes externas com contextos e touchpoints mais claros

## Recently Completed

- `status` agora consolida snapshot do projeto, features, sessions, hosts e estado de ICL
- `refresh-context` e `refresh-code-context` agora publicam snapshots consumiveis para contexto e code-context
- `ICL example guidance` entrou como camada explicita para calibrar os workflows
- `integrations` passou a expor contexto de integracoes e seus touchpoints
- o desktop local passou a ler snapshot, listar features, integracoes e acoes de workflow
- `workflow-status` continua a ser a superficie de retomada para features em andamento
- `cli-autocomplete` entrou como nova frente de CLI baseada na arvore real do comando
- `multi-language-code-context` passou a existir como snapshot dedicado e surfacing no status
- separacao de packs concluida em `product-base`, `engineering-base` e `software-delivery-suite`
- camada de snapshots adicionada com `context-snapshot.json` e `project-snapshot.json`
- `status` agora pode emitir estado normalizado via `looply status --json`
- `refresh-context` agora gera `architecture-context.md` e detecta melhor sinais de stack, automacao, testes, infra e workspace
- `devops` e `sre` adicionados ao `engineering-base`, com tasks e operabilidade entrando no `story-to-production`
- hosts reforcados para consumir `knowledge_sources`, `best-practices`, templates e checklists como contrato de execucao
- camada de `best-practices` por especialista adicionada e ligada aos agentes do `engineering-base`
- templates principais enriquecidos para discovery, planning, delivery, review e release
- exemplo ponta a ponta adicionado em `examples/pix-webhook-retry/` com discovery, planning, delivery e workflow status
- `status` enriquecido com sessoes ligadas, bloqueios, missing outputs e proximo passo
- primeiro corte de `refresh-context` implementado com `project-context.md` e `project-inventory.md`
- workflow do GitHub Pages adicionado para publicar `docs-site` automaticamente a partir da `main`
- `docs open` voltou a priorizar `127.0.0.1` com fallback para arquivo local
- descoberta do `Codex` melhorada com placeholders em `default_prompt` e `Quick usage` nas skills
- UX de descoberta do `Codex` reforcada com skill raiz `$looply`
- `workflow-status` evoluido para resposta com tabela no topo
- roadmap de `v2` e `v3` publicado em `docs/releases/`
- primeira camada de `Codex skills` adicionada ao publish do `looply`
- validacao manual de uma feature ponta a ponta na `v1`
- rename completo de `llaios` para `looply`
- CLI principal publicada como `looply`
- paths operacionais migrados para `.looply`
- pack `engineering-base` instalado e publicado para hosts
- workflows separados em `idea-to-prd`, `prd-to-stories`, `story-to-production` e `workflow-status`
- aliases de retomada adicionados: `/looply:resume` e `/looply:next`
- suporte a `project-mode`, `interaction-mode` e `locale`
- comando `status` consolidado na CLI
- comando `docs open` ajustado para buildar e abrir a documentacao automaticamente
- portal de docs em `VitePress` estruturado com guides, playbooks, troubleshooting e reference
- `README` expandido com instalacao, uso, hosts e workflows
- branding do projeto migrado para `looply`

## Current Product Shape

- `CLI`
  - install, sync, upgrade, doctor, validate, status, docs, integrations, sessions, refresh-context, refresh-code-context, icl, replay, run-task, run-agent, list, inspect
- `Desktop`
  - overview, status, hosts, features, integrations, settings
- `Artifacts`
  - agents, tasks, workflows, knowledge, templates, checklists, context snapshots
- `Packs`
  - `product-base`
  - `engineering-base`
  - `software-delivery-suite`
- `Hosts`
  - Claude com slash commands publicados
  - Codex com entrypoints, playbooks e convencoes publicadas
- `Docs`
  - portal local em `docs-site`

## Product Direction Right Now

- fortalecer entendimento do projeto existente antes de ampliar a superficie desktop
- manter `CLI-first`, usando o desktop como companion local de leitura e retomada
- deixar `status`, `refresh-context` e `refresh-code-context` como superficies centrais de valor do CLI
- garantir que workflows, snapshots e docs reflitam o produto real, nao uma versao anterior dele

## Open Questions

- qual deve ser o limite entre `refresh-context` e `refresh-code-context`
- quanto de acao o desktop deve oferecer antes de deixar de ser readonly
- como manter a melhor paridade possivel entre `Claude` e `Codex`
- quando iniciar a especializacao profunda por dominio sem acoplar cedo demais o produto

## Notes

- este arquivo e deliberadamente humano e resumido
- detalhes estruturais continuam em `docs/`, `docs-site/`, `platform/` e `packs/`
- `release-2` cobre hardening do produto e paridade entre hosts
- `release-3` fica reservado para especializacao profunda, personas e dominio
