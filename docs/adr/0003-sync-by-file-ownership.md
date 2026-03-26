# ADR 0003 - Sync By File Ownership

## Status

Accepted

## Context

Usuarios podem adicionar customizacoes proprias apos a instalacao inicial.

## Decision

O sync do LOOPLY sera feito por ownership de arquivo, nao por merge em bloco dentro do mesmo arquivo.

## Consequences

- estrategia de sync fica mais previsivel
- customizacao local fica mais segura
- publicacao incremental fica mais simples de explicar e manter
