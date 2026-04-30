# Platform Contracts

Contratos formais do modelo de dados do looply. Definem o schema YAML obrigatorio para cada tipo de artefato publicado pelos packs. Garantem consistencia entre packs, hosts e validacao.

## Contratos Disponiveis

| Contrato | Schema | Arquivo |
|---|---|---|
| Agent | `looply/agent@v1` | `platform/contracts/agent.md` |
| Task | `looply/task@v1` | `platform/contracts/task.md` |
| Workflow | `looply/workflow@v1` | `platform/contracts/workflow.md` |
| Knowledge | `looply/knowledge@v1` | `platform/contracts/knowledge.md` |
| Squad | `looply/squad@v1` | `platform/contracts/squad.md` |

## Agent (`looply/agent@v1`)

Define uma capacidade operacional especializada.

```yaml
schema: looply/agent@v1
name: architect
role: Solution design and technical decision making
execution:
  profile: structured-analysis
  reasoning_effort: medium
  context_budget: medium
  preferred_hosts: [codex, claude]
  model_hint:
    provider: openai
    family: gpt-5
supported_tasks: [create-tech-spec]
knowledge_sources: [../knowledge/architecture-principles.md]
constraints: [Do not invent business rules]
escalation_rules: [Escalate structural ambiguity to pm-analyst]
```

## Task (`looply/task@v1`)

Instrucoes de trabalho associadas a um agent.

```yaml
schema: looply/task@v1
name: implement-api
agent: backend
summary: Implement an API endpoint from the approved tech spec
inputs: [story, tech-spec]
context: [architecture-principles]
outputs: [code-change, api-doc]
templates: [api-template]
checklists: [code-review-checklist]
dependencies: [create-tech-spec]
```

## Workflow (`looply/workflow@v1`)

Sequencia de stages com gates e handoffs entre agents.

```yaml
schema: looply/workflow@v1
name: story-to-production
phase: delivery
orchestrator: delivery-orchestrator
stages:
  - name: technical-design
    task: create-tech-spec
    agent: architect
    outputs: [tech-spec]
gates:
  - name: design-approved
    after_stage: architecture-decision
    owner: architect
    blocks_on_failure: true
handoffs:
  - from: architect
    to: backend
    artifact: tech-spec
command:
  name: story-to-production
  argument_hint: <feature-name> <story-reference> [constraints...]
outputs: [release-plan]
```

## Knowledge (`looply/knowledge@v1`)

Documento de conhecimento direcionado a agentes especificos.

```yaml
schema: looply/knowledge@v1
name: architecture-principles
summary: Stable architectural guidance for engineering agents
audience: [architect, backend]
tags: [architecture, standards]
```

## Squad (`looply/squad@v1`)

Agrupamento de agentes, tasks, workflows e conhecimento sob um dominio.

```yaml
schema: looply/squad@v1
name: architecture-squad
domain: architecture
agents: [architect]
tasks: [create-tech-spec]
workflows: [story-to-production]
knowledge: [architecture-principles]
```
