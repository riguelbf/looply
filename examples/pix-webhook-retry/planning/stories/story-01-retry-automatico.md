# Story

## Title

Retry automatico para falhas transientes de webhook PIX

## Goal

Garantir nova tentativa automatica quando a entrega do webhook falhar por erro transiente.

## Linked PRD

pix-webhook-retry-prd

## Scope

- identificar falha transiente
- registrar tentativa
- reagendar nova entrega com backoff inicial simples

## Out Of Scope

- DLQ
- dashboard operacional
- retries para falhas permanentes

## Acceptance Criteria

- quando a entrega falhar por erro transiente, uma nova tentativa deve ser agendada
- a tentativa deve ser registrada com timestamp e contador
- o fluxo nao deve duplicar confirmacao de negocio
- metricas basicas de sucesso e falha devem ser emitidas

## Dependencies

- persistencia de tentativas
- mecanismo de scheduler/job

## Technical Notes

- usar idempotencia por `payment_id + event_type`
- manter compatibilidade com o contrato atual do webhook
- iniciar com backoff fixo pequeno

## Risks

- falso positivo na classificacao de erro transiente
- duplicidade se a idempotencia falhar
