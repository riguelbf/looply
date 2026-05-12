---
schema: looply/template@v1
name: tech-spec-template
summary: Template for technical specification
---

# Tech Spec

## Context

## Goal

## Project Baseline

## Delivery Mode

## Scope

## Out Of Scope

## Current Architecture Understanding

## Recommended Stack

## Requirements Mapping

## Architecture

Preferir C4 para contexto, containers e componentes quando esses niveis ajudarem a explicar a solucao.

## Architecture Diagrams

### C4 Context

```mermaid
flowchart LR
  user[User]
  system[System]
  external[External System]
  user --> system
  system --> external
```

### C4 Container

```mermaid
flowchart LR
  client[Client]
  api[API Container]
  worker[Worker Container]
  db[(PostgreSQL)]
  client --> api
  api --> db
  api --> worker
```

### C4 Component

```mermaid
flowchart LR
  controller[Controller or Entry Adapter]
  usecase[Use Case]
  port[Output Port]
  adapter[Adapter]
  controller --> usecase
  usecase --> port
  port --> adapter
```

## Components

## Data And Contracts

## Communication Strategy

Explicitar quando o fluxo sera sincronico, assincrono ou hibrido. No baseline avancado, justificar uso de filas, eventos, retries, idempotencia e consistencia eventual quando aplicavel.

## Data Model Diagram

Usar Mermaid para entidades, agregados, relacionamentos e fronteiras de persistencia relevantes.

```mermaid
erDiagram
  ENTITY_ONE ||--o{ ENTITY_TWO : relates_to
```

## Authentication Strategy

## Documentation Strategy

## Sequence Diagrams

Diagramas de sequencia OBRIGATORIOS para cada fluxo principal. Devem mostrar participantes, mensagens, condicoes de erro e rollback.

### Fluxo Principal (ex: criacao de recurso)

```mermaid
sequenceDiagram
  participant Client
  participant Controller
  participant UseCase
  participant Repository
  participant DB
  participant ExternalService

  Client->>Controller: HTTP Request
  Controller->>Controller: Validate input
  alt Invalid input
    Controller-->>Client: 422 Validation Error
  else Valid input
    Controller->>UseCase: execute(dto)
    UseCase->>Repository: findExisting()
    Repository->>DB: SELECT query
    DB-->>Repository: result
    alt Conflict found
      UseCase-->>Controller: Domain Error
      Controller-->>Client: 409 Conflict
    else No conflict
      UseCase->>Repository: save(entity)
      Repository->>DB: INSERT/UPDATE
      DB-->>Repository: ok
      UseCase->>ExternalService: notify()
      ExternalService-->>UseCase: acknowledged
      UseCase-->>Controller: Output DTO
      Controller-->>Client: 201 Created
    end
  end
```

### Fluxos Alternativos

Descrever e diagramar cada fluxo alternativo (erro, fallback, retry, compensacao).

### Fluxo de Erro e Rollback

```mermaid
sequenceDiagram
  participant Client
  participant API
  participant UseCase
  participant Queue

  Client->>API: Request
  API->>UseCase: execute()
  UseCase->>Queue: enqueue(event)
  Queue-->>UseCase: error (unavailable)
  UseCase-->>API: Operation Failed
  API-->>Client: 503 Service Unavailable
```

## Class And Object Relationship Diagram

Diagrama OBRIGATORIO mostrando classes, objetos, agregados e seus relacionamentos para o escopo da story. Usar Mermaid classDiagram.

```mermaid
classDiagram
  class Entity {
    +String id
    +DateTime createdAt
    +DateTime updatedAt
  }

  class AggregateRoot {
    +String businessId
    +validate()
    +execute()
  }

  class ValueObject {
    +String value
    +equals()
  }

  class RepositoryInterface {
    <<interface>>
    +save(entity)
    +findById(id)
    +findByCriteria(criteria)
  }

  class UseCase {
    +execute(input)
    -validate()
  }

  class Adapter {
    +handle(request)
  }

  Entity <|-- AggregateRoot : extends
  AggregateRoot *-- ValueObject : composed of
  UseCase ..> RepositoryInterface : depends on
  UseCase ..> AggregateRoot : creates/loads
  Adapter ..> UseCase : calls
```

## File Tree

Arvore de arquivos a serem CRIADOS, MODIFICADOS e REMOVIDOS neste ciclo de implementacao.

```
src/
  modules/<feature>/
    controllers/
      <name>.controller.ts        [CREATE]
      <name>.controller.spec.ts   [CREATE]
    use-cases/
      <name>.use-case.ts          [CREATE]
      <name>.use-case.spec.ts     [CREATE]
    domain/
      entities/
        <name>.entity.ts          [CREATE]
      value-objects/
        <name>.vo.ts              [CREATE]
      repositories/
        <name>.repository.interface.ts  [CREATE]
    infra/
      repositories/
        <name>.repository.impl.ts [CREATE]
      adapters/
        <name>.adapter.ts         [CREATE]
    <name>.module.ts              [MODIFY] - registrar novo controller e providers

  tests/
    integration/
      <name>.integration.spec.ts  [CREATE]

db/
  migrations/
    <timestamp>-<description>.sql [CREATE]
```

### Legenda

| Simbolo | Significado |
|---|---|
| [CREATE] | Arquivo novo a ser criado |
| [MODIFY] | Arquivo existente a ser alterado |
| [DELETE] | Arquivo a ser removido |

## Operational Considerations

## Risks

## Decisions

## Implementation Plan

## Testing Strategy

## Rollout Notes

## Completion Table

| Item | Status | Notes |
| --- | --- | --- |
| Architecture baseline | Done |  |
| Data model | Pending |  |
| Sequence diagrams | Pending |  |
| Class/object relationships | Pending |  |
| File tree | Pending |  |
| Request or service flow | Pending |  |
