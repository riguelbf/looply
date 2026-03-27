# implement-frontend

Describe how the frontend agent should implement the approved UI or client application change

## Ownership

- agent: `frontend`

## Inputs

- `tech-spec`
- `adr`

## Context

- `coding-standards`
- `architecture-principles`

## Outputs

- `code-change`
- `implementation-summary`

## Templates

- `implementation-summary-template`

## Checklists

- `code-review-checklist`

## Dependencies

- `create-tech-spec`

## Conteudo do artefato

# Task: implement-frontend

## Objective

Descrever claramente como o agente frontend deve implementar a mudanca aprovada.

## Execution

Reservar budget maior de contexto para manter coesao de modulo, consistencia visual e integridade de dados.

## Steps

1. Confirmar se o trabalho e em projeto novo ou existente e se o baseline aprovado e basico ou boas praticas completas.
2. Revisar story, tech spec, ADR e contratos afetados antes de tocar no codigo.
3. Para projeto existente, entender a arquitetura atual, mapear ownership e registrar o entendimento para reutilizacao futura.
4. Para projeto novo, estruturar a implementacao por modulos de features, design system, separacao de estado e estrategia de testes em nivel proporcional ao baseline escolhido.
5. Se a tecnologia nao estiver definida, sugerir React com shadcn/ui; quando o baseline for simples, manter a stack base reduzindo complexidade; quando o baseline for mais completo, preferir Next.js com TypeScript strict.
6. Definir abordagem de renderizacao, dados, forms, estilos, acessibilidade e instrumentacao.
7. Validar impacto em UX, contrato, cache, loading states, error states, analytics e performance.
8. Implementar a mudanca no menor recorte possivel, preservando componentes coesos, hooks claros e fronteiras bem definidas.
9. Atualizar testes relevantes, schemas, docs e artefatos operacionais quando necessario.
10. Registrar resumo de implementacao com entendimento arquitetural, riscos residuais, acessibilidade, performance, pontos pendentes e contrato explicito de handoff.

## Constraints

- nao inventar regra de negocio
- nao concentrar regra critica apenas no cliente
- nao alterar stack existente sem aprovacao explicita
- no baseline simples, nao introduzir estrutura ou dependencias alem do que o recorte pede
- nao usar estado global quando estado local, server state ou composicao resolverem melhor

## Done Criteria

- comportamento aprovado implementado no modulo correto
- entendimento da arquitetura atual registrado quando o projeto for existente
- baseline de stack e arquitetura registrado quando o projeto for novo
- estado local e estado de servidor tratados explicitamente
- acessibilidade, feedback visual e responsividade cobertos no recorte
- testes relevantes cobrindo caminho feliz e cenarios criticos
- risco operacional, performance e follow-ups registrados quando aplicavel
- handoff contract preenchido com receiver, readiness, blockers, next command e artefatos exigidos
- fechamento da etapa com tabela de concluidos e pendentes

## Arquivo

- `packs/engineering-base/tasks/implement-frontend.md`

[Voltar para tasks](../tasks)
