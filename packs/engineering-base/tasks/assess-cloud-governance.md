---
schema: looply/task@v1
name: assess-cloud-governance
agent: cloud-governance
summary: Assess cloud posture, policy alignment and governance controls for a workload or platform change
execution:
  profile: review
  reasoning_effort: high
  context_budget: medium
  latency_priority: medium
  preferred_hosts:
    - codex
    - claude
  model_hint:
    provider: openai
    family: gpt-5
inputs:
  - tech-spec
  - adr
  - release-plan
context:
  - architecture-principles
  - cloud-operating-model
outputs:
  - review-report
templates:
  - review-report-template
checklists:
  - definition-of-done
dependencies:
  - create-cloud-architecture
---

# Task: assess-cloud-governance

## Objective

Avaliar aderencia de uma mudanca cloud a politicas, posture, controles e requisitos de conformidade.

## Execution

Prioriza risco, auditabilidade e clareza sobre controles obrigatorios.

## Steps

1. Revisar desenho cloud, ADRs e plano de release relevantes.
2. Validar politicas globais, identidade, trilha de auditoria, posture e segregacao.
3. Distinguir bloqueios reais de recomendacoes opcionais.
4. Registrar risco, impacto, dono e prioridade de cada gap.
5. Encerrar a etapa com tabela de concluidos e pendentes.

## Constraints

- nao redesenhar a solucao quando a acao correta for adequacao a controle
- nao emitir bloqueio sem explicar risco e criterio violado

## Deliverables

- review report de governanca
- gaps e controles com ownership claro
- tabela final da etapa com itens concluidos e pendentes
