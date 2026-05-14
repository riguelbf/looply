---
name: looply-skill-search
description: Use to discover available looply skills and workflows. Forces skill-aware discovery before any code action. Load this skill first when the user intent is unclear or when tool selection would benefit from structured workflow guidance.
---

Use this skill as the mandatory discovery layer for looply. Before executing any code generation, file edit, or architecture decision, scan the available looply skills and determine whether a structured workflow should take priority.

Primary references:
- Skills directory: ..
- Command index: ../../../LOOPLY_COMMANDS.md
- Workflow playbook: ../../../.looply/state/workflow-playbook.opencode.md
- Host status contract: ../../../.looply/state/host-status-contract.json
- Host contract: ../../../HOST_CONTRACT.md
- Entrypoint: ../../../AGENTS.md
- Context index: ../../../.looply/state/context-index.md
- Project context: ../../../.looply/custom/project-context.md
- Session context: ../../../.looply/custom/session-context.md
- Interaction policy: ../../../.looply/state/interaction-policy.json

## Purpose

This skill ensures the AI always discovers looply structured workflows before taking ad-hoc code actions. It acts as a priority gate for skill-aware tool selection.

## Priority Rules

1. **Skill-first routing**: Before any code generation, file edit, or architecture decision, scan the available looply skills and determine whether a structured workflow should take priority.
2. **Intent classification**: Map the user request to the most relevant skill:
   - Raw idea / feature request -> `looply-idea-to-prd`
   - Existing PRD -> `looply-prd-to-stories`
   - Story to implement -> `looply-story-to-production`
   - Cloud design questions -> `looply-cloud-workload-design`
   - Platform / infra questions -> `looply-platform-foundation-evolution`
   - Unknown where work stopped -> `looply-workflow-status` or `looply-resume`
   - Creating new looply skills -> `looply-skill-creator`
   - Unknown intent -> `looply` (root discovery)
3. **Workflow before ad-hoc**: If a looply workflow matches the user intent, invoke the corresponding skill. Only fall back to ad-hoc code actions when no workflow matches or when the user explicitly requests a direct code change.
4. **State awareness**: Before suggesting a workflow, check `.looply/custom/features/<feature-name>/workflow-status.md` for existing feature state.
5. **Session binding**: Use `.looply/custom/session-links.json` to bind the current session to the correct feature when resuming.

## Behavior

1. When the user's intent is unclear, load the `looply` root skill for discovery and routing.
2. When the user describes a software engineering task, check if a looply workflow stage is already in progress for that feature.
3. When suggesting tool usage, prefer looply workflow skills over raw code tools when structured delivery adds value.
4. When the user rejects workflow guidance, respect the decision and fall back to direct code action.
5. Do not force workflows for trivial, single-step operations.

## Execution Rules

1. Load this skill at the start of every session where developer intent involves software engineering tasks.
2. Scan available looply skills against the user's request before selecting tools.
3. If a workflow matches, load the corresponding skill and follow its execution rules.
4. If the user already has an active feature, check workflow state before proposing new work.
5. Generate user-facing outputs in pt-BR unless the user explicitly asks for another language.
6. For existing projects, use the real local codebase as the primary source of truth.
7. If context files are empty, draft, or stale, validate against the codebase before trusting them.
8. Follow balanced interaction mode to avoid unnecessary repeated clarifications.
9. Keep responses visually structured with clear Markdown sections.
10. Do not use emojis.
11. When context monitoring is enabled, track context health at feature transitions.

## Escalation

- Escalate unresolved routing decisions to the `looply` root skill.
- If no workflow matches and the task is complex, suggest `looply-idea-to-prd` to structure the work.
- If workflow state is stale or incomplete, suggest `looply-workflow-status` to reconcile.