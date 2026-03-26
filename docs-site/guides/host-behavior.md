# Comportamento dos Hosts

Esta pagina descreve como `Codex` e `Claude Code` devem se comportar depois que o looply foi instalado no projeto.

## Regras base

Independentemente do host:

- usar os artefatos do pack instalado como base operacional
- respeitar `project-mode`, `interaction-mode` e `locale`
- usar `workflow-status` para retomada e reconciliacao
- seguir `agents`, `tasks`, `workflows`, `templates`, `knowledge` e `checklists`

## Project Mode

### `existing-project`

Este e o modo mais importante para repositorios que ja existem.

O host deve:

- tratar o codebase real como fonte principal de verdade
- usar os arquivos de contexto do looply como aceleradores
- validar no codebase sempre que contexto estiver `empty`, `draft`, `stale` ou inconsistente
- assumir a pasta atual do projeto como contexto padrao, salvo indicacao diferente do usuario

Prioridade pratica:

1. `workflow-status.md`
2. `feature-context` quando existir
3. `project-context.md` quando estiver valido
4. codebase real

### `greenfield`

O host deve:

- confiar mais nos artefatos e no input do usuario
- explicitar assuncoes quando o contexto ainda nao existe
- usar o codebase somente quando ele passar a existir

## Interaction Mode

### `guided`

Use quando o usuario quer confirmar passo a passo.

O host deve:

- perguntar mais
- explicitar alternativas
- confirmar antes de avancar em mudancas mais relevantes

### `balanced`

Use quando o usuario quer autonomia moderada.

O host deve:

- seguir com os proximos passos obvios
- perguntar apenas quando houver ambiguidade real ou risco relevante

### `autonomous`

Use quando o usuario quer menos interrupcao.

O host deve:

- evitar perguntas repetidas
- seguir o fluxo com base no codebase e nos artefatos
- parar apenas em mudancas destrutivas, ambiguidade critica ou bloqueios reais

## Locale

O pack continua canonico, mas o host deve usar o locale configurado para:

- respostas da conversa
- `PRD`
- `stories`
- `workflow-status`
- demais outputs do workflow

Exemplo:

- `--locale pt-BR`: outputs e conversa em portugues
- `--locale en`: outputs e conversa em ingles

## Multiplas Sessoes

Quando houver duas ou mais sessoes abertas:

- o estado principal continua por feature
- o host deve usar `session-label` para distinguir trilhas paralelas
- o arquivo `.looply/custom/session-links.json` conecta sessao, feature e ultimo comando

Comandos principais:

```text
/looply:workflow-status <feature-name> [session-label]
/looply:resume <feature-name> [session-label]
/looply:next <feature-name> [session-label]
```

## Como isso aparece em cada host

### Codex

- consome `AGENTS.md` como surface principal
- usa `LOOPLY_COMMANDS.md` como indice operacional
- trata `/looply:*` como alias operacional documentado

### Claude Code

- consome `CLAUDE.md`
- publica comandos em `.claude/commands`
- usa os slash commands do looply de forma mais direta

## O que o usuario deve esperar

Em `existing-project` com `autonomous`:

- menos perguntas
- mais leitura do codebase real
- uso de `workflow-status` para retomada
- sugerir proximo agente, task e gate sem precisar reexplicar tudo

Em `greenfield` com `guided`:

- mais perguntas de escopo
- mais uso de artefatos como base
- mais explicacao de assuncoes e proximos passos

## Arquivos que mais influenciam o host

- `.looply/state/project-context.json`
- `.looply/state/interaction-policy.json`
- `.looply/state/locale.json`
- `.looply/custom/project-context.md`
- `.looply/custom/session-context.md`
- `.looply/custom/features/<feature-name>/workflow-status.md`

## Onde continuar

- [Hosts Suportados](/guides/hosts)
- [Slash Commands](/guides/slash-commands)
- [Primeira Feature](/guides/first-feature)
