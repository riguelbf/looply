# Arquitetura

## Camadas

### Core

- artefatos Markdown com frontmatter
- validacao
- regras de contexto
- metadados de execucao

### Publishing

- adapters por host
- materializacao de arquivos nativos
- `install`, `sync`, `upgrade`, `doctor`

### Operation

- comandos CLI
- contexto de projeto, feature, sessao e integracoes
- workflow status e retomada de sessoes

## Modulos do repositorio

- `src/commands/`: superficie da CLI
- `src/lib/`: contratos, helpers e fluxos compartilhados
- `src/hosts/`: adapters e publicacao por host
- `src/validation/`: validacao de packs
- `packs/`: artefatos publicados
- `docs-site/`: portal de documentacao

