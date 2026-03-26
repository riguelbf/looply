<p align="center">
  <img src="./assets/looply-banner.svg" alt="Looply" width="760" />
</p>

# Looply AI OS

`looply` e a CLI do produto **Looply AI OS**.

Plataforma de artefatos para engenharia com IA assistida. O `looply` organiza `agents`, `tasks`, `workflows`, `knowledge`, `templates`, `checklists` e contexto operacional em Markdown, publica isso para hosts como `Codex` e `Claude Code`, e ajuda o time a sair de discovery ate delivery com um fluxo consistente.

## Onde paramos

O estado versionado do projeto fica em [PROJECT_STATUS.md](./PROJECT_STATUS.md). Esse arquivo deve registrar o slice atual, o que acabou de ser concluido e o proximo passo.

## O que o looply resolve

- padroniza como a engenharia descreve discovery, planning e delivery
- publica o mesmo pack para mais de um host
- instala contexto reutilizavel por projeto ou globalmente
- preserva customizacoes do projeto em `.looply/custom`
- mantem artefatos versionados e validaveis
- organiza sessoes, retomadas, updates e status operacional

## O que existe hoje

- CLI `looply`
- portal de documentacao com `VitePress`
- pack base `engineering-base`
- suporte a `Claude Code` e `Codex`
- workflows principais:
  - `idea-to-prd`
  - `prd-to-stories`
  - `story-to-production`
  - `workflow-status`
- agentes principais:
  - `pm-analyst`
  - `architect`
  - `backend`
  - `reviewer`
  - `delivery-orchestrator`

## O que nao existe na v1

- runtime proprio de LLM
- automacao autonoma ponta a ponta
- execucao nativa de tasks sem host
- SaaS ou painel web de operacao

## Instalacao para desenvolvimento

Requisitos:

- Node.js 22+
- npm
- `codex` e/ou `claude` instalados se voce quiser publicar para esses hosts

Clone o projeto e prepare a CLI:

```bash
git clone git@github.com:riguelbf/looply.git
cd looply
npm install
npm run build
npm link
```

Depois disso, o comando `looply` fica disponivel no shell.

Se preferir sem `npm link`, voce pode usar:

```bash
node ./bin/run.js --help
```

## Instalando o looply em um projeto existente

Dentro do projeto alvo, rode:

```bash
looply install \
  --host codex,claude \
  --scope project \
  --pack engineering-base \
  --locale pt-BR \
  --project-mode existing-project \
  --interaction-mode balanced
```

O comando acima:

- instala o pack `engineering-base`
- publica para `Codex` e `Claude Code`
- grava estado em `.looply/`
- preserva espaco de customizacao em `.looply/custom/`
- considera o codebase local como base principal quando o projeto ja existe

Se quiser um fluxo guiado, basta rodar:

```bash
looply install
```

## Primeiros comandos uteis

```bash
looply validate
looply doctor --host codex,claude --scope project
looply refresh-context
looply status
looply list workflow
looply inspect workflow idea-to-prd
looply docs open
```

## Como usar os workflows

### Claude Code

O Claude recebe comandos publicados em `.claude/commands`. Os aliases principais sao:

- `/looply:help`
- `/looply:idea-to-prd`
- `/looply:prd-to-stories`
- `/looply:story-to-production`
- `/looply:workflow-status`
- `/looply:resume`
- `/looply:next`

Exemplo:

```text
/looply:idea-to-prd pix-webhook-retry "falhas transientes no webhook PIX geram conciliacao manual" "manter compatibilidade com contrato atual"
```

### Codex

No Codex, o `looply` publica convencoes operacionais, playbooks, entrypoints e skills por meio de:

- `AGENTS.md`
- `LOOPLY_COMMANDS.md`
- `.agents/skills/*`
- `.looply/state/commands/codex/`

O caminho recomendado no Codex agora e:

- usar `AGENTS.md` como contrato raiz
- usar `LOOPLY_COMMANDS.md` como indice operacional
- usar as skills geradas em `.agents/skills/` para descoberta e invocacao explicita
- abrir `/skills` e procurar por `looply` quando o usuario nao souber qual workflow usar
- começar por `$looply` como skill de descoberta e roteamento

## Fluxo recomendado da v1

1. `idea-to-prd`
2. `prd-to-stories`
3. `story-to-production`
4. `workflow-status`

Exemplo de sequencia:

```text
/looply:idea-to-prd pix-webhook-retry "falhas transientes no webhook PIX geram conciliacao manual"
/looply:prd-to-stories pix-webhook-retry prd-pix-webhook-retry
/looply:story-to-production pix-webhook-retry story-01-retry-automatico
/looply:workflow-status pix-webhook-retry
```

## Modos operacionais

### `project-mode`

- `existing-project`: usa o codebase local como fonte principal de verdade
- `greenfield`: trabalha mais a partir de artefatos e premissas explicitas

### `interaction-mode`

- `guided`: pergunta mais antes de avancar
- `balanced`: equilibra autonomia e confirmacoes
- `autonomous`: evita clarificacoes repetidas e avanca quando o contexto estiver suficiente

### `locale`

- `pt-BR`
- `en`

O idioma e persistido na instalacao e influencia o output esperado do host.

## Estado e arquivos gerados

O `looply` organiza o estado do projeto em:

```text
.looply/
  managed/
  state/
  custom/
```

Arquivos importantes:

- `.looply/state/install-manifest.json`
- `.looply/state/execution-hints.json`
- `.looply/state/locale.json`
- `.looply/state/project-context.json`
- `.looply/state/interaction-policy.json`
- `.looply/state/context-index.md`
- `.looply/state/project-inventory.md`
- `.looply/custom/project-context.md`
- `.looply/custom/session-context.md`
- `.looply/custom/features/<feature>/workflow-status.md`

## Comandos principais da CLI

- `looply init`
- `looply install`
- `looply uninstall`
- `looply reinstall`
- `looply refresh-context`
- `looply validate`
- `looply doctor`
- `looply status`
- `looply sync`
- `looply check-updates`
- `looply upgrade`
- `looply history`
- `looply sessions`
- `looply integrations`
- `looply docs`

Veja todos:

```bash
looply --help
looply docs --help
looply integrations --help
```

## Documentacao

O portal vive em `docs-site/` e pode ser aberto localmente com:

```bash
looply docs open
```

Outros comandos:

```bash
looply docs generate
looply docs build
looply docs serve
```

## Estrutura do projeto

```text
looply/
  assets/
  bin/
  docs/
    adr/
    releases/
    specs/
  docs-site/
    .vitepress/
    guides/
    overview/
    playbooks/
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

- `idea.md`: visao ampla e roadmap
- `docs/specs/`: especificacao implementavel
- `docs/releases/`: cortes planejados de evolucao do produto
- `docs-site/`: documentacao para usuarios da ferramenta
- `platform/contracts/`: contratos canonicos
- `packs/`: artefatos publicados para os hosts
- `src/`: implementacao da CLI e da camada de publicacao

## Stack

- Node.js
- TypeScript
- Commander
- @clack/prompts
- Zod
- gray-matter
- fs-extra
- globby
- VitePress

## Principios

- artifact-first
- task-first
- workflow com handoff explicito
- host-agnostic no core
- host-aware na publicacao
- codebase-first em projetos existentes
- customizacao do usuario preservada
- sync incremental por ownership de arquivo

## Scripts de desenvolvimento

```bash
npm run typecheck
npm run build
npm run docs:generate
npm run docs:check
npm run docs:build
```
