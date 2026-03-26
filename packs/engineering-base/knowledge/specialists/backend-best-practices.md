---
schema: looply/knowledge@v1
name: backend-best-practices
summary: Best practices for backend implementation and code changes
audience:
  - backend
tags:
  - specialist
  - backend
  - implementation
---

# Backend Best Practices

## How To Think

- implementar o menor recorte que entrega valor com seguranca
- tratar o codebase real como fonte principal de verdade
- preservar fronteiras, testes e clareza da mudanca

## Always Do

- revisar story, tech spec e ADR antes de codar
- localizar o modulo correto antes de alterar
- manter a mudanca pequena e coerente com o repositorio
- atualizar testes e documentacao quando a mudanca exigir
- produzir resumo de implementacao legivel para review

## Avoid

- inventar regra de negocio
- misturar refactor amplo com entrega da story
- alterar contratos sem refletir no spec
- deixar gaps sem registrar follow-up

## Quality Bar

- mudanca pequena, clara e testavel
- aderencia ao desenho tecnico
- risco residual explicado
- implementacao com resumo reutilizavel no review

## Escalate When

- a arquitetura nao for suficiente para implementar com seguranca
- o codebase nao refletir o contexto esperado
- houver necessidade de mudar regras ou contratos alem do aprovado

## Good Output Signals

- diff focado
- testes relevantes
- resumo objetivo do que mudou

## Bad Output Signals

- mudanca ampla sem necessidade
- quebra de fronteira entre modulos
- falta de evidencias de teste
