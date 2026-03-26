# CLI

Esta secao organiza a CLI do looply em grupos. A CLI cuida de instalacao, manutencao, diagnostico e documentacao da plataforma. A execucao operacional dentro do host acontece pelos slash commands e pelos artefatos publicados.

## Setup

- `init`
- `install`
- `uninstall`
- `reinstall`

## Operacao

- `sync`
- `doctor`
- `validate`
- `check-updates`
- `upgrade`
- `history`

## Descoberta

- `list`
- `inspect`
- `sessions`
- `integrations`
- `docs`

## Fluxo de uso recomendado

1. `install`
2. `validate`
3. `doctor`
4. usar slash commands no host
5. `sync` ou `upgrade` quando o pack evoluir

## Onde olhar depois

- [Slash Commands](/guides/slash-commands)
- [Hosts Suportados](/guides/hosts)
- [Referencia completa dos comandos](/reference/generated/commands)

## Scripts do modulo de docs

Da raiz do projeto:

```bash
npm run docs:dev
npm run docs:build
```
