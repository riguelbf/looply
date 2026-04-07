---
schema: looply/example@v1
name: prd-example-01-strong
summary: Concise PRD example with clear scope, metrics and rollout framing.
kind: template-example
quality: strong
applies_to:
  workflows:
    - idea-to-prd
  tasks:
    - create-prd
  templates:
    - prd-template
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
  - prd
  - concise
  - execution-ready
---

# PRD

## Problem

Webhook retries are manual, slow and operationally noisy.

## Goal

Increase successful recovery of transient webhook failures without changing the external contract.

## Success Metrics

- recovery rate improves from 72% to 95%
- manual reconciliation volume drops by at least 60%
- duplicate downstream side effects remain at 0

## In Scope

- automatic retry policy for transient failures
- retry visibility in operations
- audit trail for retry attempts

## Out Of Scope

- redesign of the webhook contract
- provider migration
- changes to merchant-facing dashboards

## Risks

- hidden non-idempotent handlers
- retry storms during provider incidents

## Validation

- confirm idempotency boundaries
- verify alerting on exhausted retries
- review rollout and rollback plan before release
