# Project Status

Este arquivo existe para registrar onde o projeto parou, o que ja foi concluido e qual e o proximo corte de implementacao. A ideia e manter este estado versionado junto com o repositorio.

## Como usar

- atualize este arquivo ao final de cada slice relevante
- mantenha `In Progress` curto e objetivo
- mova itens fechados para `Recently Completed`
- use `Next Up` para o que deve vir na sequencia

## Snapshot

- Project: `looply`
- Stage: `v1 foundation`
- Primary focus: plataforma de artefatos para engenharia com IA assistida
- Hosts: `Claude Code`, `Codex`
- Main pack: `engineering-base`

## In Progress

- avaliar a adaptacao de `Codex` para `skills` sem perder alinhamento com os aliases `/looply:*` do Claude

## Next Up

- decidir a estrategia de extensao do `Codex` com `skills`
- consolidar a experiencia equivalente entre `Claude` e `Codex`
- seguir refinando a documentacao e o onboarding conforme o uso real

## Recently Completed

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
- `Hosts`
  - Claude com slash commands publicados
  - Codex com entrypoints, playbooks e convencoes publicadas
- `Docs`
  - portal local em `docs-site`

## Open Questions

- qual deve ser a experiencia oficial do `Codex`: apenas convencao via `AGENTS.md` ou publicacao adicional via `skills`
- como manter a melhor paridade possivel entre `Claude` e `Codex`
- quando introduzir especializacoes de dominio alem do `engineering-base`

## Notes

- este arquivo e deliberadamente humano e resumido
- detalhes estruturais continuam em `docs/`, `docs-site/`, `platform/` e `packs/`
