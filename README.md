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
- companion desktop local para leitura, status, features, hosts, integrations e retomada
- portal de documentacao com `VitePress`
- pack base `engineering-base`
- pack agregador `software-delivery-suite`
- suporte a `Claude Code` e `Codex`
- `refresh-context` e `refresh-code-context` para atualizar contexto do projeto e code-context
- `status` consolidado com snapshots, features, sessoes, hosts e ICL
- `autonomy` para derivar o proximo ciclo host-driven de uma feature
- `icl` para gerir example guidance dos workflows
- `integrations` para expor contextos e touchpoints de integracoes conhecidas
- `replay`, `run-task`, `run-agent`, `reconcile`
- `list` e `inspect` para descoberta de workflows
- `cli-autocomplete` baseado na arvore real do Commander
- workflows principais:
  - `idea-to-prd`
  - `prd-to-stories`
  - `story-to-production`
  - `workflow-status`
  - `cloud-workload-design`
  - `platform-foundation-evolution`
- agentes disponiveis:
  - `delivery-orchestrator`
  - `pm-analyst`
  - `architect`
  - `cloud-architect`
  - `platform-engineer`
  - `cloud-governance`
  - `finops`
  - `backend`
  - `frontend`
  - `reviewer`
  - `devops`
  - `sre`

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
  --pack software-delivery-suite \
  --locale pt-BR \
  --project-mode existing-project \
  --interaction-mode balanced
