# Hosts Suportados

looply hoje publica artefatos para dois hosts:

- `Codex`
- `Claude Code`

## O que e igual nos dois

- ambos consomem os artefatos do pack `engineering-base`
- ambos recebem instrucoes de contexto, workflow, agentes, tasks e politica operacional
- ambos podem seguir os aliases operacionais `looply:*`
- ambos devem respeitar `project-mode`, `interaction-mode` e `locale`

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

## Como pensar o uso

- se voce quer a experiencia mais direta com slash commands, `Claude Code` hoje fica mais natural
- se voce esta em `Codex`, trate `AGENTS.md` como contrato raiz, `LOOPLY_COMMANDS.md` como indice e `.agents/skills` como camada oficial de extensao
- para descoberta, comece em `/skills` e escolha `$looply`
- em ambos os casos, o pack, os workflows e os artefatos sao os mesmos

## Arquivos publicados por host

### Codex

- `AGENTS.md`
- `LOOPLY_COMMANDS.md`
- `.agents/skills/*`
- `.looply/state/commands/codex/*`

### Claude Code

- `CLAUDE.md`
- `.claude/commands/*`

## Quando usar os dois

Use `--host codex,claude` quando:

- o time alterna entre hosts
- o projeto tem usuarios com preferencias diferentes
- voce quer manter a mesma base operacional para ambos

## Proximo passo

- veja [Comportamento dos Hosts](/guides/host-behavior)
- veja [Slash Commands](/guides/slash-commands)
- veja [Catalogo do Engineering Base](/guides/catalog)
