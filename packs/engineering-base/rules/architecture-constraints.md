---
schema: looply/rule@v1
name: architecture-constraints
category: architecture-constraints
summary: Design patterns, framework choices and module boundary rules
priority: high
applies_to:
  - architect
  - backend
  - frontend
tags:
  - architecture
  - design
  - patterns
---

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
