# Instalacao

A instalacao publica o pack no projeto ou no escopo global e prepara o host para consumir os workflows, agentes e slash commands do looply.

## Modos principais

- `project`: instala no repositorio atual
- `global`: instala no escopo do host

## Flags importantes

- `--host codex,claude`
- `--scope project|global`
- `--pack software-delivery-suite`
- `--locale pt-BR|en`
- `--project-mode existing-project|greenfield`
- `--interaction-mode guided|balanced|autonomous`

## Politica para projeto existente

Em `existing-project`, o host deve:

- usar o codebase real como fonte principal
- usar artefatos de contexto como aceleradores
- validar contexto `draft`, `stale` ou `empty` antes de confiar nele

## Publicacao por host

### Codex

- publica `AGENTS.md`
- publica `LOOPLY_COMMANDS.md`
- publica comandos e playbooks em `.looply/state`

### Claude Code

- publica `CLAUDE.md`
- publica slash commands em `.claude/commands`

## Depois da instalacao

1. rode `looply validate`
2. rode `looply doctor`
3. rode `looply refresh-context`
4. abra [Hosts Suportados](/guides/hosts)
5. inicie o fluxo com [Slash Commands](/guides/slash-commands)
