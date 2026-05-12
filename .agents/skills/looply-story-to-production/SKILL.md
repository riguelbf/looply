---
name: looply-story-to-production
description: Use when a delivery story already exists and needs technical design, implementation, review and release preparation. Do not use before discovery and planning are complete.
---
Use this skill when the user explicitly invokes `$looply-story-to-production`, asks to run `/looply:story-to-production`, or clearly requests the `story-to-production` workflow.
Workflow phase: `delivery`.
Primary orchestrator: `delivery-orchestrator`.
Quick usage:
- `$looply-story-to-production <feature-name> "<story-reference>" "[constraints...]"`
Primary references:
- Workflow playbook: ../../../.looply/state/workflow-playbook.codex.md
- Host status contract: ../../../.looply/state/host-status-contract.json
- Managed pack: ../../../.looply/managed/packs/software-delivery-suite
- Workflow state template: ../../../.looply/managed/packs/product-base/templates/workflow-status-template.md
- Custom overrides: ../../../.looply/custom
- Execution hints: ../../../.looply/state/execution-hints.codex.json
- Example hints: ../../../.looply/state/example-hints.codex.json
- Context index: ../../../.looply/state/context-index.md
- Project context: ../../../.looply/custom/project-context.md
- Session context: ../../../.looply/custom/session-context.md
- Knowledge graph: ../../../.looply/state/knowledge-graph.json (use para impacto, dependencias entre modulos e schema de banco)
Usage:
- Explicit mention: `$looply-story-to-production`
- Workflow alias to honor: `/looply:story-to-production` and `$looply-story-to-production` depending on host
- Syntax in Codex: `$looply-story-to-production <feature-name> <story-reference> [constraints...]`
Example:
- $looply-story-to-production pix-webhook-retry story-01-retry-automatico
Curated example guidance:
- ICL mode: `on`
- Use examples only for style, structure and quality calibration.
- Do not copy feature-specific names, identifiers or business details from examples.
- No example was selected for this workflow.
Execution rules:
1. Start by reading the workflow playbook, the host status contract if it exists, and the feature state file if it already exists.
2. If the user asked for help, explain syntax, arguments, example, expected output and next step without mutating state.
3. Create or update `.looply/custom/features/<feature-name>/workflow-status.md` before advancing stages.
4. Respect blocking gates and do not skip required artifacts.
5. Use managed pack files as canonical process definition and write local state only under `.looply/custom`.
6. Generate user-facing outputs in pt-BR unless the user explicitly asks for another language.
7. For existing projects, use the real local codebase as the primary source of truth and use context files only as accelerators.
8. If a context file has `status: empty`, `status: draft` or `status: stale`, validate it against the local codebase before trusting it.
9. Follow balanced interaction mode to avoid unnecessary repeated clarifications.
10. When curated examples are referenced, use them only for style, structure and quality calibration.
11. Keep the response visually structured with clear Markdown section titles for Workflow, Stage, Current Task, Gate, Decision and Next Step.
12. Do not use emojis.
13. Before implementing, check `.looply/state/knowledge-graph.json` for module dependencies, database tables and entities impacted by the story. Run `looply refresh-code-context` if the graph is missing or stale.
14. After completing `technical-design` and `architecture-decision`, the gate `design-approved` REQUIRES explicit user confirmation. Present the tech-spec and ADR to the user and ask "Aprovado para implementacao?" before advancing to `implementation`. Do not proceed without user approval.
15. When context monitoring is enabled in `.looply/state/interaction-policy.json`, after each stage estimate context consumption against the stage's `context_budget` hint from `execution-hints.codex.json`. Track in `workflow-status.md` (`## Session Context`). At `yellow` (70-85%), compact state. At `red` (>85%), require `/looply:resume` in a fresh session.
---
## Composed Agent Context
The sections below were pre-composed by looply from agent context_slots. Inline sections contain content resolved during install/sync. Reference sections list files the host should read at runtime.
## Constraints

- Do not invent business rules
- Apply YAGNI — do not design for hypothetical future requirements; add structural complexity only when the current scope pushes for it
## Escalation

