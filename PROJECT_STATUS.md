# Project Status

Este arquivo existe para registrar onde o projeto parou, o que ja foi concluido e qual e o proximo corte de implementacao. A ideia e manter este estado versionado junto com o repositorio.

## Como usar

- atualize este arquivo ao final de cada slice relevante
- mantenha `In Progress` curto e objetivo
- mova itens fechados para `Recently Completed`
- use `Next Up` para o que deve vir na sequencia

## Snapshot

- Project: `looply`
- Stage: `v2 hardening in progress`
- Primary focus: plataforma de artefatos para engenharia com IA assistida
- Hosts: `Claude Code`, `Codex`
- Main pack: `software-delivery-suite`

## In Progress

- aprofundar o `refresh-context` para entender melhor API, dados, auth, mensageria e observabilidade
- fechar workflows dedicados para cloud e plataforma no `engineering-base`
- alinhar a documentacao oficial com o estado real da CLI
- reforcar `status` como interface operacional principal do produto

## Next Up

- revisar paridade de operacao entre `Codex` e `Claude`
- avaliar se precisamos de snapshots adicionais para catalogo e workflows
- decidir a proxima fatia de especializacao operacional antes de qualquer GUI

## Recently Completed

- separacao de packs concluida em `product-base`, `engineering-base` e `software-delivery-suite`
- camada de snapshots adicionada com `context-snapshot.json` e `project-snapshot.json`
- `status` agora pode emitir estado normalizado via `looply status --json`
- `refresh-context` agora publica snapshot consumivel por ferramentas locais
- tech spec inicial do companion desktop registrada para retomada futura, sem virar prioridade do roadmap
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
  - install, sync, upgrade, doctor, validate, status, docs, integrations, sessions
- `Artifacts`
  - agents, tasks, workflows, knowledge, templates, checklists
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

- fortalecer entendimento de projeto existente antes de qualquer camada GUI
- deixar `status` e `refresh-context` como superficies centrais de valor do CLI
- garantir que workflows e docs reflitam o produto real, nao uma versao anterior dele

## Open Questions

- qual deve ser a combinacao final entre `AGENTS.md`, `LOOPLY_COMMANDS.md` e `skills` no `Codex`
- como manter a melhor paridade possivel entre `Claude` e `Codex`
- como desenhar a fase de especializacao profunda sem acoplar cedo demais o produto
- quando iniciar a estrategia de personas e engenharia reversa de dominio

## Notes

- este arquivo e deliberadamente humano e resumido
- detalhes estruturais continuam em `docs/`, `docs-site/`, `platform/` e `packs/`
- `release-2` cobre hardening do produto e paridade entre hosts
- `release-3` fica reservado para especializacao profunda, personas e dominio
