---
schema: looply/example@v1
name: workflow-decision-example-01
summary: Short workflow decision example that makes the next move and rationale explicit.
kind: template-example
quality: strong
applies_to:
  workflows:
    - workflow-status
  tasks:
    - report-workflow-status
  templates:
    - workflow-decision-template
  agents:
    - delivery-orchestrator
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
  - decision
  - workflow
  - handoff
---

# Workflow Decision

## Decision

Do not advance to release preparation yet.

## Why

The implementation artifact exists, but review evidence and release readiness checks are still incomplete.

## Next Command

`$looply-story-to-production pix-webhook-retry story-01-automatic-retry`

## Expected Result

Review completes, missing blockers become explicit and the workflow can either advance or replay safely.
