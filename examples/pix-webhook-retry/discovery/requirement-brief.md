# Requirement Brief

## Problem

Confirmacoes de pagamento PIX podem falhar quando a entrega do webhook sofre erro transiente. Hoje isso gera atraso operacional e conciliacao manual.

## Goal

Reduzir perda de confirmacao automatica e diminuir trabalho manual do time financeiro.

## Scope

- detectar falhas transientes de entrega
- registrar tentativas de retry
- reagendar a entrega com politica inicial simples

## Open Questions

- qual limite maximo de retry por tenant?
- o retry precisa de backoff exponencial na primeira iteracao?
- precisamos expor o status de retries para operacoes?

## Risks

- duplicidade de efeito de negocio sem idempotencia
- ruido operacional se o retry gerar alertas demais
- classificacao incorreta de falha permanente como transiente
