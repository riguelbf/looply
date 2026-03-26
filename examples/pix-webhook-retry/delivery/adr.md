# ADR

## Context

Precisamos adicionar retry automatico no fluxo de webhook PIX sem acoplar a logica ao handler principal nem quebrar o contrato atual.

## Options

1. implementar retries diretamente no handler de webhook
2. extrair politica de retry para componente dedicado e persistir tentativas
3. empurrar tudo para DLQ desde a primeira iteracao

## Decision

Escolher a opcao 2: politica dedicada de retry com persistencia minima e reaproveitamento do scheduler atual.

## Consequences

- melhora separacao de responsabilidades
- reduz risco de acoplamento no handler principal
- deixa caminho aberto para evoluir para DLQ depois
