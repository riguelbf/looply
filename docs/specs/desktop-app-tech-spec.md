# Desktop App Tech Spec

## Purpose

Definir uma futura camada desktop para o LOOPLY que amplie a acessibilidade do produto sem substituir a operacao `CLI-first`.

## Product Positioning

- O desktop app e um companion local do LOOPLY.
- A CLI continua sendo a superficie principal para instalacao, sync, upgrade, validacao e operacao avancada.
- O app desktop prioriza descoberta, visualizacao, retomada de contexto e navegacao entre workflows, artefatos, docs e codigo.

## Goals

- reduzir a barreira de entrada para usuarios menos fluentes em terminal
- visualizar workflows, stages, gates e handoffs por feature
- navegar agents, tasks, workflows, templates e knowledge
- consumir o estado persistido do projeto de forma local e segura
- ler docs geradas, contexto do projeto e artefatos relevantes
- expor o proximo passo de forma host-aware para Codex e Claude

## Non Goals For The First Version

- substituir a CLI
- editar artefatos Markdown diretamente pela GUI
- executar automacao cloud ou remota
- criar um produto SaaS multi-tenant
- manter uma logica de negocio separada da camada core do LOOPLY

## Recommended Stack

- runtime desktop: Electron
- language: TypeScript
- UI: React
- styling: Tailwind + componentes acessiveis
- state: server-like local snapshots + estado UI minimo
- local bridge: preload seguro entre renderer e core Node

Electron e a escolha recomendada para o primeiro ciclo porque o LOOPLY ja e Node/TypeScript e depende de leitura local de arquivos do workspace. Tauri pode ser reavaliado depois da validacao do produto desktop.

## Architecture Direction

### Principle

O app desktop deve consumir uma camada de snapshots e readers do core. Ele nao deve reimplementar parsing de Markdown, regras de workflow ou regras de host dentro da GUI.

### Layers

1. Core Looply
   - leitura de `.looply/state`
   - leitura de `.looply/custom`
   - leitura de contexto, historico, sessoes e feature states
   - leitura do catalogo de artefatos
2. Snapshot Layer
   - `context-snapshot.json`
   - `project-snapshot.json`
   - futuros snapshots de workflow e catalogo, se necessario
3. Desktop Bridge
   - APIs locais readonly para listar projeto, features, docs e arquivos
4. Renderer
   - overview
   - workflows
   - feature detail
   - docs/catalog
   - context explorer

## Primary Data Sources

- `.looply/state/project-snapshot.json`
- `.looply/state/context-snapshot.json`
- `.looply/custom/features/<feature-name>/workflow-status.md`
- `.looply/custom/session-links.json`
- `.looply/state/upgrade-history.json`
- `packs/**`
- `docs-site/**`
- codigo do projeto aberto

## MVP Screens

### Overview

- projeto atual
- host e pack instalados
- quantidade de features, sessoes e historico
- resumo de contexto

### Workflows

- todos os workflows conhecidos
- stages, gates e handoffs
- features associadas e etapa atual

### Feature Detail

- workflow atual
- stage, gate e readiness
- bloqueios
- outputs faltantes
- proximo agente, task, handoff e comando

### Docs And Catalog

- agents
- tasks
- workflows
- templates
- knowledge
- docs geradas

### Context

- linguagens
- frameworks
- modulos
- integracoes
- sinais de testes, infraestrutura e automacao

## Security Model

- local-first
- sem envio automatico de codigo ou contexto para terceiros
- nada sensivel exposto no renderer sem bridge controlada
- leitura de arquivos restrita ao workspace escolhido
- comandos CLI futuros devem ser allowlisted e explicitamente disparados

## Delivery Strategy

### Phase 1

- fortalecer snapshots e status no core
- estabilizar o contrato de leitura para GUI
- manter tudo readonly

### Phase 2

- criar shell desktop com overview, workflows e docs
- abrir arquivos locais e copiar proximos comandos

### Phase 3

- adicionar acoes controladas, como chamar comandos do LOOPLY
- avaliar onboarding assistido e resumidores de estado

## Open Questions

- o catalogo de workflows para GUI deve sair de snapshots ou leitura direta do pack?
- a GUI deve abrir um projeto por vez ou suportar multiplos workspaces?
- devemos expor uma API local do core ou apenas snapshots + leitura de arquivos?
- quando fizer sentido migrar de Electron para Tauri?

## Current Prerequisites

- enriquecer `status`
- consolidar snapshots consumiveis
- completar workflows dos agentes novos
- alinhar a documentacao oficial com o estado real do produto
