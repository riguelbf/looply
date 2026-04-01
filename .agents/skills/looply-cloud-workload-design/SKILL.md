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
- Managed pack: ../../../.looply/managed/packs/engineering-base
- Workflow state template: ../../../.looply/managed/packs/engineering-base/templates/workflow-status-template.md
- Custom overrides: ../../../.looply/custom
- Execution hints: ../../../.looply/state/execution-hints.codex.json
- Context index: ../../../.looply/state/context-index.md
- Project context: ../../../.looply/custom/project-context.md
- Session context: ../../../.looply/custom/session-context.md
Usage:
- Explicit mention: `$looply-cloud-workload-design`
- Workflow alias to honor: `/looply:cloud-workload-design` and `$looply-cloud-workload-design` depending on host
- Syntax in Codex: `$looply-cloud-workload-design <feature-name> <scope-reference> [constraints...]`
Example:
- $looply-cloud-workload-design pix-webhook-retry payments-api "introduzir fila para retries de webhook e revisar controles cloud"
Execution rules:
1. Start by reading the workflow playbook and the feature state file if it already exists.
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
- feature-name: short identifier for the workload or feature (required)
- scope-reference: workload, service or initiative being assessed (required)
- constraints: optional constraints, guardrails or non-functional concerns (optional)