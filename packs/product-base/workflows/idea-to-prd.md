---
schema: looply/workflow@v1
name: idea-to-prd
summary: Discovery workflow from raw idea to approved PRD
execution:
  profile: structured-analysis
  reasoning_effort: medium
  context_budget: medium
  latency_priority: medium
  preferred_hosts:
    - codex
    - claude
inputs:
  - idea
phase: discovery
orchestrator: pm-analyst
stages:
  - name: requirement-analysis
    task: analyze-requirement
    agent: pm-analyst
    inputs:
      - idea
    outputs:
      - requirement-brief
  - name: prd-definition
    task: create-prd
    agent: pm-analyst
    depends_on:
      - requirement-analysis
    inputs:
      - requirement-brief
    outputs:
      - prd
handoffs:
  - from: pm-analyst
    to: pm-analyst
    artifact: prd
gates:
  - name: discovery-ready
    after_stage: prd-definition
    owner: pm-analyst
    requires_outputs:
      - requirement-brief
      - prd
    checklist: definition-of-done
    blocks_on_failure: true
command:
  name: idea-to-prd
  description: Start discovery and consolidate an idea into an approved PRD
  argument_hint: <feature-name> [problem-statement] [constraints...]
  arguments:
    - name: feature-name
      description: short identifier for the feature or initiative
      required: true
    - name: problem-statement
      description: user problem or desired business outcome
      required: false
    - name: constraints
      description: optional constraints, dependencies or business notes
      required: false
      variadic: true
outputs:
  - prd
tasks:
  - analyze-requirement
  - create-prd
---

# Workflow: idea-to-prd

## Objective

Separar a fase de discovery e consolidar um PRD claro antes de iniciar delivery.

## Orchestrator

`pm-analyst` conduz discovery e fecha o gate de discovery-ready.

## Execution

Usar o minimo de contexto necessario para sair de ideia bruta para um PRD acionavel.

## Sequence

1. `requirement-analysis` by `pm-analyst`
2. `prd-definition` by `pm-analyst`

## Quality Gates

- `discovery-ready` bloqueia encerramento sem `requirement-brief` e `prd`
