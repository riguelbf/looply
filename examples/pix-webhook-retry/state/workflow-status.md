# Workflow Status

## Summary Table

| Field | Value |
| --- | --- |
| Feature | pix-webhook-retry |
| Phase | delivery |
| Workflow | story-to-production |
| Current Stage | technical-design |
| Current Gate | design-approved |
| Active Artifact | tech-spec |
| Next Workflow | story-to-production |
| Next Agent | architect |
| Next Task | create-tech-spec |
| Ready For Next Gate | no |

## Feature

pix-webhook-retry

## Workflow

story-to-production

## Phase

delivery

## Orchestrator

delivery-orchestrator

## Project Context

### Project Mode

existing-project

### Primary Context Root

/workspace/payments

### Inference Policy

codebase-first-with-artifact-acceleration

### Context Status

active

### Context Coverage

medium

### Context Validation Notes

Project context documentado, mas a confirmacao final da implementacao depende do codebase real.

## Interaction Policy

### Interaction Mode

autonomous

### Ask When

- destructive-change
- critical-ambiguity

### Avoid Repeated Clarifications

true

## Problem Statement

Confirmacoes de pagamento PIX podem falhar quando o webhook sofre erro transiente, gerando atraso operacional e conciliacao manual.

## Business Goal

Melhorar a confiabilidade da confirmacao financeira sem exigir acao manual do time de operacoes.

## Success Metric

- reduzir em 80% os casos de conciliacao manual ligados a falha transiente de webhook
- manter confirmacao automatica acima de 99,5%

## Active Artifact

tech-spec

## Selected Story

story-01-retry-automatico

## Current Stage

technical-design

## Current Gate

design-approved

## Gate Status

- discovery-ready: passed
- planning-ready: passed
- design-approved: pending
- implementation-reviewed: pending
- release-ready: pending

## Completed Outputs

- requirement-brief
- prd
- story-backlog
- selected-story

## Missing Outputs

- tech-spec
- adr
- implementation-summary
- review-report
- release-plan

## Recommended Next Workflow

story-to-production

## Ready For Next Gate

no

## Next Agent

architect

## Next Task

create-tech-spec

## Next Handoff

architect -> backend via tech-spec

## Story Acceptance Criteria

- quando a entrega falhar por erro transiente, uma nova tentativa deve ser agendada
- a tentativa deve ser registrada com timestamp e contador
- o fluxo nao deve duplicar confirmacao de negocio
- metricas basicas de sucesso e falha devem ser emitidas

## Related Integrations

- internal-payments-api
- pix-provider-webhooks
- scheduler-jobs

## Integration Context Notes

O fluxo depende de integracao com o scheduler atual e do contrato existente do webhook PIX.

## Blocked By

- politica maxima de retry ainda nao definida
- estrategia inicial de backoff ainda nao validada

## Decision Rationale

Discovery e planning ja foram concluídos. A story foi selecionada, mas o gate `design-approved` ainda bloqueia a implementacao porque faltam `tech-spec` e `adr`.

## Open Questions

- qual limite maximo de retry por tenant?
- o backoff inicial sera fixo ou exponencial?
- precisamos expor status de retries para operacoes nesta iteracao?

## Constraints

- nao quebrar o contrato atual do webhook
- garantir idempotencia por `payment_id + event_type`
- manter a primeira iteracao pequena e observavel

## Last Updated

2026-03-26T22:30:00-03:00

## Discovery Focus

### Discovery Outcome

PRD aprovado com objetivo, escopo, riscos e metricas de sucesso definidos.

### PRD Status

approved

### Discovery Risks

- retry sem idempotencia forte
- risco de ruido operacional sem observabilidade

## Planning Focus

### Story Backlog Status

ready

### Selected Story Goal

Entregar retry automatico minimo, seguro e validavel em ambiente controlado.

### Planning Notes

Comecar pela menor slice com impacto operacional imediato.

## Delivery Focus

### Technical Design Status

in-progress

### Delivery Risks

- acoplamento excessivo ao handler atual
- scheduler sem cobertura adequada de teste

### Release Readiness Notes

Necessario fechar ADR, cobertura de teste e rollout gradual por feature flag.
