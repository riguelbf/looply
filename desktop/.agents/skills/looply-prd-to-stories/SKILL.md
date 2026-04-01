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
- Workflow playbook: ../../../.looply/state/workflow-playbook.codex.md
- Managed pack: ../../../.looply/managed/packs/software-delivery-suite
- Workflow state template: ../../../.looply/managed/packs/product-base/templates/workflow-status-template.md
- Custom overrides: ../../../.looply/custom
- Execution hints: ../../../.looply/state/execution-hints.codex.json
- Context index: ../../../.looply/state/context-index.md
- Project context: ../../../.looply/custom/project-context.md
- Session context: ../../../.looply/custom/session-context.md
Usage:
- Explicit mention: `$looply-prd-to-stories`
- Workflow alias to honor: `/looply:prd-to-stories` and `$looply-prd-to-stories` depending on host
- Syntax in Codex: `$looply-prd-to-stories <feature-name> [prd-reference] [notes...]`
Example:
- $looply-prd-to-stories pix-webhook-retry prd-pix-webhook-retry
Execution rules:
1. Start by reading the workflow playbook and the feature state file if it already exists.
2. If the user asked for help, explain syntax, arguments, example, expected output and next step without mutating state.
3. Create or update `.looply/custom/features/<feature-name>/workflow-status.md` before advancing stages.
4. Respect blocking gates and do not skip required artifacts.
5. Use managed pack files as canonical process definition and write local state only under `.looply/custom`.
6. Generate user-facing outputs in en unless the user explicitly asks for another language.
7. For existing projects, use the real local codebase as the primary source of truth and use context files only as accelerators.
8. If a context file has `status: empty`, `status: draft` or `status: stale`, validate it against the local codebase before trusting it.
9. Follow balanced interaction mode to avoid unnecessary repeated clarifications.
10. Keep the response visually structured with clear Markdown section titles for Workflow, Stage, Current Task, Gate, Decision and Next Step.
11. Do not use emojis.
Arguments:
- feature-name: short identifier for the feature being planned (required)
- prd-reference: optional path or reference to the PRD artifact (optional)
- notes: optional planning notes, sequencing or constraints (optional)