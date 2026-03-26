---
schema: looply/workflow@v1
name: story-to-production
summary: Delivery workflow from approved story to release readiness
execution:
  profile: publishing
  reasoning_effort: medium
  context_budget: medium
  latency_priority: low
  preferred_hosts:
    - codex
    - claude
inputs:
  - story
  - prd
phase: delivery
orchestrator: delivery-orchestrator
stages:
  - name: technical-design
    task: create-tech-spec
    agent: architect
    inputs:
      - story
      - prd
    outputs:
      - tech-spec
  - name: architecture-decision
    task: create-adr
    agent: architect
    depends_on:
      - technical-design
    inputs:
      - tech-spec
    outputs:
      - adr
  - name: implementation
    task: implement-api
    agent: backend
    depends_on:
      - technical-design
      - architecture-decision
    inputs:
      - tech-spec
      - adr
    outputs:
      - implementation-summary
  - name: technical-review
    task: review-code
    agent: reviewer
    depends_on:
      - implementation
    inputs:
      - implementation-summary
    outputs:
      - review-report
  - name: release-preparation
    task: prepare-service-release
    agent: devops
    depends_on:
      - technical-review
    inputs:
      - review-report
      - implementation-summary
    outputs:
      - release-plan
  - name: operability-review
    task: assess-service-operability
    agent: sre
    depends_on:
      - release-preparation
      - implementation
    inputs:
      - release-plan
      - implementation-summary
    outputs:
      - operability-report
handoffs:
  - from: architect
    to: backend
    artifact: tech-spec
  - from: backend
    to: reviewer
    artifact: implementation-summary
  - from: reviewer
    to: devops
    artifact: review-report
  - from: devops
    to: sre
    artifact: release-plan
gates:
  - name: design-approved
    after_stage: architecture-decision
    owner: architect
    requires_outputs:
      - tech-spec
      - adr
    checklist: definition-of-done
    blocks_on_failure: true
  - name: implementation-reviewed
    after_stage: technical-review
    owner: reviewer
    requires_outputs:
      - review-report
    checklist: code-review-checklist
    blocks_on_failure: true
  - name: release-ready
    after_stage: operability-review
    owner: sre
    requires_outputs:
      - release-plan
      - operability-report
    checklist: definition-of-done
    blocks_on_failure: true
command:
  name: story-to-production
  description: Execute delivery for a single approved story until release planning
  argument_hint: <feature-name> <story-reference> [constraints...]
  arguments:
    - name: feature-name
      description: short identifier for the feature in delivery
      required: true
    - name: story-reference
      description: story to be delivered in this cycle
      required: true
    - name: constraints
      description: optional delivery notes, blockers or implementation constraints
      required: false
      variadic: true
outputs:
  - release-plan
  - operability-report
tasks:
  - create-tech-spec
  - create-adr
  - implement-api
  - review-code
  - prepare-service-release
  - assess-service-operability
---

# Workflow: story-to-production

## Objective

Executar delivery de uma story aprovada ate readiness de release com validacao operacional.

## Orchestrator

`delivery-orchestrator` acompanha o estado da story, cobra gates tecnicos e decide o proximo especialista.

## Execution

Usar backlog pronto como entrada e evitar misturar discovery com delivery.

## Sequence

1. `technical-design` by `architect`
2. `architecture-decision` by `architect`
3. `implementation` by `backend`
4. `technical-review` by `reviewer`
5. `release-preparation` by `devops`
6. `operability-review` by `sre`

## Quality Gates

- `design-approved` bloqueia implementacao sem `tech-spec` e `adr`
- `implementation-reviewed` bloqueia publicacao sem `review-report`
- `release-ready` bloqueia encerramento sem `release-plan` e `operability-report`
