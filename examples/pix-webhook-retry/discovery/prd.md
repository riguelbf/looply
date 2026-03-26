# PRD

## Problem

Pagamentos PIX confirmados podem nao refletir no sistema quando o webhook falha uma unica vez por indisponibilidade temporaria.

## Business Goal

Melhorar a confiabilidade da confirmacao financeira sem exigir acao manual do time de operacoes.

## Success Metrics

- reduzir em 80% os casos de conciliacao manual ligados a falha transiente de webhook
- manter a taxa de confirmacao automatica acima de 99,5%

## Scope

- identificar falhas transientes de entrega
- executar retry automatico
- registrar tentativas e metricas basicas

## Non Scope

- redesign completo do pipeline de pagamentos
- DLQ na primeira iteracao
- painel operacional dedicado

## Personas Or Actors

- cliente final
- time financeiro
- sistema de pagamentos
- time de operacoes

## User Journey

1. o provedor confirma o pagamento
2. a entrega do webhook falha temporariamente
3. o sistema agenda uma nova tentativa
4. a confirmacao e processada com sucesso
5. o time financeiro nao precisa atuar manualmente

## Business Rules

- retry so deve ocorrer para erros transientes
- o fluxo nao pode duplicar confirmacao de negocio
- tentativas devem respeitar limite configuravel

## Risks

- duplicidade por falha de idempotencia
- retries excessivos em ambiente degradado
- falta de observabilidade para entender falhas repetidas

## Dependencies

- scheduler/job runner
- persistencia de tentativas
- logs e metricas

## Open Questions

- politica maxima de retry por tenant
- intervalo inicial de backoff
- exposicao de status de retries para operacoes

## Candidate Stories

- story 1: registrar tentativa e reagendar retry
- story 2: garantir idempotencia da confirmacao
- story 3: adicionar metricas e alertas

## Delivery Entry Criteria

- PRD aprovado pelo PM analyst
- regras de negocio e sucesso definidos
- backlog inicial de stories pronto
