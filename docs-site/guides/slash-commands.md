# Slash Commands

Os slash commands sao a entrada mais direta para usar os workflows do looply dentro do host.

## Comandos principais

### `/looply:idea-to-prd`

Inicia discovery a partir de uma ideia bruta e consolida um PRD aprovado.

Exemplo:

```text
/looply:idea-to-prd pix-webhook-retry "falhas transientes no webhook PIX geram reconciliacao manual" "manter compatibilidade com contrato atual"
```

### `/looply:prd-to-stories`

Converte um PRD consolidado em backlog de stories.

Exemplo:

```text
/looply:prd-to-stories pix-webhook-retry prd-pix-webhook-retry
```

### `/looply:story-to-production`

Leva uma story selecionada por design tecnico, implementacao, review e release.

Exemplo:

```text
/looply:story-to-production pix-webhook-retry story-01-retry-automatico
```

### `/looply:workflow-status`

Mostra onde o trabalho parou, quais artefatos faltam e qual e o proximo passo.

Exemplo:

```text
/looply:workflow-status pix-webhook-retry
```

## Aliases de retomada

- `/looply:resume`
- `/looply:next`

Use quando:

- ha varias sessoes abertas
- voce quer retomar uma feature do ponto certo
- precisa descobrir o proximo agente, task ou gate

Exemplo:

```text
/looply:resume pix-webhook-retry backend-afternoon
/looply:next pix-webhook-retry backend-afternoon
```

## Help embutido

Voce pode pedir ajuda assim:

```text
/looply:help
/looply:help idea-to-prd
/looply:idea-to-prd help
```

## Como escolher o comando certo

- ainda nao existe PRD: use `idea-to-prd`
- ja existe PRD aprovado: use `prd-to-stories`
- ja existe story selecionada: use `story-to-production`
- precisa retomar ou entender proximo passo: use `workflow-status`, `resume` ou `next`

## Referencia detalhada

- [Referencia completa dos slash commands](/reference/generated/slash-commands)
- [Fluxo de Workflows](/guides/workflows)
