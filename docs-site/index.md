---
layout: home

hero:
  name: "looply"
  text: "Plataforma de artefatos para engenharia assistida por IA"
  tagline: "looply publica packs de agents, workflows, tasks, templates e conhecimento para hosts de IA como Codex, Claude Code e OpenCode. Um contrato unico de artefatos que cada host consome no seu formato nativo."
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
    details: Agents, tasks, workflows, templates, checklists e knowledge — versionados e curados. O pack `engineering-base` cobre discovery, planning e delivery.
  - icon: 🔧
    title: CLI de operacao
    details: Comandos para install, sync, validate, doctor, status, upgrade e diagnose. O CLI publica artefatos, gerencia contexto e mantem a plataforma atualizada.
  - icon: 🔗
    title: Publicacao multi-host
    details: Um mesmo pack traduzido para o formato nativo de Codex, Claude Code e OpenCode. Skills, comandos, playbooks e arquivos de estado gerados automaticamente.
---

<div class="lp-section">

## O que o looply faz

O looply e uma camada de artefatos entre seu codebase e seus agentes de IA. Ele organiza conhecimento de engenharia em **packs** — modulos Markdown versionados que contem tudo que um agente de IA precisa para operar com contexto real do projeto.

<div class="lp-cols">

<div>

### Publica artefatos

Cada pack do looply contem:

- **Agents** — capacidades especializadas (`pm-analyst`, `architect`, `backend`, `reviewer`, `delivery-orchestrator`)
- **Workflows** — sequencias de fases, stages, gates e handoffs entre agentes
- **Tasks** — instrucoes de trabalho que o host executa
- **Knowledge** — principios, convencoes e contexto de engenharia
- **Templates** — estruturas de saida para PRDs, tech specs e stories
- **Checklists** — gates de qualidade por fase

</div>

<div>

### Extrai contexto

O looply analisa o codebase e extrai:

- **Knowledge Graph** — classes, funcoes, modulos, tabelas de banco, foreign keys
- **Schema de banco** — Prisma, Drizzle, TypeORM e SQL migrations (analise estatica, sem conexao)
- **Regras do projeto** — convencoes, politicas de seguranca, gates
- **Contexto de integracoes** — APIs externas, servicos, autenticacao

Esse contexto e servido aos agentes em toda sessao. Nenhum agente opera no escuro.

</div>

</div>

</div>

<div class="lp-section lp-alt">

## Workflows disponiveis

<div class="lp-cols">

<div>

### `idea-to-prd`

Discovery de ideia bruta ate PRD aprovado.

- Agente: `pm-analyst`
- Entrada: problema ou ideia informal
- Saida: PRD com escopo, criterios de sucesso, restricoes
- Gates: investigacao, validacao, consolidacao, aprovacao

</div>

<div>

### `prd-to-stories`

Quebra do PRD em backlog acionavel.

- Agente: `delivery-orchestrator` + `pm-analyst`
- Entrada: PRD aprovado
- Saida: stories com criterios de aceitacao, prioridade e vinculo com entidades do codigo
- Gates: cobertura, granularidade, rastreabilidade

</div>

<div>

### `story-to-production`

Delivery da story ate release plan.

- Agentes: `architect` → `backend` → `reviewer`
- Entrada: story do backlog
- Saida: tech spec, implementacao, review, release plan
- Gates: design review, code review, qualidade, readiness

</div>

<div>

### `workflow-status`

Retomada e navegacao entre sessoes.

- Agente: `delivery-orchestrator`
- Entrada: nome da feature + estado persistido
- Saida: proximo passo recomendado, reconciliacao de sessao
- Estado: `workflow-control.json` + `workflow-status.md`

</div>

</div>

</div>

<div class="lp-section">

## Agentes

Cada agente e uma capacidade especializada com contrato definido. O looply publica o agente como skill no formato do host.

| Agente | Funcao | Workflow |
|---|---|---|
| `pm-analyst` | Discovery, investigacao e consolidacao de PRD | `idea-to-prd`, `prd-to-stories` |
| `delivery-orchestrator` | Coordenacao de fases, gates, handoffs e retomada | Todos |
| `architect` | Desenho tecnico, ADR e tech spec | `story-to-production` |
| `backend` | Implementacao e ajustes no codebase | `story-to-production` |
| `reviewer` | Review de codigo, qualidade e readiness | `story-to-production` |

Cada agente declara no frontmatter seus `context_slots` — o que precisa receber do looply (`inline`) e o que o host resolve em runtime (`reference`).

</div>

<div class="lp-section lp-alt">

## Comandos Slash

Aliases disponiveis nos hosts apos `install`:

| Comando | Acao |
|---|---|
| `/looply:idea-to-prd <feature> [problema]` | Inicia discovery de feature |
| `/looply:prd-to-stories <feature>` | Quebra PRD em stories |
| `/looply:story-to-production <feature> <story>` | Entrega story ate release |
| `/looply:workflow-status <feature>` | Mostra estado atual e proximo passo |
| `/looply:resume <feature>` | Retoma workflow do estado salvo |
| `/looply:next <feature>` | Mostra proximo passo recomendado |
| `/looply:skill-creator <nome>` | Cria nova skill looply interativamente |
| `/looply:skill-search [query]` | Busca skills e workflows disponiveis |

</div>

<div class="lp-section">

## CLI

O CLI gerencia o ciclo de vida da plataforma no repositorio.

```bash
npx @looply-cli/looply install   # instala packs, detecta hosts, publica artefatos
looply sync                        # sincroniza packs e contexto com a ultima versao
looply validate                    # valida artefatos contra platform contracts
looply doctor                      # diagnostica problemas de configuracao
looply status                      # mostra estado da plataforma e features ativas
looply upgrade                     # atualiza CLI e packs
```

Comandos de contexto:

```bash
looply refresh-context             # reextrai contexto do codebase
looply refresh-code-context        # reextrai knowledge graph
looply integrations list           # lista integracoes configuradas
looply integrations add <nome>     # adiciona contexto de integracao
```

</div>

<div class="lp-section lp-alt">

## Arquitetura

O looply opera em tres camadas:

<div class="lp-cols">

<div>

**Packs e artefatos.** Fonte de verdade operacional. Agents, tasks, workflows, templates, knowledge e checklists em Markdown versionado. Packs podem incluir outros packs (ex: `software-delivery-suite` inclui `product-base` e `engineering-base`).

</div>

<div>

**Publicacao.** Camada que materializa artefatos no formato nativo de cada host. Gera skills, comandos, hints de execucao e arquivos de superficie. Comandos: `install`, `sync`, `upgrade`, `doctor`.

</div>

<div>

**CLI.** Interface de operacao. Instala, sincroniza, valida, inspeciona e mantem a plataforma. Detecta hosts ativos, extrai contexto do codebase e publica artefatos calibrados.

</div>

</div>

[Ler documentacao completa da arquitetura →](/overview/architecture)

</div>

<div class="lp-section">

## Instalacao

```bash
npx @looply-cli/looply install
```

O comando:
1. Detecta hosts de IA ativos no repositorio (Codex, Claude Code, OpenCode)
2. Extrai contexto do codebase (knowledge graph, schema de banco, regras)
3. Publica packs, skills, comandos e playbooks no formato de cada host
4. Gera arquivos de estado em `.looply/`

Apos instalar, os aliases `/looply:*` ficam disponiveis nos hosts.

[Guia completo de instalacao →](/guides/installation)

</div>