- Escalate unresolved business ambiguity to pm-analyst
## Project Rules

### architecture-constraints

# Architecture Constraints

## Purpose

Define the architectural patterns, frameworks and module boundaries that agents must respect when making design and implementation decisions.

## Rules

- Prefer the established architecture of the existing codebase.
- Introduce new patterns only when the current approach is demonstrably insufficient.
- Respect module boundaries and dependency direction.
- Document architectural decisions using ADRs.

## Examples

- In a layered architecture: controllers call services, services call repositories.
- In a microservices setup: prefer async messaging over synchronous HTTP calls.

## Enforcement

- Architecture review gates in the delivery workflow.
- ADR required for new patterns or significant changes.
## Constraints

- Do not invent business rules
- Apply YAGNI — do not design for hypothetical future requirements; add structural complexity only when the current scope pushes for it
## Escalation

- Escalate unresolved business ambiguity to pm-analyst
## Project Rules

### architecture-constraints

# Architecture Constraints

## Purpose

Define the architectural patterns, frameworks and module boundaries that agents must respect when making design and implementation decisions.

## Rules

- Prefer the established architecture of the existing codebase.
- Introduce new patterns only when the current approach is demonstrably insufficient.
- Respect module boundaries and dependency direction.
- Document architectural decisions using ADRs.

## Examples

- In a layered architecture: controllers call services, services call repositories.
- In a microservices setup: prefer async messaging over synchronous HTTP calls.

## Enforcement

- Architecture review gates in the delivery workflow.
- ADR required for new patterns or significant changes.
## Constraints

- Do not change domain rules without explicit guidance
- Apply YAGNI — no speculative options, wrappers or abstractions without a real call-site in the current scope
## Escalation

- Escalate structural gaps to architect
## Project Rules

### architecture-constraints

# Architecture Constraints

## Purpose

Define the architectural patterns, frameworks and module boundaries that agents must respect when making design and implementation decisions.

## Rules

- Prefer the established architecture of the existing codebase.
- Introduce new patterns only when the current approach is demonstrably insufficient.
- Respect module boundaries and dependency direction.
- Document architectural decisions using ADRs.

## Examples

- In a layered architecture: controllers call services, services call repositories.
- In a microservices setup: prefer async messaging over synchronous HTTP calls.

## Enforcement

- Architecture review gates in the delivery workflow.
- ADR required for new patterns or significant changes.

### coding-standards

# Coding Standards

## Purpose

Define language-specific conventions, naming, formatting and linting rules that agents must follow when producing code.

## Rules

- Prefer idiomatic patterns for the target language and framework.
- Follow the existing codebase conventions over generic style guides.
- Use the project's configured linter and formatter settings.
- Name variables, functions and classes descriptively.

## Examples

- Good: `calculateTotalInvoice(items)` -- clear action + noun
- Bad: `calc(items)` -- too abbreviated and unclear

## Enforcement

- Linting rules defined in project config (`.eslintrc`, `.prettierrc`, etc.).
- Code review checklist references this rule set.
## Constraints

- Do not redefine architecture during review without justification
- Apply YAGNI as a review gate — flag speculative options, dead exports, unused parameters and premature abstractions as blocking findings
## Escalation

- Escalate systemic architectural issues to architect
## Project Rules

### coding-standards

# Coding Standards

## Purpose

Define language-specific conventions, naming, formatting and linting rules that agents must follow when producing code.

## Rules

- Prefer idiomatic patterns for the target language and framework.
- Follow the existing codebase conventions over generic style guides.
- Use the project's configured linter and formatter settings.
- Name variables, functions and classes descriptively.

## Examples

- Good: `calculateTotalInvoice(items)` -- clear action + noun
- Bad: `calc(items)` -- too abbreviated and unclear

## Enforcement

- Linting rules defined in project config (`.eslintrc`, `.prettierrc`, etc.).
- Code review checklist references this rule set.

### testing-requirements

# Testing Requirements

## Purpose

Define the testing strategy, framework choices and coverage expectations that agents must follow when implementing features.

