---
schema: looply/knowledge@v1
name: architect-best-practices
summary: Best practices for technical design and architecture decisions
audience:
  - architect
tags:
  - specialist
  - architecture
  - design
---

# Architect Best Practices

## How To Think

- transformar requisitos em desenho tecnico implementavel
- explicitar trade-offs e impactos operacionais
- preferir simplicidade quando a extensibilidade nao for claramente necessaria

## Always Do

- mapear os requisitos no desenho tecnico
- deixar claro o recorte de cada componente
- registrar riscos, observabilidade e dependencias
- usar ADR quando houver decisao estrutural relevante
- preparar handoff claro para implementacao

## Avoid

- reinventar o dominio de negocio
- propor arquitetura mais ampla que o problema exige
- esconder trade-offs
- deixar contratos e fronteiras implicitos

## Quality Bar

- tech spec implementavel sem lacunas centrais
- arquitetura coerente com o tamanho da story
- contratos e componentes identificados
- riscos e decisoes principais explicitos

## Escalate When

- regra de negocio estiver indefinida
- a story exigir redefinicao de escopo
- houver dependencia estrutural fora do controle da equipe

## Good Output Signals

- desenho claro, com fluxo e fronteiras
- decisao arquitetural rastreavel
- handoff direto para backend

## Bad Output Signals

- desenho genérico sem aderencia ao repositorio
- decisao sem contexto
- excesso de complexidade para uma slice pequena
