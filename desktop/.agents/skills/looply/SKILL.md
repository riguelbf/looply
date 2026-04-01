---
name: looply
description: Use when the user asks what looply can do, how to start a workflow, which workflow to use, or how to continue a feature in Codex.
---

Use this skill as the main entrypoint for Looply inside Codex.

Primary references:
- Workflow playbook: ../../../.looply/state/workflow-playbook.codex.md
- Command index: ../../../LOOPLY_COMMANDS.md
- Project contract: ../../../AGENTS.md

When to use:
- The user does not know which looply workflow to start.
- The user asks how to continue a feature.
- The user wants the available looply workflows.
- The user asks for help with looply in Codex.

Behavior:
1. If the user asks what Looply can do, list the available workflows and when to use each one.
2. If the user describes a raw idea, recommend `idea-to-prd`.
3. If the user already has a PRD, recommend `prd-to-stories`.
4. If the user already has a story and wants to implement, recommend `story-to-production`.
5. If the user needs cloud topology, async-first trade-offs, governance or workload cost direction, recommend `cloud-workload-design`.
6. If the user needs shared platform baselines, guardrails, pipelines or foundation evolution, recommend `platform-foundation-evolution`.
7. If the user wants to know where work stopped, recommend `workflow-status`, `resume` or `next`.
8. Before routing to a specialist, inspect the agent `knowledge_sources`, especially specialist `best-practices` files.
9. If the current task declares templates or checklists, treat them as the default artifact contract and quality bar.
10. Prefer explicit next-step guidance over generic explanations.
11. Use en for user-facing responses unless the user explicitly asks for another language.
12. Respect project mode existing-project and interaction mode balanced.

Available workflows:
- `$looply-cloud-workload-design <feature-name> <scope-reference> [constraints...]`
  Define cloud topology, governance controls and cost posture for a workload change
- `$looply-idea-to-prd <feature-name> [problem-statement] [constraints...]`
  Start discovery and consolidate an idea into an approved PRD
- `$looply-next <feature-name> [session-label] [notes...]`
  Show the next recommended step for the current feature workflow
- `$looply-platform-foundation-evolution <initiative-name> [constraints...]`
  Evolve shared platform foundation with guardrails, governance and cost review
- `$looply-prd-to-stories <feature-name> [prd-reference] [notes...]`
  Break an approved PRD into delivery-ready stories
- `$looply-resume <feature-name> [session-label] [notes...]`
  Resume the current feature workflow from the persisted state
- `$looply-story-to-production <feature-name> <story-reference> [constraints...]`
  Execute delivery for a single approved story until release planning
- `$looply-workflow-status <feature-name> [session-label] [notes...]`
  Inspect or resume the current status of a looply feature workflow

Recommended sequence:
1. `$looply-idea-to-prd <feature-name> [problem-statement] [constraints...]`
2. `$looply-prd-to-stories <feature-name> [prd-reference] [notes...]`
3. `$looply-story-to-production <feature-name> <story-reference> [constraints...]`
4. `$looply-cloud-workload-design <feature-name> <scope-reference> [constraints...]` when cloud topology, async-first or governance is the main problem
5. `$looply-platform-foundation-evolution <initiative-name> [constraints...]` when shared platform baseline or guardrails are the main problem
6. `$looply-workflow-status <feature-name> [notes...]`

Presentation rules:
- Use clear Markdown section titles.
- Prefer concise recommendations.
- Do not use emojis.