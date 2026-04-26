# looply Host Contract

## Purpose

This document is the host-facing operating contract for looply. The host reasons, the CLI executes, and the workflow state is the memory.

## Responsibilities

- Read the persisted workflow state before asking for more context.
- Choose a single next action per cycle.
- Prefer the smallest possible command or edit that advances the current stage.
- Persist the result before planning the next step.
- Use the real codebase as the source of truth when context artifacts are stale or incomplete.

## Autonomous Loop

1. Read `workflow-status.md` and the relevant snapshots.
2. Decide whether the next step is discovery, planning, delivery, reconciliation, or recovery.
3. Execute one action through the CLI or a direct file edit.
4. Verify the result against the stage outputs and gate rules.
5. Persist the updated state and repeat until the workflow is blocked or complete.

For a single autonomous cycle, the host may use `looply autonomy <feature>` to derive the next action and record the decision state.

## Execution Policy

- Balanced and guided modes must ask for confirmation before high-risk or destructive actions.
- Autonomous mode can proceed without repeated confirmations for low-risk actions.
- Never skip a blocking gate.
- Never reprocess the full repository if the snapshots already contain enough state.
- Never hide the next action from the persisted workflow state.
- Never mutate feature state without leaving a written trace.

## Token Discipline

- Keep the context window small.
- Prefer summaries over full-history replays.
- Treat snapshots and persisted state as memory outside the prompt.
- Re-read only the files that changed since the last cycle.

## Stop Conditions

- The current gate is blocked.
- The next action requires human approval.
- The workflow outputs are complete.
- The required context is stale and the real codebase must be inspected first.
