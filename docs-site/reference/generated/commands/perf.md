# perf

Inspect locally recorded looply performance sessions

## Arquivo de origem

- `src/commands/perf.ts`

## Options

- `--dir <dir>`: Target directory for perf trace data (defaults to current directory)
- `--limit <count>`: Maximum number of recent events to show
- `--json`: Print the workflow trace events as JSON
- `--source <source>`: Trace source such as manual or claude-hook
- `--host <host>`: Host name such as claude or codex
- `--feature <feature>`: Feature name
- `--workflow <workflow>`: Workflow name
- `--alias <alias>`: Workflow alias such as looply:story-to-production
- `--stage <stage>`: Workflow stage
- `--task <task>`: Workflow task
- `--artifact <artifact>`: Active artifact
- `--status <status>`: Checkpoint status
- `--notes <notes>`: Free-form notes

[Voltar para comandos](../commands)
