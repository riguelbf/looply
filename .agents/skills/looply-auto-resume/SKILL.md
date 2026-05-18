---
name: looply-auto-resume
description: Use to resume a persisted feature workflow from its saved state and always question the user about what to do next before taking any action. Cross-host support for Codex and Claude Code.
---
Use this skill automatically when a new session starts and looply state is detected, or when the user explicitly invokes `$looply-auto-resume`, asks to run `/looply:auto-resume`.
Workflow phase: `status`.
Quick usage:
- `$looply-auto-resume [feature-name] "[notes...]"`
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
- Session links: ../../../.looply/custom/session-links.json
Usage:
- Automatic detection: triggers when a new session starts and `.looply/` exists in the workspace
- Explicit mention: `$looply-auto-resume`
- Workflow alias to honor: `/looply:auto-resume` and `$looply-auto-resume` depending on host
- Syntax in Codex: `$looply-auto-resume [feature-name] "[notes...]"`
Example:
- $looply-auto-resume pix-webhook-retry "retomando apos revisao de seguranca"
Triggers:
- Toda vez que iniciar uma nova sessao onde o looply estiver instalado ou disparada manualmente
Curated example guidance:
- ICL mode: `on`
- Use examples only for style, structure and quality calibration.
- Do not copy feature-specific names, identifiers or business details from examples.
- No example was selected for this workflow.

## Interview Flow

When invoked (automatically or explicitly), follow this sequence. Do not skip steps. Do not ask all questions at once -- ask one at a time and wait for the answer.

### Step 0: Detect State

Read the workflow playbook and session-links.json to find any active features.
Scan `.looply/custom/features/` for persisted workflow states.
Read `.looply/custom/session-context.md` for the current session label.

If no features found: "Nenhum workflow ativo encontrado. Deseja iniciar um novo? Use `$looply-idea-to-prd <nome>` ou me diga o que quer fazer."

If features found, present a numbered list:
- Feature name, current phase, current stage, last updated
- Ask: "Qual feature deseja continuar? (numero ou nome)"

### Step 1: Load Feature State

Read the feature state file at `.looply/custom/features/<feature-name>/workflow-status.md`.
Parse current phase, stage, gate status, completed artifacts and pending tasks.

Summarize for the user:
- Workflow: <name>
- Phase: <discovery|planning|delivery|status>
- Current Stage: <stage-name>
- Gate Status: <blocked|passed|pending>
- Completed: <list>
- Pending: <list>

### Step 2: Question the User

Always ask before taking action. Present options based on current state:

If stage is in progress:
"O stage `<stage>` esta em andamento. O que deseja fazer?"
[1] Continuar de onde parou
[2] Revisar o que ja foi feito antes de continuar
[3] Pular para outro stage
[4] Ver detalhes completos do estado

If stage is complete but gate is blocking:
"O stage `<stage>` foi concluido, mas o gate `<gate>` esta bloqueando. O que deseja fazer?"
[1] Resolver o gate bloqueante
[2] Revisar artefatos pendentes
[3] Voltar ao stage anterior para ajustes
[4] Ver detalhes completos do estado

If all stages complete:
"Todos os stages do workflow `<workflow>` foram concluidos. O que deseja fazer?"
[1] Avancar para proximo workflow (ex: prd-to-stories)
[2] Revisar artefatos finais
[3] Iniciar novo feature
[4] Ver detalhes completos do estado

### Step 3: Execute (Only After Confirmation)

Only proceed after the user explicitly chooses an option. Never advance stages or modify state without confirmation.

When executing:
- Workflow: display section title
- Stage: display current stage name
- Current Task: display task name
- Gate: show gate status
- Decision: show what the user chose
- Next Step: show what will happen after execution

### Step 4: Update State

After each action, update `.looply/custom/features/<feature-name>/workflow-status.md`.
Record the decision made and the new state.

### Step 5: Loop

Return to Step 2 and question the user again about what to do next. Never assume the next step -- always ask.

Execution rules:
1. Start by reading the workflow playbook, the host status contract if it exists, and session-links.json to find active features.
2. If no features exist, inform the user and suggest starting a new one. Do not create features automatically.
3. If the user asked for help, explain syntax, arguments, example, expected output and next step without mutating state.
4. Create or update `.looply/custom/features/<feature-name>/workflow-status.md` before advancing stages.
5. Respect blocking gates and do not skip required artifacts.
6. Use managed pack files as canonical process definition and write local state only under `.looply/custom`.
7. Generate user-facing outputs in pt-BR unless the user explicitly asks for another language.
8. For existing projects, use the real local codebase as the primary source of truth and use context files only as accelerators.
9. If a context file has `status: empty`, `status: draft` or `status: stale`, validate it against the local codebase before trusting it.
10. Follow balanced interaction mode to avoid unnecessary repeated clarifications.
11. When curated examples are referenced, use them only for style, structure and quality calibration.
12. Keep the response visually structured with clear Markdown section titles for Workflow, Stage, Current Task, Gate, Decision and Next Step.
13. Do not use emojis.
14. Always question the user before taking any action. Never advance stages or modify state without explicit confirmation.
15. At the end of each action, loop back to questioning the user about the next step.

---
## Composed Agent Context
The sections below were pre-composed by looply from agent context_slots. Inline sections contain content resolved during install/sync. Reference sections list files the host should read at runtime.
## Constraints

- Sempre questionar o usuario sobre o que fazer antes de qualquer acao
- Detectar automaticamente o estado salvo ao iniciar uma nova sessao onde o looply estiver instalado
- Nao avancar stages sem confirmacao explicita do usuario
- Do not implement feature code directly
- Do not skip blocking gates
- Do not rewrite specialist outputs without explicit reason
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
- feature-name: optional short identifier of the feature to resume (optional; if omitted, the skill auto-detects active features)
- notes: optional notes about blockers, context switches or newly discovered artifacts (optional)
