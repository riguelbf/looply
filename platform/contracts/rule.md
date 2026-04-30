# Rule Contract

## Required Frontmatter

```yaml
schema: looply/rule@v1
name: coding-standards
category: coding-standards
summary: Project coding conventions and standards
priority: high
applies_to:
  - all
tags:
  - coding
  - standards
  - conventions
```

## Categories

| Category | Description |
|---|---|
| `coding-standards` | Language conventions, naming, formatting, linting rules |
| `architecture-constraints` | Patterns, frameworks, module boundaries, dependency rules |
| `testing-requirements` | Testing framework, coverage expectations, test conventions |
| `security-policies` | Auth patterns, data handling, secrets management, access control |
| `business-rules` | Domain constraints, validation rules, invariants |
| `project-conventions` | Commit style, PR process, branching strategy, release flow |

## Body Sections

- `Purpose`
- `Rules`
- `Examples`
- `Enforcement`
