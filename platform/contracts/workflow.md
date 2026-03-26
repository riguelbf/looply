# Workflow Contract

## Required Frontmatter

```yaml
schema: looply/workflow@v1
name: story-to-production
summary: Delivery path from approved story to published software change
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
handoffs:
  - from: architect
    to: backend
    artifact: tech-spec
  - from: backend
    to: reviewer
    artifact: implementation-summary
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
    after_stage: implementation
    owner: reviewer
    requires_outputs:
      - implementation-summary
    checklist: code-review-checklist
    blocks_on_failure: true
command:
  name: story-to-production
  description: Start the story delivery workflow
  argument_hint: <feature-name> <story-reference> [constraints...]
  arguments:
    - name: feature-name
      description: short identifier for the change
      required: true
    - name: story-reference
      description: selected story for this delivery cycle
      required: true
    - name: constraints
      description: optional extra constraints or context
      required: false
      variadic: true
outputs:
  - release-plan
tasks:
  - create-tech-spec
  - create-adr
  - implement-api
  - review-code
  - publish-service
```

## Body Sections

- `Objective`
- `Phase`
- `Orchestrator`
- `Execution`
- `Sequence`
- `Handoffs`
- `Quality Gates`
- `Outputs`
