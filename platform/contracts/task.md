# Task Contract

## Required Frontmatter

```yaml
schema: looply/task@v1
name: implement-api
agent: backend
summary: Implement an API endpoint from the approved tech spec
execution:
  profile: implementation
  reasoning_effort: high
  context_budget: large
  latency_priority: medium
  preferred_hosts:
    - codex
  model_hint:
    provider: openai
    family: gpt-5
inputs:
  - story
  - tech-spec
context:
  - architecture-principles
outputs:
  - code-change
  - api-doc
templates:
  - api-template
checklists:
  - code-review-checklist
dependencies:
  - create-tech-spec
```

## Body Sections

- `Objective`
- `Execution`
- `Inputs`
- `Steps`
- `Constraints`
- `Deliverables`
- `Escalation`
