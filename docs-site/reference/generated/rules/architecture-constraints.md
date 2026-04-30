# architecture-constraints

Design patterns, framework choices and module boundary rules

## Metadados

- category: `architecture-constraints`
- priority: `high`

## Aplica-se a

- `architect`
- `backend`
- `frontend`

## Tags

- `architecture`
- `design`
- `patterns`

## Conteudo do artefato

# Architecture Constraints

## Purpose

Define the architectural patterns, frameworks and module boundaries that agents must respect when making design and implementation decisions.

## Rules

- Prefer the established architecture of the existing codebase.
- Introduce new patterns only when the current approach is demonstrably insufficient.
- Respect module boundaries and dependency direction.
- Document architectural decisions using ADRs.

## Examples

- In a layered architecture: controllers call services, services call repositories.
- In a microservices setup: prefer async messaging over synchronous HTTP calls.

## Enforcement

- Architecture review gates in the delivery workflow.
- ADR required for new patterns or significant changes.

## Arquivo

- `packs/engineering-base/rules/architecture-constraints.md`

[Voltar para rules](../rules)
