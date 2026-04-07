# icl

Controla a camada de `ICL example guidance` do Looply.

## O que faz

Permite inspecionar e alterar o modo efetivo de exemplos curados que o Looply publica para os hosts.

## Subcomandos

### `looply icl status`

Mostra:

- modo efetivo atual
- origem da politica (`project`, `global` ou `default`)
- arquivo de politica do projeto
- arquivo de politica global

Exemplo:

```bash
looply icl status
looply icl status --json
```

### `looply icl set <mode>`

Define o modo de guidance para `project` ou `global`.

Modos:

- `on`
- `reduced`
- `off`

Exemplo:

```bash
looply icl set on
looply icl set reduced
looply icl set off --scope global
```

## Quando usar

- quando quiser reduzir ou remover guidance adicional para medir impacto no workflow
- quando quiser reativar exemplos curados depois de troubleshooting
- quando quiser padronizar o comportamento em escopo de projeto ou global

## Observacoes

- `on` e o default quando nao existe politica explicita
- `reduced` mantem algum guidance com menor peso de contexto
- `off` remove referencias de exemplos do material publicado para host
