# install

Install a looply pack into one or more target hosts

## Arquivo de origem

- `src/commands/install.ts`

## Options

- `--host <host>`: Target host list such as codex,claude
- `--scope <scope>`: Installation scope such as project or global
- `--pack <pack>`: Pack name
- `--locale <locale>`: Output locale such as pt-BR or en
- `--project-mode <mode>`: Project mode such as existing-project or greenfield
- `--interaction-mode <mode>`: Interaction mode such as guided, balanced or autonomous
- `--dir <dir>`: Target directory for project scope install (defaults to current directory)
- `--source-root <dir>`: looply source directory that contains packs/
- `--yes`: Skip confirmation and use resolved values

[Voltar para comandos](../commands)
