# Platform Model

## Core Entities

- `agent`
- `task`
- `workflow`
- `squad`
- `knowledge`
- `template`
- `checklist`
- `pack`

## Entity Rules

### Agent

Representa uma capacidade operacional com papel, fronteiras e fontes de conhecimento.

Subagentes nao existem como entidade propria do core. Especializacao e modelada como:

- `parent_agent`
- `specialization`

### Task

Task e um artefato Markdown. Ela descreve como um agente deve atuar. Nao e executada pelo runtime do LOOPLY.

### Workflow

Workflow e um artefato Markdown. Ele descreve coordenacao entre tasks com handoff explicito no frontmatter e no corpo.

### Squad

Squad e um pacote modular de dominio, composto por agents, tasks, workflows, knowledge, templates e checklists.

### Pack

Pack e a unidade de distribuicao do LOOPLY. Um squad pode ser distribuido como pack.

## Execution Metadata

Artefatos podem incluir um bloco `execution` para orientar escolha de modelo e custo no host sem acoplar o core a um provider especifico.

Campos recomendados:

- `profile`
- `reasoning_effort`
- `context_budget`
- `latency_priority`
- `preferred_hosts`
- `model_hint`

Perfis conhecidos na validacao atual:

- `structured-analysis`
- `implementation`
- `review`
- `publishing`

## Storage Model

O modelo canonico do LOOPLY vive no repositorio em:

- `src/`
- `packs/`
- `platform/contracts/`

Quando instalado em um host, a estrutura gerada deve separar:

- arquivos gerenciados pelo LOOPLY
- customizacoes do usuario
- arquivos de entrada nativos do host

## Sync Model

Sync incremental acontece por arquivo, com ownership explicito:

- `managed`
- `mergeable`
- `custom`

## Validation Model

Nenhum pack deve ser publicado sem:

- validacao de schema
- validacao de referencias
- validacao de dependencias
- validacao de nomes unicos

## Implementation Stack

A implementacao ativa do projeto e em Node.js com TypeScript.

O desenho operacional segue port and adapters:

- portas pequenas para comportamento que varia
- adapters por host para publicacao e diagnostico
- core mantendo contratos e modelos canonicos

O codigo operacional fica em:

- `src/commands/`
- `src/lib/`
- `src/hosts/`
- `src/ui/`
- `src/validation/`
