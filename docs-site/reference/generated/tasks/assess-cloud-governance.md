# assess-cloud-governance

Assess cloud posture, policy alignment and governance controls for a workload or platform change

## Ownership

- agent: `cloud-governance`

## Inputs

- `tech-spec`
- `adr`
- `release-plan`

## Context

- `architecture-principles`
- `cloud-operating-model`

## Outputs

- `review-report`

## Templates

- `review-report-template`

## Checklists

- `definition-of-done`

## Dependencies

- `create-cloud-architecture`

## Conteudo do artefato

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

## Arquivo

- `packs/engineering-base/tasks/assess-cloud-governance.md`

[Voltar para tasks](../tasks)
