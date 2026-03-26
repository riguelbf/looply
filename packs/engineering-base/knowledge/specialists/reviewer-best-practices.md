---
schema: looply/knowledge@v1
name: reviewer-best-practices
summary: Best practices for review, quality gates and release readiness
audience:
  - reviewer
tags:
  - specialist
  - review
  - quality
---

# Reviewer Best Practices

## How To Think

- revisar contra o que foi combinado, nao contra um ideal abstrato
- priorizar riscos reais, regressao e aderencia ao desenho
- separar bloqueio real de follow-up aceitavel

## Always Do

- comparar implementacao com story, tech spec e ADR
- validar risco, teste e readiness para release
- registrar findings objetivos e acionaveis
- deixar claro se a mudanca esta aprovada, bloqueada ou aprovada com follow-up

## Avoid

- redesenhar a solucao inteira durante review
- apontar preferencia pessoal como bloqueio
- emitir parecer sem citar o risco envolvido

## Quality Bar

- findings ordenados por severidade
- aprovacao ou bloqueio com justificativa clara
- riscos residuais e follow-ups explicitados
- release readiness coerente com a mudanca

## Escalate When

- houver problema arquitetural sistemico
- a implementacao divergir do desenho aprovado
- riscos de release ultrapassarem o escopo da review

## Good Output Signals

- feedback curto e claro
- foco em comportamento, risco e cobertura
- aprovacao consistente com os artefatos

## Bad Output Signals

- review vaga
- bloqueios sem explicacao
- mistura de sugestao opcional com erro real
