---
description: Show looply commands and the recommended workflow sequence
argument-hint: [command-name]
---

looply help for pack `software-delivery-suite`.

Available commands:
- `/looply:cloud-workload-design <feature-name> <scope-reference> [constraints...]`
  Define cloud topology, governance controls and cost posture for a workload change
  Reference: @./looply:cloud-workload-design.md
- `/looply:idea-to-prd <feature-name> [problem-statement] [constraints...]`
  Start discovery and consolidate an idea into an approved PRD
  Reference: @./looply:idea-to-prd.md
- `/looply:next <feature-name> [session-label] [notes...]`
  Show the next recommended step for the current feature workflow
  Reference: @./looply:next.md
- `/looply:platform-foundation-evolution <initiative-name> [constraints...]`
  Evolve shared platform foundation with guardrails, governance and cost review
  Reference: @./looply:platform-foundation-evolution.md
- `/looply:prd-to-stories <feature-name> [prd-reference] [notes...]`
  Break an approved PRD into delivery-ready stories
  Reference: @./looply:prd-to-stories.md
- `/looply:resume <feature-name> [session-label] [notes...]`
  Resume the current feature workflow from the persisted state
  Reference: @./looply:resume.md
- `/looply:story-to-production <feature-name> <story-reference> [constraints...]`
  Execute delivery for a single approved story until release planning
  Reference: @./looply:story-to-production.md
- `/looply:workflow-status <feature-name> [session-label] [notes...]`
  Inspect or resume the current status of a looply feature workflow
  Reference: @./looply:workflow-status.md

Recommended sequence:
1. `/looply:idea-to-prd <feature-name> [problem-statement] [constraints...]`
2. `/looply:prd-to-stories <feature-name> [prd-reference] [notes...]`
3. `/looply:story-to-production <feature-name> <story-reference> [constraints...]`
4. `/looply:cloud-workload-design <feature-name> <scope-reference> [constraints...]` for workload cloud topology or async-first design
5. `/looply:platform-foundation-evolution <initiative-name> [constraints...]` for shared platform baselines and guardrails
6. `/looply:workflow-status <feature-name> [notes...]`

Help behavior:
- If the user passes a command name like `idea-to-prd`, explain only that command.
- Resolve the command using the reference list above.
- Return syntax, arguments, example, expected output and suggested next step.
- Do not execute workflows while answering help.
- Default user-facing language: `en`.
- Project mode: `existing-project`.
- Interaction mode: `balanced`.
- Context priority is defined in `.looply/state/context-index.md`.
- When multiple sessions are open, use `session-label` and `.looply/custom/session-links.json` to reconnect the right feature.