```

O comando acima:

- instala o pack `software-delivery-suite`
- publica para `Codex` e `Claude Code`
- grava estado em `.looply/`
- preserva espaco de customizacao em `.looply/custom/`
- considera o codebase local como base principal quando o projeto ja existe
- habilita `ICL example guidance` por padrao para calibrar estilo e qualidade dos outputs do host
- publica o contexto necessario para `Codex`, `Claude Code` e o desktop local consumirem o mesmo estado

Se quiser um fluxo guiado, basta rodar:

```bash
looply install
```

## Primeiros comandos uteis

```bash
looply validate
looply doctor --host codex,claude --scope project
looply refresh-context
looply refresh-code-context
looply autonomy pix-webhook-retry
looply icl status
looply icl set reduced
looply status
looply status --json
looply replay pix-webhook-retry --from tech-spec
looply run-task pix-webhook-retry review-code
looply run-agent pix-webhook-retry architect --task create-tech-spec
looply reconcile pix-webhook-retry
looply list workflow
looply inspect workflow idea-to-prd
looply docs open
```

## Desktop local

O desktop local e um companion do `looply`, nao uma substituicao da CLI.

Ele hoje serve para:

- ver o snapshot do projeto e as features ativas
- navegar hosts, integrations e status
- abrir detalhes de workflow e retomada
- disparar acoes controladas de workflow quando necessario

O contrato principal do desktop continua sendo ler snapshots e contexto persistido do core, sem duplicar regras de negocio.

## Host Contract

O arquivo [HOST_CONTRACT.md](./HOST_CONTRACT.md) descreve o protocolo de autonomia que o host deve seguir.

Ele complementa `AGENTS.md`, `LOOPLY_COMMANDS.md` e o workflow playbook com um ciclo curto:

1. ler snapshot e estado persistido
2. escolher uma unica acao
3. executar uma etapa pequena
4. verificar o resultado
5. persistir o novo estado
6. repetir ou bloquear

## ICL example guidance

O `looply` agora suporta uma camada explicita de `ICL` usando exemplos curados publicados junto com os packs.

Esses exemplos:

- calibram estilo, densidade e qualidade dos outputs
- nao substituem `workflow-status`, templates, checklists ou o codebase real
- sao selecionados em quantidade pequena por workflow
- ficam ligados por padrao

Modos disponiveis:

- `on`: usa a selecao normal de exemplos curados
- `reduced`: usa menos exemplos para reduzir peso de contexto
- `off`: remove referencias de exemplos do material publicado para host

Comandos uteis:

```bash
looply icl status
looply icl set on
looply icl set reduced
looply icl set off
looply icl set off --scope global
```

Use `reduced` ou `off` quando quiser investigar se a latencia do workflow esta sendo impactada por guidance adicional no host.

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
- usar `\$looply:<workflow>` para chamar workflows diretamente no Codex
- usar `\$looply:cloud-workload-design` e `\$looply:platform-foundation-evolution` quando o problema principal for cloud ou plataforma

## Fluxo recomendado da v1

1. `idea-to-prd`
2. `prd-to-stories`
3. `story-to-production`
4. `workflow-status`

## Intervencoes controladas no workflow

O `looply` agora suporta desvios controlados sem perder o estado principal da feature.

Isso cobre tres casos comuns:

- `replay`: voltar para um stage, agent, task ou artifact anterior
- `run-task`: registrar execucao manual de uma task em qualquer ponto
- `run-agent`: registrar uma intervencao manual de um agente em qualquer ponto

Exemplos:

```bash
looply replay pix-webhook-retry --from tech-spec --reason "refinar spec para incluir fila"
looply run-task pix-webhook-retry review-code --reason "pedir review antecipado"
looply run-agent pix-webhook-retry architect --task create-tech-spec --reason "ajustar design"
looply reconcile pix-webhook-retry
```

O estado da feature preserva:

- ponto de replay
- intervencoes manuais
- outputs `superseded`
- caminho de recuperacao recomendado

Use `looply status` ou `looply status --json` para ver esse estado reconciliado.
O `status` tambem mostra o modo efetivo de `ICL`, a origem da politica e a contagem de exemplos disponiveis e selecionados.

## Fluxos avancados

Quando o problema principal nao e discovery ou delivery de uma story, o `looply` tambem suporta:

- `cloud-workload-design`
  use quando a decisao principal envolve topologia cloud, async-first, filas, governanca ou custo de workload
- `platform-foundation-evolution`
  use quando a decisao principal envolve foundation compartilhada, guardrails, pipelines, identidade ou observabilidade padrao

Exemplos:

```text
/looply:cloud-workload-design pix-webhook-retry payments-api "introduzir fila para retries e revisar postura cloud"
/looply:platform-foundation-evolution platform-observability-baseline "padronizar tracing, logging e guardrails de deploy"
```

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

### `icl example guidance`

- `on`: padrao do projeto quando nao existe override
- `reduced`: reduz o guidance publicado para o host
- `off`: desliga referencias de exemplos sem remover o restante do workflow

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
- `.looply/state/context-snapshot.json`
- `.looply/state/project-snapshot.json`
- `.looply/state/project-inventory.md`
- `.looply/custom/project-context.md`
- `.looply/custom/architecture-context.md`
- `.looply/custom/session-context.md`
- `.looply/custom/features/<feature>/workflow-status.md`
- `.looply/custom/features/<feature>/workflow-control.json`

O comando `looply refresh-context` agora atualiza:

- `project-context.md`
- `architecture-context.md`
- `project-inventory.md`
- `context-snapshot.json`

O comando `looply status` agora tambem pode materializar e imprimir:

- `project-snapshot.json`
- um resumo operacional legivel no terminal
- um snapshot normalizado em JSON com `looply status --json`

Para projetos existentes, esses arquivos funcionam como aceleradores de contexto. O codebase real continua sendo a fonte principal de verdade.

## O que o `refresh-context` tenta inferir melhor agora

- linguagens e frameworks
- modulos e diretorios principais
- API surface e contratos
- banco, persistencia e migracoes
- autenticacao e controle de acesso
- mensageria, filas e workers
- observabilidade, automacao e sinais de infra

Esses sinais continuam heuristicas. Para projeto existente, o repositorio real continua sendo a fonte principal de verdade.

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
- `looply completion`

Veja todos:

```bash
looply --help
looply docs --help
looply integrations --help
looply completion --help
```

## Autocomplete do shell

O `looply` agora pode gerar autocomplete para `bash`, `zsh` e `PowerShell` a partir da arvore real da CLI.

Gerar o script:

```bash
looply completion bash
looply completion zsh
looply completion powershell
```

Ver as instrucoes de instalacao:

```bash
looply completion install bash
looply completion install zsh
looply completion install powershell
```

Instalar e habilitar automaticamente:

```bash
looply completion install zsh --enable
looply completion install bash --enable
looply completion install powershell --enable
```

Durante `looply install`, a CLI tambem pode perguntar se deve habilitar autocomplete no shell atual. Com `--yes`, o `looply` tenta habilitar automaticamente quando o shell atual for suportado.

## Documentacao

O portal vive em `docs-site/` e pode ser aberto localmente com:

```bash
looply docs open
```

Por padrao, `looply docs open` prioriza um servidor local em `127.0.0.1` para uma experiencia mais confiavel no browser. Se a build ainda nao existir, o comando gera a documentacao antes de abrir.

Outros comandos:

```bash
looply docs generate
looply docs build
looply docs serve
```

## GitHub Pages

O repositorio ja possui pipeline para publicar a documentacao no GitHub Pages a cada push na `main`:

- workflow: `.github/workflows/docs-pages.yml`
- base publica: `/looply/`
- artefato publicado: `docs-site/.vitepress/dist`

Para o deploy funcionar no GitHub:

1. abra `Settings > Pages`
2. selecione `Build and deployment`
3. escolha `GitHub Actions`

Depois disso, cada push na `main` publica a docs automaticamente.

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
