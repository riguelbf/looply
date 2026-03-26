---
schema: looply/workflow@v1
name: prd-to-stories
summary: Delivery planning workflow from approved PRD to story backlog
execution:
  profile: structured-analysis
  reasoning_effort: medium
  context_budget: medium
  latency_priority: medium
  preferred_hosts:
    - codex
    - claude
inputs:
  - prd
phase: planning
orchestrator: delivery-orchestrator
stages:
  - name: story-planning
    task: break-prd-into-stories
    agent: pm-analyst
    inputs:
      - prd
    outputs:
      - story-backlog
handoffs:
  - from: pm-analyst
    to: architect
    artifact: story-backlog
gates:
  - name: planning-ready
    after_stage: story-planning
    owner: pm-analyst
    requires_outputs:
      - story-backlog
    checklist: definition-of-done
    blocks_on_failure: true
command:
  name: prd-to-stories
  description: Break an approved PRD into delivery-ready stories
  argument_hint: <feature-name> [prd-reference] [notes...]
  arguments:
    - name: feature-name
      description: short identifier for the feature being planned
      required: true
    - name: prd-reference
      description: optional path or reference to the PRD artifact
      required: false
    - name: notes
      description: optional planning notes, sequencing or constraints
      required: false
      variadic: true
outputs:
  - story-backlog
tasks:
  - break-prd-into-stories
---

# Workflow: prd-to-stories

## Objective

Transformar um PRD aprovado em backlog de stories pequenas e prontas para delivery.

## Orchestrator

`delivery-orchestrator` acompanha o planejamento e garante que o backlog esteja pronto antes do delivery.

## Execution

Usar recortes incrementais para evitar stories grandes demais e sem criterio de aceite.

## Sequence

1. `story-planning` by `pm-analyst`

## Quality Gates

- `planning-ready` bloqueia encerramento sem `story-backlog`
