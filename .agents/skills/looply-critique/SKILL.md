---
name: looply-critique
description: Use to perform a deep critique and improvement of the current workflow step artifact (PRD, stories, tech spec, ADR, etc.) with a terminal approval form.
---

Use this skill when the user explicitly invokes `$looply-critique`, asks to run `/looply:critique`, or clearly requests a critique or refinement of the current workflow artifact.
Workflow phase: `status`.
Primary orchestrator: `delivery-orchestrator`.
Quick usage:
- `$looply-critique <feature-name> [notes...]`
Primary references:
- Workflow playbook: ../../../.looply/state/workflow-playbook.opencode.md
- Host status contract: ../../../.looply/state/host-status-contract.json
- Managed pack: ../../../.looply/managed/packs/software-delivery-suite
- Workflow state template: ../../../.looply/managed/packs/product-base/templates/workflow-status-template.md
- Custom overrides: ../../../.looply/custom
- Execution hints: ../../../.looply/state/execution-hints.opencode.json
- Example hints: ../../../.looply/state/example-hints.opencode.json
- Context index: ../../../.looply/state/context-index.md
- Project context: ../../../.looply/custom/project-context.md
- Session context: ../../../.looply/custom/session-context.md
- Knowledge graph: ../../../.looply/state/knowledge-graph.json
- Artifact templates: ../../../.looply/managed/packs/engineering-base/templates/
Usage:
- Explicit mention: `$looply-critique`
- Workflow alias to honor: `/looply:critique` and `$looply-critique` depending on host
- Syntax in Codex: `$looply-critique <feature-name> [notes...]`
Example:
- $looply-critique mcp-activation "verificar se as 6 stories cobrem todos os cenarios de erro"
Curated example guidance:
- ICL mode: `on`
- Use examples only for style, structure and quality calibration.
- Do not copy feature-specific names, identifiers or business details from examples.
- No example was selected for this workflow.

## Critique Flow

### Stage 1: Load State

1. Read `.looply/custom/features/<feature-name>/workflow-status.md`.
2. Identify the `Active Artifact` and `Current Stage` from the state file.
3. Extract the artifact content from the relevant sections of the workflow state file.
4. If the feature state file does not exist, inform the user and stop.

### Stage 2: Load Artifact Template

1. Map the active artifact to its template in `.looply/managed/packs/engineering-base/templates/`:
   - `prd` -> `prd-template.md`
   - `story-backlog` -> `story-backlog-template.md`
   - `tech-spec` -> `tech-spec-template.md`
   - `adr` -> `adr-template.md`
   - `implementation-summary` -> `implementation-summary-template.md` (if exists, otherwise use generic structure)
   - `review-report` -> `review-report-template.md` (if exists, otherwise use generic structure)
   - `release-plan` -> `release-plan-template.md` (if exists, otherwise use generic structure)
2. Read the template to understand the expected structure and completeness contract.

### Stage 3: Deep Critique

Apply artifact-specific critique rules. Be specific, actionable and point to exact sections that need improvement.

#### PRD (prd)
- Evaluate completeness against all PRD template sections
- Check clarity of problem statement, business goal and success metrics
- Assess persona/actor coverage and completeness of user journeys
- Verify edge cases are addressed
- Check non-functional requirements (performance, security, availability)
- Evaluate risks, dependencies and assumptions
- Check if constraints are realistic and complete
- Assess candidate stories for PRD coverage

#### Story Backlog (story-backlog)
- Verify coverage of all PRD requirements
- Check story granularity -- neither too large nor too small
- Evaluate dependencies between stories for correct ordering
- Assess priority ordering rationale
- Check acceptance criteria quality per story (specific, testable)
- Verify suggested first slice is viable and delivers value early
- Identify missing stories or coverage gaps

#### Tech Spec (tech-spec)
- Evaluate architecture decisions and trade-offs
- Check sequence diagrams for completeness, error handling and rollback paths
- Verify data model consistency and integrity
- Assess security considerations (authentication, authorization, data protection)
- Check scalability, performance and observability sections
- Evaluate testing strategy coverage (unit, integration, e2e)
- Verify file tree matches described architecture
- Check operational considerations (deployment, monitoring, alerts)

#### ADR (adr)
- Check if alternatives considered are realistic and well-researched
- Evaluate decision drivers and context completeness
- Verify impact analysis covers architecture, data, contracts and operations
- Check positive and negative consequences are documented
- Assess accepted risks and mitigation strategies
- Verify rollout and rollback considerations
- Check validation plan completeness

