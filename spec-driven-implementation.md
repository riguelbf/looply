# LOOPLY - Spec Driven Implementation Plan

## Premissas fechadas

- A CLI da v1 nao chama LLM diretamente.
- A CLI funciona como instalador, validador, catalogo e executor local de artefatos.
- O formato principal de artefato e Markdown com frontmatter YAML.
- O output principal da v1 e arquivo Markdown.
- Tasks podem gerar artefatos e, quando apropriado, acionar agentes que editam codigo.
- O fluxo a ser provado e ponta a ponta: ideia -> especificacao -> implementacao -> review -> publicacao.
- `validate` entra antes de `task run` e `workflow run` na jornada do produto.

## Tese do produto

O produto nao deve nascer como "uma CLI de agentes". Ele deve nascer como um instalador operacional de um framework interno de engenharia assistida por IA.

Na pratica, a CLI precisa fazer 4 coisas muito bem na v1:

1. Instalar uma estrutura padrao no repositorio.
2. Validar se a estrutura e os artefatos estao corretos.
3. Expor catalogo e contratos do que existe.
4. Executar tasks e workflows locais de forma previsivel.

## Forma correta de pensar a v1

### O que a CLI e

- instalador de framework local
- resolvedor de artefatos
- executor de contratos
- validador de estrutura
- base de distribuicao futura para squads e especializacoes

### O que a CLI nao e na v1

- orchestrator autonomo multi-LLM
- chat interface
- sistema de inferencia automatica de dominio
- plataforma SaaS

## Decisoes de arquitetura

### Modelo de execucao

Cada `task` e um contrato declarativo com:

- metadados
- argumentos
- dependencias
- contexto requerido
- template(s)
- output esperado
- modo de execucao

O `modo de execucao` deve suportar desde cedo dois tipos:

- `artifact`
  - gera Markdown a partir de template + inputs + contexto
- `agent`
  - prepara o pacote de contexto e delega a execucao para um agente externo/local do ambiente

Isso preserva a sua decisao de nao acoplar a v1 a uma LLM, mas nao fecha a porta para tasks que levem a implementacao real.

### Contrato de artefato

Todos os artefatos principais devem usar:

```md
---
schema: looply/task@v1
name: create-tech-spec
description: Criar especificacao tecnica
agent: architect
mode: artifact
args:
  input:
    type: file
    required: true
  output:
    type: file
    required: true
  context:
    type: list
    required: false
outputs:
  primary:
    type: markdown_file
---
```

O corpo em Markdown carrega:

- objetivo
- pre-requisitos
- passos
- regras
- checklist
- template associado

### Ordem de validacao

`validate` nao pode ser tardio.

A ordem correta da v1 e:

1. `init`
2. `doctor`
3. `validate`
4. `list`
5. `task run`
6. `workflow run`

Sem isso, voce cria executor em cima de artefato instavel.

### Contexto

Precedencia recomendada:

1. `core`
2. `project`
3. `squad`
4. `runtime args`

Regra:

- camada mais especifica sobrescreve a mais generica
- conflitos explicitos geram warning
- `workflow run` deve exibir quais arquivos de contexto foram resolvidos

## Stack recomendada

Como a CLI e praticamente um instalador com contratos locais, eu usaria stack moderna e simples:

- `TypeScript`
- `Node.js 22+`
- `tsx` para desenvolvimento local
- `commander` para CLI
- `zod` para schemas e validacao
- `gray-matter` para frontmatter Markdown
- `yaml` para serializacao
- `fs-extra` para filesystem ergonomico
- `globby` para descoberta de artefatos
- `handlebars` para templates
- `chalk` para output legivel
- `ora` para feedback de execucao
- `vitest` para testes
- `execa` para integracoes locais futuras

### Observacao sobre framework de CLI

`commander` e suficiente e previsivel para esse produto.

Se quiser UX de CLI mais rica no futuro:

- `clipanion` tambem faria sentido

Eu evitaria framework pesado demais agora.

## Estrutura de projeto sugerida

```text
looply/
  package.json
  tsconfig.json
  src/
    cli/
      main.ts
      commands/
        init.ts
        doctor.ts
        validate.ts
        list.ts
        task-run.ts
        workflow-run.ts
    application/
      services/
        init-service.ts
        doctor-service.ts
        validation-service.ts
        task-runner.ts
        workflow-runner.ts
    domain/
      artifacts/
        agent.ts
        task.ts
        workflow.ts
        squad.ts
      contracts/
        execution-result.ts
        validation-result.ts
    infrastructure/
      fs/
      templates/
      parsing/
      logging/
    loaders/
      artifact-loader.ts
      context-loader.ts
      registry-loader.ts
    schemas/
      agent-schema.ts
      task-schema.ts
      workflow-schema.ts
      squad-schema.ts
    scaffolding/
    reverse-engineering/
  templates/
    install/
      .company-ai/
  docs/
    specs/
    adr/
    releases/
```

## Slices de implementacao

### Slice 0 - Normalize the source of truth

Objetivo:

- separar exploracao de especificacao

Entregaveis:

- `docs/specs/prd.md`
- `docs/adr/0001-execution-model.md`
- `docs/specs/artifact-contracts.md`
- `docs/releases/release-1.md`

Aceite:

- deixa claro que v1 nao chama LLM
- define `mode: artifact | agent`
- define output em Markdown
- define ordem `validate -> run`

Commit:

- `docs(spec): normalize product scope and execution contracts`

### Slice 1 - Installer foundation

Objetivo:

- instalar a base do framework no repo alvo

