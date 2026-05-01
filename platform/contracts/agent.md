# Agent Contract

## Required Frontmatter

```yaml
schema: looply/agent@v1
name: architect
role: Solution design and technical decision making
mission: Define maintainable technical direction
execution:
  profile: structured-analysis
  reasoning_effort: medium
  context_budget: medium
  latency_priority: medium
  preferred_hosts:
    - codex
    - claude
  model_hint:
    provider: openai
    family: gpt-5
parent_agent:
specialization:
supported_tasks:
  - create-tech-spec
knowledge_sources:
  - ../knowledge/architecture-principles.md
constraints:
  - Do not invent business rules
escalation_rules:
  - Escalate structural ambiguity to pm-analyst
context_slots:
  # Static — looply inlines at sync time into the skill prompt
  - name: knowledge
    source: self.knowledge_sources
    compose: inline
  - name: constraints
    source: self.constraints
    compose: inline
  - name: project_rules
    source: rules
    filter:
      - architecture-constraints
      - coding-standards
    compose: inline
  # Dynamic — host resolves at runtime
  - name: previous_outputs
    source: stage.inputs
    compose: reference
  - name: feature_context
    source: feature
    compose: reference
```

## context_slots

Declara o que o agente precisa receber para ser mais assertivo. O publisher do looply resolve slots `inline` durante o `sync`; o host resolve slots `reference` em runtime.

| Campo | Descricao |
|---|---|
| `name` | Identificador do slot (usado como heading no prompt composto) |
| `source` | Origem: `self.knowledge_sources`, `self.constraints`, `self.escalation_rules`, `rules`, `stage.inputs`, `feature` |
| `compose` | `inline` (looply resolve no sync) ou `reference` (host resolve em runtime) |
| `filter` | Lista opcional de categorias/tags para filtrar `rules` |

## Body Sections

- `Role`
- `Mission`
- `Execution`
- `Responsibilities`
- `Knowledge Sources`
- `Constraints`
- `Escalation`