#### Implementation Summary (implementation-summary)
- Evaluate test coverage and quality
- Check error handling patterns
- Verify adherence to tech spec and ADR decisions
- Assess code quality indicators (naming, structure, patterns)
- Check documentation quality
- Evaluate integration with existing codebase

#### Review Report (review-report)
- Check thoroughness of review across all dimensions
- Evaluate quality and actionability of findings
- Verify all required checklist items are addressed
- Identify missing review dimensions

#### Release Plan (release-plan)
- Verify deployment steps are clear and complete
- Check rollback plan coverage
- Assess monitoring and observability setup
- Verify runbooks and operational documentation
- Check communication plan for stakeholders

### Stage 4: Generate Critique Report

Create `.looply/custom/features/<feature-name>/critique-report.md` containing:

```markdown
# Critique Report: <artifact-type>

## Status
Pending review

## Summary of Strengths
- Point out what is well done in the current artifact

## Gaps and Issues Found
- List each gap with specific reference to the section/area

## Proposed Improvements
- Detailed, actionable improvements for each gap

## Refined Version
<the full improved artifact, following the same structure as the original>
```

### Stage 5: Present and Decide

Show the critique summary to the user with a terminal decision form:

```
# Critique: <artifact-type>

## Resumo dos Achados

<brief bullet list of main gaps found>

Relatorio completo gerado em: .looply/custom/features/<feature-name>/critique-report.md

---

## Decisao

[o] Manter versao ORIGINAL
[p] Adotar versao PROPOSTA (critique)
[c] Comentarios para ajustar a proposta
[x] Cancelar (descartar tudo)
```

Behavior per choice:
- `o`: Keep original. Delete `critique-report.md`. No changes to `workflow-status.md`.
- `p`: Adopt proposed version. Replace the artifact content in `workflow-status.md` with the refined version. Delete `critique-report.md`.
- `c`: Ask the user for specific comments. Incorporate the feedback, regenerate `critique-report.md`, and re-present the decision form. Loop until the user chooses `o`, `p` or `x`.
- `x`: Cancel everything. Delete `critique-report.md`. No changes to `workflow-status.md`.

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
11. Keep the response visually structured with clear Markdown section titles for Critique, Findings, Decision and Next Step.
12. Do not use emojis.
13. Before critiquing, load the artifact template from the managed pack to understand the expected structure.
14. Be specific and actionable in every critique finding. Point to exact sections that need improvement.
15. The `critique-report.md` is a temporary artifact. Always delete it after the user makes a final decision (`o`, `p` or `x`).
16. Do not modify `workflow-status.md` until the user approves the proposed changes via the decision form.
17. When the user selects `c` (comments), incorporate the feedback, regenerate `critique-report.md` in full, and re-present the decision form.
18. If no active artifact is found in the workflow state, inform the user that there is nothing to critique at the current stage.

---
## Composed Agent Context
The sections below were pre-composed by looply from agent context_slots. Inline sections contain content resolved during install/sync. Reference sections list files the host should read at runtime.
## Constraints

- Do not implement feature code directly
- Do not skip blocking gates
- Do not rewrite specialist outputs without explicit reason
- Do not modify workflow-status.md until user approves the proposed changes
- Always delete critique-report.md after final decision
## Escalation

- Escalate product ambiguity to pm-analyst
- Escalate structural ambiguity to architect
- Escalate implementation blockers to backend
- Escalate release risk to reviewer
## Project Rules

### project-conventions

# Project Conventions

## Purpose

Define project-level conventions for collaboration that agents must follow when interacting with version control, pull requests and releases.

## Rules

- Follow the project's established branching strategy.
- Write clear, descriptive commit messages.
- PRs must include a summary of changes and link to the relevant story.
- Do not commit generated files or build artifacts.
- Changes that affect multiple concerns should be split into separate PRs.

## Examples

- Good commit: `feat: add retry logic to payment processing`
- Bad commit: `fix stuff`

## Enforcement

- Branch protection rules enforce review requirements.
- CI checks run on every PR.
- Commit message convention enforced via hooks or CI.
Arguments:
- feature-name: short identifier of the feature whose artifact will be critiqued (required)
- notes: optional notes about specific areas to focus on during the critique (optional)
