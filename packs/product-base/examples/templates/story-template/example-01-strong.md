---
schema: looply/example@v1
name: story-example-01-strong
summary: Delivery story example with testable acceptance criteria and explicit done state.
kind: template-example
quality: strong
applies_to:
  workflows:
    - prd-to-stories
  tasks:
    - break-prd-into-stories
  templates:
    - story-template
  agents:
    - pm-analyst
  handoffs: []
host_support:
  - codex
  - claude
project_modes:
  - existing-project
  - greenfield
interaction_modes:
  - balanced
  - autonomous
locale: en
tags:
  - story
  - acceptance-criteria
  - delivery
---

# Story

## User Story

As an operations analyst, I want transient webhook failures to retry automatically so that I do not need to reconcile common incidents manually.

## Scope

- classify retryable failures
- schedule retries with backoff
- surface exhausted retries for manual handling

## Acceptance Criteria

- Given a retryable provider timeout, when the first delivery fails, then the system schedules a retry automatically.
- Given a non-retryable validation failure, when processing fails, then no retry is scheduled.
- Given the retry limit is exceeded, when the final attempt fails, then the event is marked for manual reconciliation with an audit trail.

## Definition Of Done

- implementation merged
- tests cover retryable and non-retryable paths
- observability updated for exhausted retries

## Dependencies

- technical design for retry policy
- idempotency confirmation for downstream handlers
