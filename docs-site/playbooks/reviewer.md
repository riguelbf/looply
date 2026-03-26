# Playbook: Reviewer

Este playbook cobre review, fechamento de gates e readiness para release.

## Quando voce entra

- a implementacao ja aconteceu
- existe contexto de entrega suficiente para review
- a feature precisa de validacao antes de liberar release

## Workflow principal

- `story-to-production`

## Seu foco

- revisar qualidade e riscos
- validar aderencia ao design
- consolidar `review-report`
- preparar `release-plan`

## Outputs esperados

- `review-report`
- `release-plan`

## Gates que voce ajuda a liberar

- `implementation-reviewed`
- `release-ready`

## O que olhar

- [Reviewer](/reference/generated/agents/reviewer)
- [review-code](/reference/generated/tasks/review-code)
- [publish-service](/reference/generated/tasks/publish-service)
- [review-report-template](/reference/generated/templates/review-report-template)
- [release-plan-template](/reference/generated/templates/release-plan-template)
- [definition-of-done](/reference/generated/checklists/definition-of-done)

## Como saber se concluiu

- riscos e pendencias estao explicitados
- qualidade minima foi validada
- existe plano claro para liberar a entrega

## Retomada

Se precisar reconciliar o estado:

```text
/looply:next <feature-name>
/looply:workflow-status <feature-name>
```
