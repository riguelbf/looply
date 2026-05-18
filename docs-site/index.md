---
layout: home

hero:
  name: "looply"
  text: "Plataforma de artefatos para engenharia assistida por IA"
  tagline: "Packs de agents, workflows, tasks e conhecimento que seus hosts de IA consomem no formato nativo. Codex, Claude Code, OpenCode."
  actions:
    - theme: brand
      text: Instalar
      link: /guides/getting-started
    - theme: alt
      text: Documentacao
      link: /overview/

features:
  - icon: 📦
    title: Packs de artefatos
    details: Agents, tasks, workflows, templates, checklists e knowledge versionados. O pack engineering-base cobre discovery, planning e delivery.
  - icon: 🔧
    title: CLI de operacao
    details: install, sync, validate, doctor, status, upgrade. Publica artefatos, gerencia contexto e mantem a plataforma atualizada.
  - icon: 🔗
    title: Multi-host
    details: Um pack traduzido para Codex, Claude Code e OpenCode. Skills, comandos e playbooks gerados no formato nativo de cada host.
---

<div class="lp-body">

<section class="lp-section">

## <span class="lp-num">01</span> O que o looply faz

<div class="lp-grid-2">

<div class="lp-card">

### Publica artefatos

Cada pack contem agents, workflows, tasks, knowledge, templates e checklists. O looply publica o contrato — cada host traduz para seu formato nativo e executa.

- **Agents** — `pm-analyst`, `architect`, `backend`, `reviewer`, `delivery-orchestrator`
- **Workflows** — fases, stages, gates e handoffs entre agentes
- **Tasks** — instrucoes de trabalho para cada etapa
- **Knowledge** — principios, convencoes e contexto de engenharia
- **Templates** — estruturas para PRDs, tech specs e stories
- **Checklists** — gates de qualidade por fase

</div>

<div class="lp-card">

### Extrai contexto

O looply analisa o codebase e constroi uma camada de contexto que todo agente recebe em cada sessao.

- **Context Ledger** — memoria compartilhada append-only. Decisoes e rationale acumulam entre stages
- **Knowledge Graph** — classes, funcoes, modulos, tabelas e foreign keys
- **Schema de banco** — Prisma, Drizzle, TypeORM, SQL migrations (estatico, sem conexao)
- **Regras do projeto** — convencoes, seguranca, gates de qualidade
- **Integracoes** — APIs externas, servicos, autenticacao

</div>

</div>

</section>

<section class="lp-section lp-alt">

## <span class="lp-num">02</span> Workflows

<div class="lp-grid-2">

<div class="lp-card">

### `idea-to-prd`

Discovery de ideia ate PRD aprovado.

<div class="lp-flow">

<span class="lp-flow-step"><b>Agente</b> `pm-analyst`</span>
<span class="lp-flow-arrow">→</span>
<span class="lp-flow-step"><b>Entrada</b> ideia ou problema</span>
<span class="lp-flow-arrow">→</span>
<span class="lp-flow-step"><b>Saida</b> PRD com escopo e criterios</span>

</div>

</div>

<div class="lp-card">

### `prd-to-stories`

Quebra do PRD em backlog.

<div class="lp-flow">

<span class="lp-flow-step"><b>Agente</b> `delivery-orchestrator`</span>
<span class="lp-flow-arrow">→</span>
<span class="lp-flow-step"><b>Entrada</b> PRD aprovado</span>
<span class="lp-flow-arrow">→</span>
<span class="lp-flow-step"><b>Saida</b> stories com aceitacao e prioridade</span>

</div>

</div>

<div class="lp-card">

### `story-to-production`

Delivery da story ate release.

<div class="lp-flow">

<span class="lp-flow-step"><b>Agentes</b> `architect` `backend` `reviewer`</span>
<span class="lp-flow-arrow">→</span>
<span class="lp-flow-step"><b>Entrada</b> story do backlog</span>
<span class="lp-flow-arrow">→</span>
<span class="lp-flow-step"><b>Saida</b> tech spec, implementacao, release plan</span>

</div>

</div>

<div class="lp-card">

### `workflow-status`

Retomada entre sessoes.

<div class="lp-flow">

<span class="lp-flow-step"><b>Agente</b> `delivery-orchestrator`</span>
<span class="lp-flow-arrow">→</span>
<span class="lp-flow-step"><b>Entrada</b> feature + estado salvo</span>
<span class="lp-flow-arrow">→</span>
<span class="lp-flow-step"><b>Saida</b> proximo passo e reconciliacao</span>

</div>

</div>

</div>

</section>

<section class="lp-section">

## <span class="lp-num">03</span> Agentes

<div class="lp-table-wrap">

| Agente | Funcao | Workflows |
|---|---|---|
| `pm-analyst` | Discovery e consolidacao de PRD | `idea-to-prd`, `prd-to-stories` |
| `delivery-orchestrator` | Coordenacao de fases, gates e handoffs | Todos |
| `architect` | Desenho tecnico, ADR e tech spec | `story-to-production` |
| `backend` | Implementacao e ajustes no codebase | `story-to-production` |
| `reviewer` | Review, qualidade e readiness | `story-to-production` |

</div>

Cada agente declara `context_slots` no frontmatter: o que o looply resolve (`inline`) e o que o host resolve em runtime (`reference`).

</section>

<section class="lp-section lp-alt">

## <span class="lp-num">04</span> Comandos Slash

<div class="lp-table-wrap">

| Comando | Acao |
|---|---|
| `/looply:idea-to-prd <feature> [problema]` | Inicia discovery da feature |
| `/looply:prd-to-stories <feature>` | Quebra PRD em stories |
| `/looply:story-to-production <feature> <story>` | Entrega story ate release |
| `/looply:workflow-status <feature>` | Estado atual e proximo passo |
| `/looply:resume <feature>` | Retoma workflow do estado salvo |
| `/looply:next <feature>` | Proximo passo recomendado |
| `/looply:skill-creator <nome>` | Cria nova skill interativamente |
| `/looply:skill-search [query]` | Busca skills e workflows |

</div>

</section>

<section class="lp-section">

## <span class="lp-num">05</span> CLI

<div class="lp-grid-2">

<div>

### Operacao

```bash
npx @looply-cli/looply install
looply sync
looply validate
looply doctor
looply status
looply upgrade
```

</div>

<div>

### Contexto

```bash
looply refresh-context
looply refresh-code-context
looply integrations list
looply integrations add <nome>
looply integrations configure <nome>
```

</div>

</div>

</section>

<section class="lp-section lp-alt">

## <span class="lp-num">06</span> Arquitetura

<div class="lp-grid-3">

<div class="lp-card">

**Packs e artefatos**

Fonte de verdade operacional. Markdown versionado com agents, tasks, workflows, templates e knowledge. Packs podem incluir outros packs.

</div>

<div class="lp-card">

**Publicacao**

Materializa artefatos no formato nativo de cada host. Gera skills, comandos, hints e arquivos de superficie.

</div>

<div class="lp-card">

**CLI**

Interface de operacao. Instala, sincroniza, valida e mantem a plataforma. Detecta hosts e extrai contexto do codebase.

</div>

</div>

</section>

<section class="lp-section">

## <span class="lp-num">07</span> Instalar

```bash
npx @looply-cli/looply install
```

O comando detecta hosts ativos, extrai contexto do codebase, publica packs e gera arquivos de estado em `.looply/`. Os aliases `/looply:*` ficam disponiveis imediatamente.

</section>

</div>
