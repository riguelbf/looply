---
name: looply-platform-foundation-evolution
description: Use when the main problem is shared platform baseline, guardrails, pipelines, identity or observability foundation rather than a single workload feature.
---
Use this skill when the user explicitly invokes `$looply-platform-foundation-evolution`, asks to run `/looply:platform-foundation-evolution`, or clearly requests the `platform-foundation-evolution` workflow.
Workflow phase: `planning`.
Primary orchestrator: `delivery-orchestrator`.
Quick usage:
- `$looply-platform-foundation-evolution <initiative-name> "[constraints...]"`
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
Usage:
- Explicit mention: `$looply-platform-foundation-evolution`
- Workflow alias to honor: `/looply:platform-foundation-evolution` and `$looply-platform-foundation-evolution` depending on host
- Syntax in Codex: `$looply-platform-foundation-evolution <initiative-name> [constraints...]`
Example:
- $looply-platform-foundation-evolution "platform-observability-baseline" "padronizar tracing, logging e guardrails de deploy"
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
13. When context monitoring is enabled in `.looply/state/interaction-policy.json`, after each stage estimate context consumption against the stage's `context_budget` hint from `execution-hints.codex.json`. Track in `workflow-status.md` (`## Session Context`). At `yellow` (70-85%), compact state. At `red` (>85%), require `/looply:resume` in a fresh session.
---
## Composed Agent Context
The sections below were pre-composed by looply from agent context_slots. Inline sections contain content resolved during install/sync. Reference sections list files the host should read at runtime.
## Constraints

- Do not push product-specific logic into shared platform assets without justification
- Apply YAGNI — do not generalize a platform asset before the second real consumer exists; a hypothetical second consumer is not enough
## Escalation

- Escalate workload-specific architecture to cloud-architect
- Escalate governance policy conflicts to cloud-governance
- Escalate reliability concerns to sre
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

- Do not redesign workloads when the issue is policy or control alignment
## Escalation

- Escalate structural cloud design gaps to cloud-architect
- Escalate platform control gaps to platform-engineer
- Escalate production incident coordination needs to sre
## Project Rules

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

- Do not optimize cost by breaking required reliability, security or product outcomes without explicit trade-off approval
## Escalation

- Escalate architecture-driven cost issues to cloud-architect
- Escalate shared platform cost drivers to platform-engineer
- Escalate business trade-offs to pm-analyst
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
Arguments:
- initiative-name: platform initiative, foundation slice or shared capability (required)
- constraints: optional product constraints, platform guardrails or rollout notes (optional)