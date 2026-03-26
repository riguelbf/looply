# ADR 0001 - Artifact First

## Status

Accepted

## Context

O valor principal do LOOPLY esta nos artefatos que os hosts consomem, e nao em um runtime proprio.

## Decision

Tasks, workflows, agents, squads, templates e knowledge serao representados como arquivos Markdown com frontmatter.

## Consequences

- o core fica host-agnostic
- distribuicao e validacao ficam mais simples
- o projeto pode integrar com varios hosts
- execucao fica delegada ao host
