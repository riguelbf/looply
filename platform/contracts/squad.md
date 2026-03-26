# Squad Contract

## Required Frontmatter

```yaml
schema: looply/squad@v1
name: architecture-squad
domain: architecture
pack_version: 0.1.0
execution_defaults:
  profile: structured-analysis
  reasoning_effort: medium
  context_budget: medium
  latency_priority: medium
agents:
  - architect
tasks:
  - create-tech-spec
workflows:
  - idea-to-prd
  - prd-to-stories
  - story-to-production
knowledge:
  - architecture-principles
```

## Body Sections

- `Domain`
- `Execution Defaults`
- `Responsibilities`
- `Included Artifacts`
- `Adoption Notes`
