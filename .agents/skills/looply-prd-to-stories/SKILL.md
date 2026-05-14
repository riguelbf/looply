---
name: looply-prd-to-stories
description: Use when a PRD already exists and needs to be broken into delivery stories. Do not use for raw idea discovery or implementation.
---
Use this skill when the user explicitly invokes `$looply-prd-to-stories`, asks to run `/looply:prd-to-stories`, or clearly requests the `prd-to-stories` workflow.
Workflow phase: `planning`.
Primary orchestrator: `pm-analyst`.
Quick usage:
- `$looply-prd-to-stories <feature-name> [prd-reference] "[notes...]"`
Primary references:
- Workflow playbook: ../../../.looply/state/workflow-playbook.opencode.md
- Host status contract: ../../../.looply/state/host-status-contract.json
- Managed pack: ../../../.looply/managed/packs/software-delivery-suite
- Workflow state template: ../../../.looply/managed/packs/product-base/templates/workflow-status-template.md
- Custom overrides: ../../../.looply/custom
- Execution hints: ../../../.looply/state/execution-hints.opencode.json
- Example hints: ../../../.looply/state/example-hints.opencode.json
- Context index: ../../../.looply/state/context-index.md
- Project context: ../../../.looply/custom/project-context.md
- Session context: ../../../.looply/custom/session-context.md
- Knowledge graph: ../../../.looply/state/knowledge-graph.json (use para impacto, dependencias entre modulos e schema de banco)
Usage:
- Explicit mention: `$looply-prd-to-stories`
- Workflow alias to honor: `/looply:prd-to-stories` and `$looply-prd-to-stories` depending on host
- Syntax in Codex: `$looply-prd-to-stories <feature-name> [prd-reference] [notes...]`
Example:
- $looply-prd-to-stories pix-webhook-retry prd-pix-webhook-retry
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

- Do not define technical architecture
- Do not approve implementation tradeoffs
## Escalation

- Escalate technical tradeoffs to architect
- Escalate delivery sequencing to engineering-base
## Project Rules

### business-rules

# Business Rules

## Purpose

Define domain-specific constraints, validation rules and business invariants that agents must respect when designing or implementing features.

## Rules

- Document business rules explicitly before implementing.
- Validate business constraints in the domain layer, not in controllers.
- Business rules must be testable and independently verifiable.
- Do not invent business rules -- derive them from PRDs, stories or stakeholder input.
- Escalate ambiguity in business rules to the product owner.

## Examples

- "A user can only have one active subscription at a time."
- "Order total must be recalculated when line items change."
- "Discount codes expire 30 days after issuance."

## Enforcement

- Domain layer validation enforces invariants.
- Business rule tests in the test suite.
- PRD and story acceptance criteria must reference applicable business rules.
Arguments:
- feature-name: short identifier for the feature being planned (required)
- prd-reference: optional path or reference to the PRD artifact (optional)
- notes: optional planning notes, sequencing or constraints (optional)