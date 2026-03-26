---
schema: looply/workflow@v1
name: workflow-status
summary: Resume or inspect the current status of a feature workflow
execution:
  profile: review
  reasoning_effort: medium
  context_budget: small
  latency_priority: high
  preferred_hosts:
    - codex
    - claude
inputs:
  - feature-name
  - feature-workflow-state
phase: status
orchestrator: delivery-orchestrator
stages:
  - name: status-reconciliation
    task: report-workflow-status
    agent: delivery-orchestrator
    inputs:
      - feature-name
      - feature-workflow-state
    outputs:
      - feature-workflow-state
      - next-action
handoffs:
  - from: delivery-orchestrator
    to: delivery-orchestrator
    artifact: next-action
gates:
  - name: status-recorded
    after_stage: status-reconciliation
    owner: delivery-orchestrator
    requires_outputs:
      - feature-workflow-state
      - next-action
    checklist: definition-of-done
    blocks_on_failure: true
command:
  name: workflow-status
  aliases:
    - resume
    - next
  description: Inspect or resume the current status of a looply feature workflow
  argument_hint: <feature-name> [session-label] [notes...]
  arguments:
    - name: feature-name
      description: short identifier of the feature being resumed
      required: true
    - name: session-label
      description: optional label used to distinguish parallel sessions for the same project or feature
      required: false
    - name: notes
      description: optional notes about blockers, context switches or newly discovered artifacts
      required: false
      variadic: true
outputs:
  - feature-workflow-state
  - next-action
tasks:
  - report-workflow-status
---

# Workflow: workflow-status

## Objective

Retomar a entrega de uma feature sem depender de contexto implícito da conversa anterior.

## Orchestrator

`delivery-orchestrator` reconcilia o estado salvo, os outputs existentes e o proximo passo.

## Execution

Usar o estado persistido da feature como fonte rapida de retomada. Quando houver sessoes paralelas, usar `session-label` e o registro em `.looply/custom/session-links.json` para conectar a sessao atual ao trabalho certo.

## Sequence

1. `status-reconciliation` by `delivery-orchestrator`

## Quality Gates

- `status-recorded` bloqueia encerramento sem `feature-workflow-state` e `next-action`
