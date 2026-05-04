# Looply Claude Hooks

Use these files only when you want local workflow tracing while running Claude Code commands such as `/looply:story-to-production`.

## What this does

- starts a local workflow trace when a prompt begins with `/looply:`
- records intermediate checkpoints for Claude tool execution
- finishes the active trace when Claude stops responding
- writes events to `.looply/state/perf-workflow-events.jsonl`

## Requirements

- the `looply` CLI must be available in PATH
- set `LOOPLY_PERF=1` or `LOOPLY_PERF=context` before starting Claude Code
- merge the example config from `.claude/settings.looply-perf.example.json` into your active Claude settings file

## Suggested events

- `UserPromptSubmit`: starts trace for `/looply:...`
- `PreToolUse`: records a checkpoint before a Claude tool runs
- `PostToolUse`: records a checkpoint after a Claude tool runs
- `Stop`: finishes the active trace

## Inspecting the trace

```bash
looply perf trace summary --dir .
looply perf trace summary --dir . --json
```

## Helper script

- `.claude/hooks/looply-perf-hook.mjs`
