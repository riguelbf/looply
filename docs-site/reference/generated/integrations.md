# Integracoes

Esta secao documenta o modelo de `integration context` do looply.

## Estrutura esperada

- `.looply/custom/integrations/integrations-index.md`
- `.looply/custom/integrations/<integration>.md`
- `.looply/custom/integrations/templates/integration-context.template.md`
- `.looply/custom/integrations/adapters/README.md`
- `.looply/custom/integrations/secrets/README.md`

## Responsabilidades

- `integration context`: contexto para raciocinio do host
- `integration adapter`: reservado para execucao futura
- `integration secrets/config`: reservado para operacao segura futura

## CLI

- `looply integrations list`
- `looply integrations add [name]`
- `looply integrations configure <name>`

## Como o host deve consumir

- abrir primeiro o `integrations-index.md`
- localizar a integracao citada na feature
- abrir o arquivo da integracao
- validar no codebase se o contexto estiver `draft`, `stale` ou incompleto
