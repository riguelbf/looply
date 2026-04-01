---
description: Execute delivery for a single approved story until release planning
argument-hint: <feature-name> <story-reference> [constraints...]
---

Run the looply workflow `story-to-production` using the alias `/looply:story-to-production`.
Workflow phase: `delivery`.
Primary orchestrator: `delivery-orchestrator`.

Context references:
- Workflow playbook: @../../.looply/state/workflow-playbook.claude.md
- Managed pack: @../../.looply/managed/packs/software-delivery-suite/pack.md
- Workflow state template: @../../.looply/managed/packs/product-base/templates/workflow-status-template.md
- Custom overrides: @../../.looply/custom
- Execution hints: @../../.looply/state/execution-hints.claude.json
- Context index: `./.looply/state/context-index.md`
- Project context: `./.looply/custom/project-context.md`
- Session context: `./.looply/custom/session-context.md`
- Output locale: `en`
- Project mode: `existing-project`
- Interaction mode: `balanced`

State handling:
- Feature state file: `.looply/custom/features/$1/workflow-status.md`
- Read it first when it exists, otherwise create it from the workflow state template.
- Session links file: `.looply/custom/session-links.json`
- If context markdown files are empty, draft or stale, inspect the local codebase before making meaningful decisions.

Arguments:
- Raw arguments: `$ARGUMENTS`
- feature-name: `$1` (required)
- story-reference: `$2` (required)
- constraints: `$3` (optional)

Usage:
- Host: `Claude Code`
- Alias: `/looply:story-to-production`
- Syntax: `/looply:story-to-production <feature-name> <story-reference> [constraints...]`

Example:
- `/looply:story-to-production pix-webhook-retry story-01-retry-automatico`

When to use:
- Use when a story was selected and delivery should advance through design, implementation and release planning.

Expected output:
- A release plan plus intermediate delivery artifacts.

Suggested next step:
- Host: Claude Code. Use `/looply:workflow-status` whenever you need to resume or inspect delivery.

Help mode:
- If the user passes `help`, `--help` or `ajuda`, explain this command only.
- In help mode, show syntax, arguments, example, expected output and next step.
- In help mode, do not update workflow state or create artifacts.

Presentation rules:
- Use clear Markdown section titles for Workflow, Stage, Current Task, Gate, Decision and Next Step.
- Highlight workflow, stage and task names in bold.
- Keep the response visually scannable with one blank line between sections.
- Do not use emojis.

Required behavior:
1. Check first whether the user asked for command help.
2. Normalize the incoming arguments into a short problem statement, scope, and constraints.
3. Create or update the feature state file before deciding the next step.
4. Open the workflow playbook first and follow the documented stages in order.
5. Respect every blocking gate before moving to the next stage.
6. Produce or update the expected artifacts for the current stage before advancing.
7. Fill only the phase-relevant block in the workflow state file: Discovery Focus, Planning Focus or Delivery Focus.
8. Update the feature state file after every relevant transition.
9. Preserve managed files as canonical and place local overrides only in `.looply/custom`.
10. Before acting as a specialist, consult the current agent `knowledge_sources`, especially specialist `best-practices` documents.
11. When the current task declares templates or checklists, use them as the default output contract and quality bar.
12. Generate user-facing outputs in `en` unless the user explicitly asks for another language.
13. When project mode is `existing-project`, treat the local project root as the default feature context unless the user points to another folder.
14. For existing projects, use the real local codebase as the primary source of truth and use context files only as accelerators.
15. If a context file has `status: empty`, `status: draft` or `status: stale`, validate it before trusting it.
16. Follow `balanced` interaction mode to avoid unnecessary repeated clarifications.