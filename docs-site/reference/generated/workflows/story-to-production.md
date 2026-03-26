# story-to-production

Delivery workflow from approved story to release plan

## Metadados

- phase: `delivery`
- orchestrator: `delivery-orchestrator`
- alias principal: `/looply:story-to-production`

## Slash Command

- command: `/looply:story-to-production`
- argument hint: `<feature-name> <story-reference> [constraints...]`
- hosts: `codex`, `claude`

### Argumentos

- `feature-name` required: short identifier for the feature in delivery
- `story-reference` required: story to be delivered in this cycle
- `constraints` optional, variadic: optional delivery notes, blockers or implementation constraints

## Inputs

- `story`
- `prd`

## Outputs

- `release-plan`

## Stages

### technical-design

- task: `create-tech-spec`
- agent: `architect`
- inputs: `story`, `prd`
- outputs: `tech-spec`

### architecture-decision

- task: `create-adr`
- agent: `architect`
- depends_on: `technical-design`
- inputs: `tech-spec`
- outputs: `adr`

### implementation

- task: `implement-api`
- agent: `backend`
- depends_on: `technical-design`, `architecture-decision`
- inputs: `tech-spec`, `adr`
- outputs: `implementation-summary`

### technical-review

- task: `review-code`
- agent: `reviewer`
- depends_on: `implementation`
- inputs: `implementation-summary`
- outputs: `review-report`

### release-preparation

- task: `publish-service`
- agent: `reviewer`
- depends_on: `technical-review`
- inputs: `review-report`
- outputs: `release-plan`

## Handoffs

- `architect` -> `backend` via `tech-spec`
- `backend` -> `reviewer` via `implementation-summary`
- `reviewer` -> `reviewer` via `release-plan`

## Gates

- `design-approved` after `architecture-decision` owner `architect`
- `implementation-reviewed` after `technical-review` owner `reviewer`
- `release-ready` after `release-preparation` owner `reviewer`

## Conteudo do artefato

# Workflow: story-to-production

## Objective

Executar delivery de uma story aprovada ate um plano claro de release.

## Orchestrator

`delivery-orchestrator` acompanha o estado da story, cobra gates tecnicos e decide o proximo especialista.

## Execution

Usar backlog pronto como entrada e evitar misturar discovery com delivery.

## Sequence

1. `technical-design` by `architect`
2. `architecture-decision` by `architect`
3. `implementation` by `backend`
4. `technical-review` by `reviewer`
5. `release-preparation` by `reviewer`

## Quality Gates

- `design-approved` bloqueia implementacao sem `tech-spec` e `adr`
- `implementation-reviewed` bloqueia publicacao sem `review-report`
- `release-ready` bloqueia encerramento sem `release-plan`

## Arquivo

- `packs/engineering-base/workflows/story-to-production.md`

[Voltar para workflows](../workflows)
