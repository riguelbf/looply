# project-conventions

Commit style, PR process, branching strategy and release conventions

## Metadados

- category: `project-conventions`
- priority: `medium`

## Aplica-se a

- `all`

## Tags

- `process`
- `collaboration`
- `conventions`

## Conteudo do artefato

# Project Conventions

## Purpose

Define project-level conventions for collaboration that agents must follow when interacting with version control, pull requests and releases.

## Rules

- Follow the project's established branching strategy.
- Write clear, descriptive commit messages.
- PRs must include a summary of changes and link to the relevant story.
- Do not commit generated files or build artifacts.
- Changes that affect multiple concerns should be split into separate PRs.

## Examples

- Good commit: `feat: add retry logic to payment processing`
- Bad commit: `fix stuff`

## Enforcement

- Branch protection rules enforce review requirements.
- CI checks run on every PR.
- Commit message convention enforced via hooks or CI.

## Arquivo

- `packs/engineering-base/rules/project-conventions.md`

[Voltar para rules](../rules)
