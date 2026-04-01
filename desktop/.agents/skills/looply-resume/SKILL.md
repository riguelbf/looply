---
name: looply-resume
description: Use to resume a persisted feature workflow from its saved state, especially when multiple sessions exist.
---
Use this skill when the user explicitly invokes `$looply-resume`, asks to run `/looply:resume`, or clearly requests the `workflow-status` workflow.
Workflow phase: `status`.
Primary orchestrator: `delivery-orchestrator`.
Quick usage:
- `$looply-resume <feature-name> [session-label] "[notes...]"`
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
- Explicit mention: `$looply-resume`
- Workflow alias to honor: `/looply:resume` and `$looply-resume` depending on host
- Syntax in Codex: `$looply-resume <feature-name> [session-label] [notes...]`
Example:
- $looply-resume pix-webhook-retry backend-afternoon
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
- feature-name: short identifier of the feature being resumed (required)
- session-label: optional label used to distinguish parallel sessions for the same project or feature (optional)
- notes: optional notes about blockers, context switches or newly discovered artifacts (optional)