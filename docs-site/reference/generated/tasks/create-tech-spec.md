# create-tech-spec

Produce a technical specification from an approved story and PRD context

## Ownership

- agent: `architect`

## Inputs

- `story`
- `prd`

## Context

- `architecture-principles`

## Outputs

- `tech-spec`

## Templates

- `tech-spec-template`

## Checklists

- `definition-of-done`

## Dependencies

- Nenhum item declarado.

## Conteudo do artefato

# Task: create-tech-spec

## Objective

Produzir uma especificacao tecnica clara, implementavel e revisavel a partir de uma story aprovada.

## Execution

Usar mais contexto e maior profundidade de raciocinio.

## Steps

1. Revisar PRD, story e baseline definido para o trabalho.
2. Identificar se o contexto e projeto novo ou projeto existente.
3. Confirmar se a execucao deve seguir baseline basico ou baseline de boas praticas completas.
4. Para projeto existente, entender e registrar a arquitetura atual, restricoes e padroes relevantes para consultas futuras.
5. Para projeto novo, propor arquitetura modular com DDD, Clean Architecture, TDD e ports and adapters como baseline.
6. Sugerir Node.js com NestJS quando a stack backend nao estiver definida; para frontend, sugerir React com shadcn/ui e ajustar a complexidade ao baseline escolhido, preferindo Next.js com TypeScript strict quando o baseline pedir stack mais completa; respeitar a stack informada quando ela ja estiver escolhida.
7. Sugerir PostgreSQL quando o banco nao estiver definido.
8. Definir Docker como baseline operacional, OpenAPI com Scalar para docs de API, estrategia inicial de autenticacao e baseline de renderizacao, estado, formularios, estilos e acessibilidade quando houver frontend.
9. No baseline avancado, avaliar filas, eventos e comunicacao async-first quando houver integracoes, jobs, processamento desacoplado ou necessidade de resiliencia e escala.
10. Representar a arquitetura preferencialmente com C4 quando isso reduzir ambiguidade.
11. Modelar componentes, contratos, persistencia, integracoes e estrategia de comunicacao sincrona ou assincrona.
12. Incluir diagrama Mermaid de dados quando houver modelo persistido, agregados ou entidades relevantes.
13. Incluir diagrama Mermaid do fluxo principal de request ou da comunicacao entre servicos quando houver interacao distribuida ou cadeia de processamento relevante.
14. Identificar riscos, observabilidade, rollout e dependencias tecnicas.

## Deliverables

- tech spec
- riscos
- decisoes tecnicas principais
- entendimento de arquitetura atual ou baseline de arquitetura inicial
- diagramas de arquitetura, dados e fluxo quando aplicavel
- tabela final da etapa com itens concluidos e pendentes

## Arquivo

- `packs/engineering-base/tasks/create-tech-spec.md`

[Voltar para tasks](../tasks)
