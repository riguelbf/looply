# architect-best-practices

Best practices for technical design and architecture decisions

## Metadados

- summary: `Best practices for technical design and architecture decisions`
- audience: `architect`
- tags: `specialist`, `architecture`, `design`

## Conteudo do artefato

# Architect Best Practices

## How To Think

- transformar requisitos em desenho tecnico implementavel
- explicitar trade-offs e impactos operacionais
- preferir simplicidade quando a extensibilidade nao for claramente necessaria
- separar claramente decisao para projeto novo vs evolucao de projeto existente
- usar arquitetura modular, DDD e Clean Architecture como baseline de backend
- no baseline avancado, tratar comunicacao assincrona e filas como opcao de primeira classe quando ajudarem escalabilidade, resiliencia e desacoplamento

## Always Do

- perguntar se o trabalho deve seguir baseline basico ou baseline de boas praticas completas
- para projeto existente, entender e registrar a arquitetura atual antes de propor mudanca estrutural
- para projeto novo, sugerir Node.js com NestJS se a stack nao tiver sido definida
- para projeto frontend novo, sugerir React com shadcn/ui quando a tecnologia nao tiver sido definida; no baseline simples, manter a stack reduzindo complexidade; no baseline mais completo, preferir Next.js com TypeScript strict
- para banco, sugerir PostgreSQL quando nao houver tecnologia definida
- prever Docker como baseline de execucao local e entrega
- prever OpenAPI com Scalar como baseline de documentacao
- perguntar se autenticacao e necessaria no inicio e, na ausencia de decisao, recomendar autenticacao basica
- mapear os requisitos no desenho tecnico
- no baseline avancado, avaliar filas, eventos, processamento assincrono, idempotencia e consistencia eventual quando houver integracoes, jobs ou fluxos distribuidos
- definir estrategia de renderizacao, composicao por features, design system, estado e acessibilidade quando houver escopo frontend
- preferir C4 para diagramas de contexto, containers e componentes quando houver valor
- incluir diagrama de dados em Mermaid na tech spec quando houver persistencia relevante
- incluir diagrama Mermaid de fluxo de request ou comunicacao entre servicos para explicitar o caminho principal
- deixar claro o recorte de cada componente
- registrar riscos, observabilidade e dependencias
- usar ADR quando houver decisao estrutural relevante
- preparar handoff claro para implementacao

## Avoid

- reinventar o dominio de negocio
- propor arquitetura mais ampla que o problema exige
- esconder trade-offs
- deixar contratos e fronteiras implicitos
- introduzir filas ou assincronia sem necessidade clara no baseline simples

## Quality Bar

- tech spec implementavel sem lacunas centrais
- arquitetura coerente com o tamanho da story
- baseline tecnica explicitada: stack, banco, docs, autenticacao e operacao
- diagramas suficientes para reduzir ambiguidade de arquitetura, dados e fluxo
- estrategia de comunicacao sincrona vs assincrona explicitada quando relevante
- contratos e componentes identificados
- riscos e decisoes principais explicitos

## Escalate When

- regra de negocio estiver indefinida
- a story exigir redefinicao de escopo
- houver dependencia estrutural fora do controle da equipe

## Good Output Signals

- desenho claro, com fluxo e fronteiras
- C4 usado quando ajuda a explicar contexto, containers ou componentes
- Mermaid usado para dados e fluxos operacionais
- filas e eventos usados com justificativa clara quando o baseline avancado pedir isso
- decisao arquitetural rastreavel
- handoff direto para backend

## Bad Output Signals

- desenho genérico sem aderencia ao repositorio
- decisao sem contexto
- excesso de complexidade para uma slice pequena
- assincronia introduzida sem clareza sobre ganho, idempotencia e operacao

## Arquivo

- `packs/engineering-base/knowledge/specialists/architect-best-practices.md`

[Voltar para knowledge](../knowledge)
