---
schema: looply/knowledge@v1
name: architecture-principles
summary: Stable architectural principles for engineering work
audience:
  - architect
  - backend
tags:
  - architecture
  - standards
---

# Architecture Principles

## Purpose

Fornecer principios estruturais estaveis para evoluir o sistema sem degradar clareza, ownership e operabilidade.

## Guidance

- explicitar trade-offs antes de ampliar a complexidade estrutural
- preservar clareza de fronteiras entre transporte, aplicacao, dominio, persistencia e integracoes
- preferir fluxo simples e composicao pequena antes de criar camadas abstratas sem pressao real
- manter contratos de entrada e saida versionaveis e verificaveis
- isolar dependencias de infraestrutura para permitir teste e evolucao de comportamento
- evitar acoplamento ciclico entre modulos, servicos ou bounded contexts
- modelar falhas como parte do desenho: validacao, retries, timeouts, idempotencia e observabilidade
- registrar decisoes estruturais quando a mudanca afetar ownership, contrato, persistencia ou rollout

## Examples

- bom sinal: controller recebe input, delega ao caso de uso e traduz erro para resposta
- mau sinal: regra de negocio espalhada em controller, repository e job ao mesmo tempo
- bom sinal: integracao externa encapsulada com contrato local e tratamento de falha conhecido
- mau sinal: chamadas HTTP dispersas diretamente em varios modulos do dominio

## References

- `coding-standards`
- ADRs relevantes da feature
