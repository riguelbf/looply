# Hosts Suportados

looply hoje publica artefatos para tres hosts:

- `Codex`
- `Claude Code`
- `OpenCode`

## O que e igual em todos

- todos consomem os artefatos do pack `software-delivery-suite` ou de um pack base incluido por ele
- todos recebem instrucoes de contexto, workflow, agentes, tasks e politica operacional
- todos podem seguir os aliases operacionais `$looply:*`
- todos devem respeitar `project-mode`, `interaction-mode` e `locale`

## O que muda entre eles

### Claude Code

- suporta comandos customizados de projeto em `.claude/commands`
- os slash commands `/looply:*` aparecem de forma mais natural no host
- o uso principal para o usuario tende a ser direto via slash command

### Codex

- usa `AGENTS.md` como fonte principal de instrucao de projeto
- o publish do looply reforca aliases operacionais em `AGENTS.md` e `LOOPLY_COMMANDS.md`
- publica `skills` em `.agents/skills`
- os slash commands do looply continuam como convencao operacional documentada
- o caminho mais nativo de extensao do host passa a ser via skill
- o melhor ponto de entrada para descoberta e `/skills` seguido da skill `$looply`

### OpenCode

- usa `OPENCODE.md` como fonte principal de instrucao de projeto
- o publish do looply reforca aliases operacionais em `OPENCODE.md` e `OPENCODE_COMMANDS.md`
- publica `skills` em `.agents/skills` (formato compartilhado com Codex)
- skills sao descobertos nativamente via `available_skills` do host
- a skill `looply` funciona como entrypoint de descoberta e roteamento
- todos os 9 workflow aliases (`$looply-*`) sao expostos como skills nativos

## Como pensar o uso

- se voce quer a experiencia mais direta com slash commands, `Claude Code` hoje fica mais natural
- se voce esta em `Codex`, trate `AGENTS.md` como contrato raiz, `LOOPLY_COMMANDS.md` como indice e `.agents/skills` como camada oficial de extensao
- se voce esta em `OpenCode`, use a skill `looply` como entrypoint de descoberta e os skills individuais (`$looply-story-to-production`, etc.) para execucao direta de workflows
- para descoberta no Codex, comece em `/skills` e escolha `$looply`
- em todos os casos, o pack, os workflows e os artefatos sao os mesmos

## Arquivos publicados por host

### Codex

- `AGENTS.md`
- `LOOPLY_COMMANDS.md`
- `.agents/skills/*`
- `.looply/state/commands/codex/*`

### Claude Code

- `CLAUDE.md`
- `.claude/commands/*`

### OpenCode

- `OPENCODE.md`
- `OPENCODE_COMMANDS.md`
- `.agents/skills/*` (compartilhado com Codex)
- `.looply/state/commands/opencode/*`

## Quando usar os tres

Use `--host codex,claude,opencode` quando:

- o time alterna entre hosts
- o projeto tem usuarios com preferencias diferentes
- voce quer manter a mesma base operacional para todos

## Proximo passo

- veja [Comportamento dos Hosts](/guides/host-behavior)
- veja [Slash Commands](/guides/slash-commands)
- veja [Catalogo do Engineering Base](/guides/catalog)
