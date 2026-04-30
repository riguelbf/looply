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
- `packs/`: artefatos publicados (fonte)
- `.looply/managed/packs/`: packs gerenciados (runtime)
- `.looply/custom/features/`: features em progresso com estado de workflow persistido
- `.looply/state/`: arquivos de estado operacional (playbooks, hints, comandos)
- `platform/contracts/`: contratos formais do modelo de dados (agent, task, workflow, knowledge, squad)
- `tools/`: helpers de descoberta de codigo (.NET, Python)
- `docs-site/`: portal de documentacao