Comandos:

- `looply init`
- `looply doctor`

Aceite:

- cria `.company-ai/`
- cria artefatos basicos
- nao sobrescreve por padrao
- `doctor` aponta faltas com exit code nao zero

Commit:

- `feat(cli): add init and doctor commands`

### Slice 2 - Validation first

Objetivo:

- validar estrutura antes de qualquer execucao

Comandos:

- `looply validate`

Aceite:

- valida schemas
- valida links internos
- valida dependencias
- valida frontmatter
- roda sem executar task

Commit:

- `feat(validate): add artifact and reference validation`

### Slice 3 - Catalog and inspect

Objetivo:

- tornar o framework descobrivel

Comandos:

- `looply list agents`
- `looply list tasks`
- `looply list workflows`
- `looply inspect <type> <name>`

Aceite:

- suporta filtro por squad
- suporta JSON
- mostra origem do artefato

Commit:

- `feat(registry): add list and inspect commands`

### Slice 4 - Task runner

Objetivo:

- executar task local depois da validacao

Comandos:

- `looply task run <task-name>`

Aceite:

- exige validacao ou valida implicitamente antes
- resolve args
- resolve contexto
- gera arquivo Markdown
- informa template e contexto usados

Commit:

- `feat(task-runner): execute artifact tasks with context resolution`

### Slice 5 - Workflow runner

Objetivo:

- encadear a jornada ponta a ponta

Comandos:

- `looply workflow run <workflow-name>`

Aceite:

- resolve steps em ordem
- propaga outputs
- identifica step que falhou
- escreve artefatos intermediarios

Commit:

- `feat(workflow): add sequential workflow execution`

### Slice 6 - Agent mode contract

Objetivo:

- preparar tasks que dependam de agente de implementacao ou review

Entregaveis:

- suporte a `mode: agent`
- contrato de entrada e saida para tasks que podem editar codigo

Aceite:

- task pode declarar que produz `code_change`, `markdown_file` ou ambos
- workflow aceita steps mistos `artifact` e `agent`
- CLI nao implementa a LLM, apenas prepara contexto e contrato de execucao

Commit:

- `feat(execution): add agent-mode task contract`

### Slice 7 - Publishing path

Objetivo:

- fechar a jornada ate publicacao

Tasks minimas:

- `analyze-requirement`
- `create-tech-spec`
- `implement-api`
- `review-code`
- `prepare-release`
- `publish-service`

Workflow inicial:

- `idea-to-production`

Aceite:

- cobre da ideia a publicacao
- gera artefatos intermediarios
- deixa claro o ponto em que codigo pode ser alterado

Commit:

- `feat(workflows): add end-to-end idea-to-production flow`

### Slice 8 - Installer positioning

Objetivo:

- tratar a CLI como produto de adocao

Entregaveis:

- quickstart de 10 minutos
- template de repositorio alvo
- modo `--dry-run`

Commit:

- `docs(onboarding): add quickstart and dry-run installer flow`

## Ordem de implementacao recomendada

1. `Slice 0`
2. `Slice 1`
3. `Slice 2`
4. `Slice 3`
5. `Slice 4`
6. `Slice 5`
7. `Slice 6`
8. `Slice 7`
9. `Slice 8`

## Release 1 realista

A release inicial deve provar:

- um repo consegue instalar a base
- a base consegue ser validada
- tasks declarativas geram Markdown util
- workflows encadeiam a jornada
- existe contrato para steps de implementacao e review

Nao precisa provar ainda:

- reverse engineering
- squad install
- upgrade
- marketplace
- telemetria

## Dificuldades e duvidas ainda abertas

### 1. Como uma task em `mode: agent` executa de fato?

Voce ja decidiu que a CLI nao chama LLM na v1. Entao faltam duas opcoes:

- a CLI apenas gera um pacote de execucao para um agente externo consumir
- a CLI chama um adapter local posterior, mas isso entra so na v2

Minha sugestao:

- v1 prepara o pacote e registra o contrato
- v2 adiciona adapters

### 2. Publicacao significa o que exatamente?

Se o fluxo vai ate publicacao, precisa fechar o escopo:

- gerar plano de release?
- abrir checklist?
- rodar script de deploy?
- criar PR?

Minha sugestao:

- v1 termina em `prepare-release` e `publish-service` como task contratual local
- a execucao real de deploy pode inicialmente ser script delegado

### 3. Qual repo sera o alvo piloto?

Isso muda bastante:

- se o piloto for simples, foque em `architecture-squad`
- se for dominio sensivel, como payments, o custo de especificacao sobe muito

Minha sugestao:

- provar mecanica em um repo menos sensivel
- depois plugar `payments-squad`

## Recomendacao objetiva

O melhor caminho agora e:

1. separar o PRD do brainstorm
2. fechar `artifact contracts`
3. implementar `init`, `doctor` e `validate`
4. so depois entrar em `task run` e `workflow run`
5. deixar `mode: agent` pronto no contrato antes de falar de implementacao e publicacao ponta a ponta

## Commits sugeridos

- `docs(spec): normalize product scope and execution contracts`
- `feat(cli): add init and doctor commands`
- `feat(validate): add artifact and reference validation`
- `feat(registry): add list and inspect commands`
- `feat(task-runner): execute artifact tasks with context resolution`
- `feat(workflow): add sequential workflow execution`
- `feat(execution): add agent-mode task contract`
- `feat(workflows): add end-to-end idea-to-production flow`
- `docs(onboarding): add quickstart and dry-run installer flow`
