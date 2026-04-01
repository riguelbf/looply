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
- Managed pack: ../../../.looply/managed/packs/software-delivery-suite
- Workflow state template: ../../../.looply/managed/packs/product-base/templates/workflow-status-template.md
- Custom overrides: ../../../.looply/custom
- Execution hints: ../../../.looply/state/execution-hints.codex.json
- Context index: ../../../.looply/state/context-index.md
- Project context: ../../../.looply/custom/project-context.md
- Session context: ../../../.looply/custom/session-context.md
Usage:
- Explicit mention: `$looply-platform-foundation-evolution`
- Workflow alias to honor: `/looply:platform-foundation-evolution` and `$looply-platform-foundation-evolution` depending on host
- Syntax in Codex: `$looply-platform-foundation-evolution <initiative-name> [constraints...]`
Example:
- $looply-platform-foundation-evolution "platform-observability-baseline" "padronizar tracing, logging e guardrails de deploy"
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
- initiative-name: platform initiative, foundation slice or shared capability (required)
- constraints: optional product constraints, platform guardrails or rollout notes (optional)