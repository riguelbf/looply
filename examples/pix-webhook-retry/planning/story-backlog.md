# Story Backlog

## Story Order

1. `story-01-retry-automatico`
2. `story-02-idempotencia-confirmacao`
3. `story-03-observabilidade-retries`

## Story 1

- titulo: retry automatico para falhas transientes de webhook PIX
- objetivo: reagendar uma nova tentativa com persistencia minima e sem mudar contrato externo
- valor: reduz conciliacao manual rapidamente com risco controlado

## Story 2

- titulo: reforcar idempotencia da confirmacao PIX
- objetivo: garantir que retries repetidos nao dupliquem efeito de negocio
- valor: reduz risco operacional da primeira story

## Story 3

- titulo: metricas e alertas basicos de retries
- objetivo: dar visibilidade operacional sobre sucesso, falha e esgotamento de retries
- valor: melhora operacao e readiness para rollout

## Notes

- comecar pela menor entrega que ja reduza conciliacao manual
- manter cada story pequena e validavel isoladamente
