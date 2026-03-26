---
layout: home

hero:
  name: "looply"
  text: "Portal da plataforma de artefatos para engenharia assistida por IA"
  tagline: "Documentacao centralizada para CLI, slash commands, agents, workflows, integracoes e modos operacionais em Codex e Claude Code."
  actions:
    - theme: brand
      text: Comecar
      link: /guides/getting-started
    - theme: alt
      text: Ver slash commands
      link: /guides/slash-commands

features:
  - title: CLI operacional
    details: Instalar, sincronizar, validar, diagnosticar, atualizar e documentar o setup do looply.
  - title: Workflows orientados por artefatos
    details: Discovery, planning e delivery organizados por workflows, tasks, gates e handoffs.
  - title: Integracao com hosts
    details: Publicacao para Codex e Claude Code com convencoes e aliases operacionais.
---

## Comece por aqui

- Quer instalar e testar o projeto no seu repositorio: [Getting Started](/guides/getting-started)
- Quer entender o que funciona em cada host: [Hosts Suportados](/guides/hosts)
- Quer entender como Codex e Claude se comportam durante a execucao: [Comportamento dos Hosts](/guides/host-behavior)
- Quer descobrir quais comandos slash existem: [Slash Commands](/guides/slash-commands)
- Quer ver todos os agentes, tasks e workflows disponiveis: [Catalogo do Engineering Base](/guides/catalog)
- Quer testar uma feature ponta a ponta: [Primeira Feature](/guides/first-feature)
- Quer seguir o fluxo por papel: [Playbooks](/playbooks/)
- Quer resolver problemas comuns de uso: [Troubleshooting](/guides/troubleshooting)

## O Que Existe Hoje

### Agentes

- [`pm-analyst`](/reference/generated/agents/pm-analyst): discovery e consolidacao de PRD
- [`delivery-orchestrator`](/reference/generated/agents/delivery-orchestrator): coordena fases, gates, handoffs e retomada
- [`architect`](/reference/generated/agents/architect): desenho tecnico e ADR
- [`backend`](/reference/generated/agents/backend): implementacao e ajustes no codebase
- [`reviewer`](/reference/generated/agents/reviewer): review, qualidade e readiness

### Workflows

- [`idea-to-prd`](/reference/generated/workflows/idea-to-prd): discovery de ideia bruta ate PRD aprovado
- [`prd-to-stories`](/reference/generated/workflows/prd-to-stories): quebra do PRD em backlog acionavel
- [`story-to-production`](/reference/generated/workflows/story-to-production): delivery da story ate release plan
- [`workflow-status`](/reference/generated/workflows/workflow-status): retomada, proximo passo e reconciliacao de sessao

### Slash Commands

- [`/looply:idea-to-prd`](/reference/generated/slash-commands/looply:idea-to-prd)
- [`/looply:prd-to-stories`](/reference/generated/slash-commands/looply:prd-to-stories)
- [`/looply:story-to-production`](/reference/generated/slash-commands/looply:story-to-production)
- [`/looply:workflow-status`](/reference/generated/slash-commands/looply:workflow-status)
- aliases de retomada: [`/looply:resume`](/reference/generated/slash-commands/looply:workflow-status) e [`/looply:next`](/reference/generated/slash-commands/looply:workflow-status)

### Artefatos de Suporte

- [Knowledge](/reference/generated/knowledge)
- [Templates](/reference/generated/templates)
- [Checklists](/reference/generated/checklists)

## Playbooks por Papel

- [PM Analyst](/playbooks/pm-analyst)
- [Architect](/playbooks/architect)
- [Backend Developer](/playbooks/backend-developer)
- [Reviewer](/playbooks/reviewer)
