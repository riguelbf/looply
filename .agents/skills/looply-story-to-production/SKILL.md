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
- Managed pack: ../../../.looply/managed/packs/engineering-base
- Workflow state template: ../../../.looply/managed/packs/engineering-base/templates/workflow-status-template.md
- Custom overrides: ../../../.looply/custom
- Execution hints: ../../../.looply/state/execution-hints.codex.json
- Context index: ../../../.looply/state/context-index.md
- Project context: ../../../.looply/custom/project-context.md
- Session context: ../../../.looply/custom/session-context.md
Usage:
- Explicit mention: `$looply-story-to-production`
- Workflow alias to honor: `/looply:story-to-production` and `$looply-story-to-production` depending on host
- Syntax in Codex: `$looply-story-to-production <feature-name> <story-reference> [constraints...]`
Example:
- $looply-story-to-production pix-webhook-retry story-01-retry-automatico
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
10. Keep the response visually structured with clear Markdown section titles for Workflow, Stage, Current Task, Gate, Decision and Next Step.
11. Do not use emojis.
Arguments:
- feature-name: short identifier for the feature in delivery (required)
- story-reference: story to be delivered in this cycle (required)
- constraints: optional delivery notes, blockers or implementation constraints (optional)
