# integrations

Manage external integration contexts for looply

## Arquivo de origem

- `src/commands/integrations.ts`

## Options

- `--dir <dir>`: Target directory for the current project (defaults to current directory)
- `--category <category>`: Integration category such as payments or internal-api
- `--owner <owner>`: Integration owner such as billing-platform
- `--status <status>`: Context status such as draft or active
- `--coverage <coverage>`: Context coverage such as low, medium or high
- `--purpose <purpose>`: Short purpose for the integration
- `--touchpoints <items>`: Comma-separated codebase touchpoints
- `--env-refs <items>`: Comma-separated environment variable references
- `--secret-refs <items>`: Comma-separated secret references
- `--adapter-refs <items>`: Comma-separated future adapter references
- `--related-artifacts <items>`: Comma-separated related workflows, stories or features
- `--yes`: Skip confirmation and use resolved values

[Voltar para comandos](../commands)
