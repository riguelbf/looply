# looply

Plataforma de artefatos para engenharia assistida por IA.

O foco atual do projeto e criar uma base versionada de:

- agents
- tasks
- workflows
- squads
- knowledge packs
- templates
- checklists

Esses artefatos sao publicados para hosts como Codex e Claude Code, que passam a consumir as instrucoes e convencoes geradas pelo LOOPLY.

## O que o projeto e

- plataforma de artefatos Markdown com frontmatter
- modelo canonico para packs e squads
- camada de publicacao para hosts
- CLI para install, sync, validate, doctor, list e inspect

## Stack ativa

- Node.js
- TypeScript
- Commander
- @clack/prompts
- Zod
- gray-matter
- fs-extra
- globby

## O que o projeto nao e na v1

- runtime proprio de tasks
- orchestrator autonomo de agentes
- chat interface
- plataforma SaaS

## Direcao atual

A implementacao ativa do projeto agora e exclusivamente em Node.js. O foco esta centrado na plataforma LOOPLY descrita em [idea.md](./idea.md).

## Estrutura atual

```text
looply/
  bin/
  docs/
    adr/
    releases/
    specs/
  docs-site/
    .vitepress/
    guides/
    overview/
    reference/
    specs/
    scripts/
  packs/
    engineering-base/
    architecture-squad/
    payments-squad/
  platform/
    contracts/
    manifests/
  src/
    commands/
    hosts/
    lib/
    ui/
    validation/
```

## Fonte da verdade

- `idea.md`: visao ampla, backlog e roadmap
- `docs/specs/`: especificacao implementavel
- `docs-site/`: portal de documentacao em VitePress
- `platform/contracts/`: contratos canonicos dos artefatos
- `packs/`: artefatos reais publicados para os hosts
- `src/`: implementacao Node da CLI e da camada de publicacao

## Modulo de documentacao

O portal de documentacao agora vive em `docs-site/` como um modulo separado do projeto.

Scripts da raiz:

- `npm run docs:generate`
- `npm run docs:dev`
- `npm run docs:build`
- `npm run docs:preview`

## Principios

- artifact-first
- task-first
- workflow com handoff explicito
- host-agnostic no core
- host-aware na publicacao
- customizacao do usuario preservada
- sync incremental por ownership de arquivo

## Proximo passo de implementacao

1. consolidar contratos canonicos
2. validar artefatos
3. publicar `engineering-base`
4. adicionar camada de publicacao para hosts
5. evoluir CLI Node de install/sync/validate
