---
schema: looply/task@v1
name: implement-api
agent: backend
summary: Describe how the backend agent should implement the approved API change
execution:
  profile: implementation
  reasoning_effort: high
  context_budget: large
  latency_priority: medium
  preferred_hosts:
    - codex
  model_hint:
    provider: openai
    family: gpt-5
inputs:
  - tech-spec
  - adr
context:
  - coding-standards
  - architecture-principles
outputs:
  - code-change
  - implementation-summary
templates:
  - implementation-summary-template
checklists:
  - code-review-checklist
dependencies:
  - create-tech-spec
---

# Task: implement-api

## Objective

Descrever claramente como o agente backend deve implementar a mudanca aprovada.

## Execution

Reservar budget maior de contexto para evitar perda de requisitos.

## Steps

1. Confirmar se o trabalho e em projeto novo ou existente e se o baseline aprovado e basico ou boas praticas completas.
2. Revisar story, tech spec, ADR e contratos afetados antes de tocar no codigo.
3. Para projeto existente, entender a arquitetura atual, mapear ownership e registrar o entendimento para reutilizacao futura.
4. Para projeto novo, estruturar a implementacao com modularizacao por dominio, DDD, Clean Architecture, TDD e ports and adapters.
5. Se a stack nao estiver definida para projeto novo, sugerir Node.js com NestJS; se ja estiver definida, respeitar a tecnologia informada mantendo as mesmas praticas.
6. Se o banco nao estiver definido, sugerir PostgreSQL.
7. Considerar Docker como baseline operacional, OpenAPI com Scalar para docs e autenticacao basica como default quando autenticacao inicial for necessaria e ainda nao estiver definida.
8. Validar impacto em contrato, persistencia, integracoes, jobs e observabilidade.
9. Implementar a mudanca no menor recorte possivel, preservando handlers finos, dominio rico e comportamento testavel.
10. Atualizar testes relevantes, fixtures, migracoes, docs e artefatos operacionais quando necessario.
11. Registrar resumo de implementacao com entendimento arquitetural, riscos residuais, compatibilidade, pontos de rollout e contrato explicito de handoff.

## Constraints

- nao inventar regra de negocio
- escalar gaps estruturais para architect
- nao alterar contrato sem indicar compatibilidade e migracao
- nao introduzir persistencia ou integracao nova sem explicitar impacto operacional

## Done Criteria

- comportamento aprovado implementado no modulo correto
- entendimento da arquitetura atual registrado quando o projeto for existente
- baseline de stack e arquitetura registrado quando o projeto for novo
- validacao, erros e contratos atualizados de forma explicita
- testes relevantes cobrindo caminho feliz e cenarios criticos
- risco operacional, rollout e follow-ups registrados quando aplicavel
- handoff contract preenchido com receiver, readiness, blockers, next command e artefatos exigidos
- fechamento da etapa com tabela de concluidos e pendentes
