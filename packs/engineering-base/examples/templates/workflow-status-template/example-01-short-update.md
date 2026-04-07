---
schema: looply/example@v1
name: workflow-status-example-01-short-update
summary: High-signal workflow status example optimized for resume and next-step guidance.
kind: template-example
quality: strong
applies_to:
  workflows:
    - workflow-status
    - story-to-production
  tasks:
    - report-workflow-status
  templates:
    - workflow-status-template
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
  - workflow-status
  - resume
  - concise
---

# Workflow Update

| Field | Value |
| --- | --- |
| Feature | pix-webhook-retry |
| Workflow | story-to-production |
| Current Stage | implementation |
| Current Gate | release-ready |
| Active Artifact | implementation-summary |
| Next Agent | reviewer |
| Next Task | review-code |
| Ready For Next Gate | no |

## Decision

Implementation is complete enough for review, but release readiness is still blocked by formal review findings and release planning artifacts.

## Next Step

Run the reviewer step and produce `review-report` before advancing the gate.

## Missing Artifacts

- review-report
- release-plan

## Blockers

- no review decision recorded yet
