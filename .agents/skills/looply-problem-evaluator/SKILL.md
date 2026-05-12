---
name: looply-problem-evaluator
description: Use para diagnosticar problemas no app usando artefatos looply (stories, specs, code graph, knowledge graph) como fonte primaria, com deep dive no codebase como fallback quando os artefatos forem insuficientes.
---
Use this skill when the user explicitly invokes `$looply-problem-evaluator`, asks to run `/looply:problem-evaluator`, or clearly requests the `problem-evaluator` workflow.
Workflow phase: `diagnosis`.
Primary orchestrator: `problem-investigator`.
Quick usage:
- `$looply-problem-evaluator <feature-name> <scope-reference> "[problem-description]" "[constraints...]"`
Primary references:
- Workflow playbook: ../../../.looply/state/workflow-playbook.codex.md
- Host status contract: ../../../.looply/state/host-status-contract.json
- Managed pack: ../../../.looply/managed/packs/software-delivery-suite
- Workflow state template: ../../../.looply/managed/packs/product-base/templates/workflow-status-template.md
- Custom overrides: ../../../.looply/custom
- Execution hints: ../../../.looply/state/execution-hints.codex.json
- Example hints: ../../../.looply/state/example-hints.codex.json
- Context index: ../../../.looply/state/context-index.md
- Project context: ../../../.looply/custom/project-context.md
- Session context: ../../../.looply/custom/session-context.md
- Code context: ../../../.looply/state/code-context.json (grafo de modulos, simbolos e dependencias)
- Knowledge graph: ../../../.looply/state/knowledge-graph.json (use para schema de banco e dependencias entre modulos)
Usage:
- Explicit mention: `$looply-problem-evaluator`
- Workflow alias to honor: `/looply:problem-evaluator` and `$looply-problem-evaluator` depending on host
- Syntax in Codex: `$looply-problem-evaluator <feature-name> <scope-reference> [problem-description] [constraints...]`
Example:
- $looply-problem-evaluator pix-webhook-retry payments-api "webhooks falham intermitentemente em horario de pico" "verificar race condition no consumer"
Curated example guidance:
- ICL mode: `on`
- Use examples only for style, structure and quality calibration.
- Do not copy feature-specific names, identifiers or business details from examples.
- No example was selected for this workflow.
Execution rules:
1. Start by reading the workflow playbook, the host status contract if it exists, and the feature state file if it already exists.
2. If the user asked for help, explain syntax, arguments, example, expected output and next step without mutating state.
3. Create or update `.looply/custom/features/<feature-name>/workflow-status.md` before advancing stages.
4. Respect blocking gates and do not skip required artifacts.
5. Use managed pack files as canonical process definition and write local state only under `.looply/custom`.
6. Generate user-facing outputs in pt-BR unless the user explicitly asks for another language.
7. For existing projects, use the real local codebase as the primary source of truth and use context files only as accelerators.
8. If a context file has `status: empty`, `status: draft` or `status: stale`, validate it against the local codebase before trusting it.
9. Follow balanced interaction mode to avoid unnecessary repeated clarifications.
10. When curated examples are referenced, use them only for style, structure and quality calibration.
11. Keep the response visually structured with clear Markdown section titles for Workflow, Stage, Current Task, Gate, Decision and Next Step.
12. Do not use emojis.
13. Before diagnosing, check `.looply/state/code-context.json` for module graphs and `.looply/state/knowledge-graph.json` for database schema and module dependencies. Run `looply refresh-code-context` if the code graph is missing or stale.
14. O estagio `codebase-investigation` e condicional: execute-o apenas quando os artefatos looply (stories, specs, code-context, knowledge-graph) nao forem suficientes para identificar a causa raiz com confianca. Se o `artifact-triage` ja produziu uma causa raiz conclusiva, pule direto para `diagnosis-report`.
15. When context monitoring is enabled in `.looply/state/interaction-policy.json`, after each stage estimate context consumption against the stage's `context_budget` hint from `execution-hints.codex.json`. Track in `workflow-status.md` (`## Session Context`). At `yellow` (70-85%), compact state. At `red` (>85%), require `/looply:resume` in a fresh session.
---
## Composed Agent Context
The sections below were pre-composed by looply from agent context_slots. Inline sections contain content resolved during install/sync. Reference sections list files the host should read at runtime.
## Constraints

- Do not implement fixes during diagnosis -- limit to root cause analysis and actionable recommendations
- Do not invent causes without evidence from artifacts or codebase inspection
- Escalate quando a causa raiz estiver fora do escopo dos artefatos e codebase disponiveis
## Escalation

- Escalate design-related findings to architect
- Escalate product ambiguity to pm-analyst
- Escalate implementation-level issues to backend or frontend
- Escalate operability or infrastructure issues to devops or sre
## Project Rules

### architecture-constraints

# Architecture Constraints

## Purpose

Define the architectural patterns, frameworks and module boundaries that agents must respect when making design and implementation decisions.

## Rules

- Prefer the established architecture of the existing codebase.
- Introduce new patterns only when the current approach is demonstrably insufficient.
- Respect module boundaries and dependency direction.
- Document architectural decisions using ADRs.

## Examples

- In a layered architecture: controllers call services, services call repositories.
- In a microservices setup: prefer async messaging over synchronous HTTP calls.

## Enforcement

- Architecture review gates in the delivery workflow.
- ADR required for new patterns or significant changes.
Arguments:
- feature-name: short identifier for the feature or module being diagnosed (required)
- scope-reference: module, service or component under investigation (required)
- problem-description: descricao do problema ou sintoma observado (optional)
- constraints: optional constraints, boundaries or specific areas to investigate (optional)
