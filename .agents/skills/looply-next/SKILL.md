---
name: looply-next
description: Use to show the next recommended step for a persisted feature workflow without restarting the whole flow.
---
Use this skill when the user explicitly invokes `$looply-next`, asks to run `/looply:next`, or clearly requests the `workflow-status` workflow.
Workflow phase: `status`.
Primary orchestrator: `delivery-orchestrator`.
Quick usage:
- `$looply-next <feature-name> [session-label] "[notes...]"`
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
- Explicit mention: `$looply-next`
- Workflow alias to honor: `/looply:next` and `$looply-next` depending on host
- Syntax in Codex: `$looply-next <feature-name> [session-label] [notes...]`
Example:
- $looply-next pix-webhook-retry backend-afternoon
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

- Do not implement feature code directly
- Do not skip blocking gates
- Do not rewrite specialist outputs without explicit reason
## Escalation

- Escalate product ambiguity to pm-analyst
- Escalate structural ambiguity to architect
- Escalate implementation blockers to backend
- Escalate release risk to reviewer
## Project Rules

### project-conventions

# Project Conventions

## Purpose

Define project-level conventions for collaboration that agents must follow when interacting with version control, pull requests and releases.

## Rules

- Follow the project's established branching strategy.
- Write clear, descriptive commit messages.
- PRs must include a summary of changes and link to the relevant story.
- Do not commit generated files or build artifacts.
- Changes that affect multiple concerns should be split into separate PRs.

## Examples

- Good commit: `feat: add retry logic to payment processing`
- Bad commit: `fix stuff`

## Enforcement

- Branch protection rules enforce review requirements.
- CI checks run on every PR.
- Commit message convention enforced via hooks or CI.
Arguments:
- feature-name: short identifier of the feature being resumed (required)
- session-label: optional label used to distinguish parallel sessions for the same project or feature (optional)
- notes: optional notes about blockers, context switches or newly discovered artifacts (optional)