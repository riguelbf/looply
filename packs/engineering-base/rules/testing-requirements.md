---
schema: looply/rule@v1
name: testing-requirements
category: testing-requirements
summary: Testing framework, coverage expectations and test conventions
priority: high
applies_to:
  - backend
  - frontend
tags:
  - testing
  - quality
  - coverage
---

# Testing Requirements

## Purpose

Define the testing strategy, framework choices and coverage expectations that agents must follow when implementing features.

## Rules

- Write tests before or alongside implementation code.
- Prefer the project's existing test framework and patterns.
- Cover happy path, edge cases and error paths for every new behavior.
- Mock external dependencies at the boundary.
- Tests must be deterministic and runnable in CI.

## Examples

- Unit test: test a single function or class in isolation.
- Integration test: test the interaction between multiple real components.
- E2E test: test a complete user flow end to end.

## Enforcement

- CI pipeline runs tests on every push.
- Coverage thresholds enforced where applicable.
- Code review must verify adequate test coverage.
