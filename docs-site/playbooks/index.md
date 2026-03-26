# Playbooks

Os playbooks organizam o uso do looply por papel operacional. A ideia aqui nao e explicar cada artefato isoladamente, e sim mostrar como cada pessoa entra no fluxo, quais comandos usa e quais outputs precisa produzir.

## Escolha seu ponto de entrada

### PM Analyst

Use este playbook quando o trabalho ainda esta em discovery e precisa sair de ideia ou problema para um PRD aprovado.

[Abrir playbook do PM Analyst](/playbooks/pm-analyst)

### Architect

Use este playbook quando a story ja foi escolhida e o delivery precisa de `tech-spec` e `ADR`.

[Abrir playbook do Architect](/playbooks/architect)

### Backend Developer

Use este playbook quando o design tecnico ja existe e a implementacao precisa acontecer no codebase.

[Abrir playbook do Backend Developer](/playbooks/backend-developer)

### Reviewer

Use este playbook quando a entrega ja existe e precisa passar por review, quality gates e release readiness.

[Abrir playbook do Reviewer](/playbooks/reviewer)

## Mapa rapido

- discovery: `pm-analyst`
- planejamento tecnico: `architect`
- implementacao: `backend`
- review e fechamento: `reviewer`
- coordenacao transversal: `delivery-orchestrator`

## Referencia complementar

- [Catalogo do Engineering Base](/guides/catalog)
- [Slash Commands](/guides/slash-commands)
- [Fluxo de Workflows](/guides/workflows)
