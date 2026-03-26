# Integracoes

## O que existe hoje

looply suporta `integration context` como artefato Markdown.

## Estrutura

- `.looply/custom/integrations/integrations-index.md`
- `.looply/custom/integrations/<integration>.md`
- `.looply/custom/integrations/templates/integration-context.template.md`

## Comandos

```bash
looply integrations list
looply integrations add stripe
looply integrations configure stripe
```

## Evolucao prevista

- `integration context`: ativo agora
- `integration adapter`: reservado para execucao futura
- `integration secrets/config`: reservado para operacao segura futura

