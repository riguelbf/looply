---
schema: looply/example@v1
name: review-report-example-01-findings-first
summary: Findings-first review report example focused on blockers, risks and missing tests.
kind: template-example
quality: strong
applies_to:
  workflows:
    - story-to-production
  tasks:
    - review-code
  templates:
    - review-report-template
  agents:
    - reviewer
  handoffs: []
host_support:
  - codex
  - claude
project_modes:
  - existing-project
interaction_modes:
  - guided
  - balanced
  - autonomous
locale: en
tags:
  - review
  - findings
  - quality
---

# Review Report

## Findings

- High: retry scheduling path writes a new attempt record before idempotency verification, which can duplicate downstream effects after worker restarts.
- Medium: exhausted retry path has no assertion covering alert payload shape.

## Decision

Changes are not release-ready yet.

## Required Fixes

- move idempotency verification ahead of retry attempt persistence
- add automated coverage for exhausted retry alerts

## Residual Risk

If duplicate attempts reach the handler during incident recovery, reconciliation cost may increase instead of decreasing.
