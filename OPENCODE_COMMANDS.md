# LOOPLY Commands

This file documents the looply workflow aliases for pack `software-delivery-suite`.
Default output locale: `pt-BR`.
Project mode: `existing-project`.
Interaction mode: `balanced`.

Alias handling for Codex:
- Treat `/looply:*` strings as operational aliases defined by looply.
- If slash command discovery does not expose them in the UI, still honor them when they appear in user messages.
- If the user asks for help, open the referenced command file first and explain syntax, arguments, example, expected output and next step.
- Read `.looply/state/context-index.md` to understand when context files are trustworthy and when the codebase must be inspected directly.
- When multiple sessions are open, use `session-label` and `.looply/custom/session-links.json` to reconnect the right feature.

Available aliases:
- `$looply-cloud-workload-design <feature-name> <scope-reference> [constraints...]`
  Define cloud topology, governance controls and cost posture for a workload change
  Reference: .looply/state/commands/opencode/looply:cloud-workload-design.md
- `$looply-critique <feature-name> [notes...]`
  Perform a deep critique and improvement of the current workflow step artifact with a terminal approval form
  Reference: .looply/state/commands/opencode/looply:critique.md
- `$looply-idea-to-prd <feature-name> [problem-statement] [constraints...]`
  Start discovery and consolidate an idea into an approved PRD
  Reference: .looply/state/commands/opencode/looply:idea-to-prd.md
- `$looply-next <feature-name> [session-label] [notes...]`
  Show the next recommended step for the current feature workflow
  Reference: .looply/state/commands/opencode/looply:next.md
- `$looply-platform-foundation-evolution <initiative-name> [constraints...]`
  Evolve shared platform foundation with guardrails, governance and cost review
  Reference: .looply/state/commands/opencode/looply:platform-foundation-evolution.md
- `$looply-prd-to-stories <feature-name> [prd-reference] [notes...]`
  Break an approved PRD into delivery-ready stories
  Reference: .looply/state/commands/opencode/looply:prd-to-stories.md
- `$looply-resume <feature-name> [session-label] [notes...]`
  Resume the current feature workflow from the persisted state
  Reference: .looply/state/commands/opencode/looply:resume.md
- `$looply-story-to-production <feature-name> <story-reference> [constraints...]`
  Execute delivery for a single approved story until release planning
  Reference: .looply/state/commands/opencode/looply:story-to-production.md
- `$looply-workflow-status <feature-name> [session-label] [notes...]`
  Inspect or resume the current status of a looply feature workflow
  Reference: .looply/state/commands/opencode/looply:workflow-status.md

Recommended sequence:
1. `$looply-idea-to-prd <feature-name> [problem-statement] [constraints...]`
2. `$looply-prd-to-stories <feature-name> [prd-reference] [notes...]`
3. `$looply-story-to-production <feature-name> <story-reference> [constraints...]`
4. `$looply-cloud-workload-design <feature-name> <scope-reference> [constraints...]` for workload cloud topology or async-first design
5. `$looply-platform-foundation-evolution <initiative-name> [constraints...]` for shared platform baselines and guardrails
6. `$looply-workflow-status <feature-name> [notes...]`