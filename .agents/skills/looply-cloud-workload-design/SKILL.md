---
name: looply-cloud-workload-design
description: Use when the main problem is cloud topology, async-first communication, governance posture or workload cost direction before delivery.
---
Use this skill when the user explicitly invokes `$looply-cloud-workload-design`, asks to run `/looply:cloud-workload-design`, or clearly requests the `cloud-workload-design` workflow.
Workflow phase: `planning`.
Primary orchestrator: `delivery-orchestrator`.
Quick usage:
- `$looply-cloud-workload-design <feature-name> <scope-reference> "[constraints...]"`
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
- Explicit mention: `$looply-cloud-workload-design`
- Workflow alias to honor: `/looply:cloud-workload-design` and `$looply-cloud-workload-design` depending on host
- Syntax in Codex: `$looply-cloud-workload-design <feature-name> <scope-reference> [constraints...]`
Example:
- $looply-cloud-workload-design pix-webhook-retry payments-api "introduzir fila para retries de webhook e revisar controles cloud"
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
---
## Composed Agent Context
The sections below were pre-composed by looply from agent context_slots. Inline sections contain content resolved during install/sync. Reference sections list files the host should read at runtime.
## Constraints

- Do not redefine product scope while designing cloud topology
## Escalation

- Escalate product ambiguity to pm-analyst
- Escalate platform ownership issues to platform-engineer
- Escalate governance and compliance gaps to cloud-governance
- Escalate cost trade-offs to finops
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

- Do not redefine product scope while designing cloud topology
## Escalation

- Escalate product ambiguity to pm-analyst
- Escalate platform ownership issues to platform-engineer
- Escalate governance and compliance gaps to cloud-governance
- Escalate cost trade-offs to finops
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
- feature-name: short identifier for the workload or feature (required)
- scope-reference: workload, service or initiative being assessed (required)
- constraints: optional constraints, guardrails or non-functional concerns (optional)