# Troubleshooting

Esta pagina cobre os problemas mais comuns no uso do looply com `Codex`, `Claude Code` e os workflows do `engineering-base`.

## O comando aparece no Claude, mas nao no Codex

### Sintoma

- `Claude Code` detecta `/looply:*`
- `Codex` nao mostra o mesmo comando como slash command nativo

### Causa

Hoje a experiencia dos hosts e diferente:

- `Claude Code` usa `.claude/commands`
- `Codex` usa `AGENTS.md`, `LOOPLY_COMMANDS.md` e `.agents/skills`

### O que fazer

1. confirme que o projeto foi instalado para `codex`
2. abra `AGENTS.md`
3. abra `LOOPLY_COMMANDS.md`
4. confira `.agents/skills`
5. rode `looply doctor --host codex --scope project`
6. no host, rode `/skills` e procure `looply`

### O que esperar

No Codex, os comandos do looply continuam funcionando como aliases operacionais documentados, mas a camada oficial de extensao do host agora fica em `.agents/skills`.

## `workflow-status` nao encontra a feature

### Sintoma

- o host nao consegue retomar a feature
- o estado salvo parece ter sumido

### O que verificar

- `.looply/custom/features/<feature-name>/workflow-status.md`
- `.looply/custom/session-links.json`

### O que fazer

1. confirme o `feature-name` usado no workflow
2. se houver varias sessoes, informe `session-label`
3. rode:

```bash
looply sessions list
```

4. no host, tente:

```text
/looply:workflow-status <feature-name>
/looply:resume <feature-name> <session-label>
```

## Existem varias sessoes abertas e nao sei qual retomar

### Sintoma

- ha duas ou mais trilhas de trabalho para a mesma feature
- ficou ambiguo qual sessao deve continuar

### O que fazer

1. liste os vinculos:

```bash
looply sessions list
```

2. ajuste o label se necessario:

```bash
looply sessions link backend-afternoon pix-webhook-retry --workflow story-to-production
```

3. retome pelo label:

```text
/looply:resume pix-webhook-retry backend-afternoon
```

## `doctor` reporta manifesto inconsistente

### Sintoma

- `doctor` informa falta de entrypoint, hints ou manifesto
- a instalacao parece parcial

### O que verificar

- `.looply/state/install-manifest.json`
- `.looply/state/execution-hints.json`
- `AGENTS.md` ou `CLAUDE.md`

### O que fazer

1. rode:

```bash
looply doctor --host codex,claude --scope project
```

2. se a instalacao estiver incompleta:

```bash
looply reinstall --host codex,claude --scope project --yes
```

3. se houver mudancas do pack:

```bash
looply check-updates --host codex,claude --scope project
looply upgrade --host codex,claude --scope project --yes
```

## O host esta perguntando demais

### Sintoma

- cada passo vira uma nova rodada de confirmacao
- o fluxo perde ritmo

### Causa provavel

- `interaction-mode` esta em `guided`
- ou o projeto esta com ambiguidade real

### O que fazer

Reinstale ou reinstale com:

```bash
looply reinstall --host codex,claude --scope project --interaction-mode autonomous --yes
```

Tambem confira [Comportamento dos Hosts](/guides/host-behavior).

## O host esta assumindo demais e ignorando contexto importante

### Sintoma

- respostas muito rápidas
- pouca validacao contra o codebase
- inferencias erradas no projeto existente

### O que verificar

- `project-mode`
- `interaction-mode`
- arquivos de contexto em `.looply/custom`

### O que fazer

1. confirme que a instalacao esta em:

- `--project-mode existing-project`

2. se precisar reduzir autonomia:

```bash
looply reinstall --host codex,claude --scope project --interaction-mode balanced --yes
```

3. valide o estado atual:

```text
/looply:workflow-status <feature-name>
```

## `install` ou `upgrade` nao refletem mudancas novas

### Sintoma

- artefatos parecem antigos
- comandos nao mudaram depois do update

### O que fazer

1. verifique mudancas:

```bash
looply check-updates --host codex,claude --scope project
```

2. aplique:

```bash
looply upgrade --host codex,claude --scope project --yes
```

3. consulte historico:

```bash
looply history --host codex
looply history --host claude
```

## A documentacao abre, mas parece antiga

### O que fazer

```bash
looply docs open --rebuild
```

Se quiser validar a referencia:

```bash
npm run docs:check
```

## Quando escalar

Considere parar e revisar a instalacao quando:

- `doctor` falha repetidamente
- o manifesto mostra host ausente ou entrypoint faltando
- o estado da feature nao bate com os artefatos existentes
- ha conflito entre sessoes paralelas e o `session-label` nao resolve

## Onde continuar

- [Hosts Suportados](/guides/hosts)
- [Comportamento dos Hosts](/guides/host-behavior)
- [Slash Commands](/guides/slash-commands)
- [Primeira Feature](/guides/first-feature)