## Rules

- Write tests before or alongside implementation code.
- Prefer the project's existing test framework and patterns.
- Cover happy path, edge cases and error paths for every new behavior.
- Mock external dependencies at the boundary.
- Tests must be deterministic and runnable in CI.

## Examples

- Unit test: test a single function or class in isolation.
- Integration test: test the interaction between multiple real components.
- E2E test: test a complete user flow end to end.

## Enforcement

- CI pipeline runs tests on every push.
- Coverage thresholds enforced where applicable.
- Code review must verify adequate test coverage.
## Constraints

- Do not redefine feature scope during release preparation
- Apply YAGNI — keep pipelines, IaC and release assets aligned to the current scope; do not add stages, flags or templates without a real consumer
## Escalation

- Escalate structural delivery gaps to architect
- Escalate operability risks to sre
## Project Rules

### architecture-constraints

# Architecture Constraints

## Purpose

Define the architectural patterns, frameworks and module boundaries that agents must respect when making design and implementation decisions.

## Rules

- Prefer the established architecture of the existing codebase.
- Introduce new patterns only when the current approach is demonstrably insufficient.
- Respect module boundaries and dependency direction.
- Document architectural decisions using ADRs.

## Examples

- In a layered architecture: controllers call services, services call repositories.
- In a microservices setup: prefer async messaging over synchronous HTTP calls.

## Enforcement

- Architecture review gates in the delivery workflow.
- ADR required for new patterns or significant changes.

### security-policies

# Security Policies

## Purpose

Define security rules that agents must follow for authentication, authorization, data handling and secrets management.

## Rules

- Never hardcode secrets, keys or credentials in source code.
- Use environment variables or a secrets manager for sensitive configuration.
- Validate and sanitize all external inputs.
- Apply the principle of least privilege for all access controls.
- Log security-relevant events without exposing sensitive data.
- Use parameterized queries or ORM methods to prevent injection.

## Examples

- Correct: `apiKey = process.env.STRIPE_API_KEY`
- Wrong: `const apiKey = "sk_live_12345"`

## Enforcement

- Secrets scanning in CI/CD pipeline.
- Security review gate in the delivery workflow.
- Use .gitignore to prevent accidental commits of sensitive files.
## Constraints

- Do not redesign the solution during operability review without a concrete risk
## Escalation

- Escalate design issues to architect
- Escalate implementation issues to backend
- Escalate release sequencing issues to devops
## Project Rules

### architecture-constraints

# Architecture Constraints

## Purpose

Define the architectural patterns, frameworks and module boundaries that agents must respect when making design and implementation decisions.

## Rules

- Prefer the established architecture of the existing codebase.
- Introduce new patterns only when the current approach is demonstrably insufficient.
- Respect module boundaries and dependency direction.
- Document architectural decisions using ADRs.

## Examples

- In a layered architecture: controllers call services, services call repositories.
- In a microservices setup: prefer async messaging over synchronous HTTP calls.

## Enforcement

- Architecture review gates in the delivery workflow.
- ADR required for new patterns or significant changes.

### security-policies

# Security Policies

## Purpose

Define security rules that agents must follow for authentication, authorization, data handling and secrets management.

## Rules

- Never hardcode secrets, keys or credentials in source code.
- Use environment variables or a secrets manager for sensitive configuration.
- Validate and sanitize all external inputs.
- Apply the principle of least privilege for all access controls.
- Log security-relevant events without exposing sensitive data.
- Use parameterized queries or ORM methods to prevent injection.

## Examples

- Correct: `apiKey = process.env.STRIPE_API_KEY`
- Wrong: `const apiKey = "sk_live_12345"`

## Enforcement

- Secrets scanning in CI/CD pipeline.
- Security review gate in the delivery workflow.
- Use .gitignore to prevent accidental commits of sensitive files.
Arguments:
- feature-name: short identifier for the feature in delivery (required)
- story-reference: story to be delivered in this cycle (required)
- constraints: optional delivery notes, blockers or implementation constraints (optional)