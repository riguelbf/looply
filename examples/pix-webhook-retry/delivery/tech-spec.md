# Tech Spec

## Context

O projeto ja possui processamento de webhook PIX, mas sem politica explicita de retry para falhas transientes.

## Goal

Introduzir retry automatico com persistencia minima, idempotencia e observabilidade basica.

## Scope

- classificar falhas transientes de entrega
- persistir tentativas
- reagendar retries via scheduler existente
- emitir metricas basicas

## Architecture

- adicionar tabela ou store de tentativas com `payment_id`, `event_type`, `attempt_count`, `next_retry_at`
- encapsular a politica de retry em um componente proprio
- reaproveitar scheduler atual para enfileirar nova tentativa
- validar idempotencia antes de reaplicar confirmacao

## Risks

- scheduler atual nao suportar granularidade desejada
- classificacao de erro ficar espalhada em varios pontos
- retries repetidos mascararem falha estrutural

## Decisions

- primeira iteracao com backoff fixo
- limite inicial de 3 tentativas
- idempotencia obrigatoria antes da reaplicacao
