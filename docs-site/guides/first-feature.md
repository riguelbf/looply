# Primeira Feature

Este guia mostra o caminho minimo para testar uma feature ponta a ponta no looply, usando os tres workflows principais.

## 1. Preparar o projeto

No repositorio alvo:

```bash
looply install --host codex,claude --scope project --pack software-delivery-suite --project-mode existing-project --interaction-mode autonomous --locale pt-BR --yes
looply validate
looply doctor --host codex,claude --scope project
```

## 2. Iniciar discovery

No host:

```text
/looply:idea-to-prd pix-webhook-retry "falhas transientes no webhook PIX geram reconciliacao manual" "manter compatibilidade com contrato atual"
```

### O que esperar

- entendimento do problema
- consolidacao de `requirement-brief`
- geracao de `PRD`
- gate de discovery pronto para delivery planning

## 3. Quebrar o PRD em stories

No host:

```text
/looply:prd-to-stories pix-webhook-retry prd-pix-webhook-retry
```

### O que esperar

- backlog de stories
- separacao de slices menores
- indicacao de qual story seguir primeiro

## 4. Entrar em delivery

Escolha uma story e rode:

```text
/looply:story-to-production pix-webhook-retry story-01-retry-automatico
```

### O que esperar

- `tech-spec`
- `ADR`
- implementacao
- `review-report`
- `release-plan`

## 5. Retomar quando parar

Se a sessao foi interrompida:

```text
/looply:workflow-status pix-webhook-retry
/looply:resume pix-webhook-retry backend-afternoon
/looply:next pix-webhook-retry backend-afternoon
```

## 6. Onde olhar no projeto

- `.looply/custom/features/<feature-name>/workflow-status.md`
- `.looply/custom/project-context.md`
- `.looply/custom/session-context.md`
- `.looply/custom/session-links.json`

## Artefatos principais do fluxo

- `prd`
- `story-backlog`
- `story`
- `tech-spec`
- `adr`
- `implementation-summary`
- `review-report`
- `release-plan`

## Dicas praticas

- em `existing-project`, o host deve usar o codebase real como base principal
- use `workflow-status` sempre que houver duvida sobre onde o trabalho parou
- instale para `codex,claude` se o time alterna entre hosts

## Referencia complementar

- [Slash Commands](/guides/slash-commands)
- [Fluxo de Workflows](/guides/workflows)
- [Catalogo do Engineering Base](/guides/catalog)
- [Knowledge](/reference/generated/knowledge)
- [Templates](/reference/generated/templates)
