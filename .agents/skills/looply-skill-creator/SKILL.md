---
name: looply-skill-creator
description: Use to create new looply skills interactively. Generates SKILL.md cross-host, agents yamls, command help file and updates indices. Do not use for editing existing skills.
---

Use this skill when the user explicitly invokes `$looply-skill-creator`, asks to run `/looply:skill-creator`, or clearly requests creation of a new looply skill.
This is a utility command (not a workflow). It does not have stages, gates or handoffs.

Quick usage:
- `$looply-skill-creator <skill-name>`
- `/looply:skill-creator <skill-name>`

Primary references:
- Existing skills (templates): ../../.agents/skills/
- Command help files: ../../.looply/state/commands/codex/
- Command index: ../../../LOOPLY_COMMANDS.md
- Workflow playbook: ../../.looply/state/workflow-playbook.codex.md

## Interview Flow

When invoked, follow this exact sequence. Do not skip steps. Do not ask all questions at once -- ask one at a time and wait for the answer.

### Step 0: Parse and Validate Name

Extract `<skill-name>` from arguments. Validate:
- Matches regex `^[a-z0-9]+(-[a-z0-9]+)*$`
- Length between 1 and 64 characters
- Does not already exist in `.agents/skills/`

On failure, display clear error and stop:
- Invalid format: explain the regex rule and show examples like `my-skill`, `ci-cd-pipeline`
- Too long: "Nome deve ter no maximo 64 caracteres"
- Already exists: "Skill `<name>` ja existe em `.agents/skills/<name>/`. Escolha outro nome."

On success: "[OK] Nome `<skill-name>` validado. Skill nao existe. Vou fazer algumas perguntas para configurar a nova skill."

### Step 1: Descricao curta

Ask: "Qual a descricao curta da skill? (1-1024 caracteres)"
Hint: "Ex: 'Use when a delivery story already exists and needs technical design, implementation, review and release preparation. Do not use before discovery and planning are complete.'"

Validate: 1-1024 chars. If empty or exceeds, ask again.

### Step 2: Triggers de uso

Ask: "Quando essa skill deve ser usada? Descreva as situacoes ou gatilhos."

Default: none (required). Min 10 chars.

### Step 3: Fase do workflow

Ask with options:
```
Qual a fase do workflow?
[1] discovery
[2] planning
[3] delivery
[4] status
[5] nenhuma (skill utilitaria, sem fase)
```

Default: 5 (nenhuma).

### Step 4: Orquestrador

Ask: "Qual o orquestrador principal? [opcional, Enter para pular]"
Show examples based on phase: `pm-analyst`, `delivery-orchestrator`, etc.

Default: empty (skip).

### Step 5: Hosts alvo

Ask with options:
```
Hosts alvo para essa skill?
[1] Apenas Codex/OpenCode
[2] Ambos (Codex + Claude Code, cross-host)
```

Default: 2 (ambos).

### Step 6: Invocacao implicita

Ask with options:
```
Permitir invocacao implicita?
[s] Sim - skill aparece automaticamente na lista de skills disponiveis
[n] Nao - apenas invocacao explicita via $looply-<name>
```

Default: n (apenas explicita). Note: only the root `looply` skill has implicit invocation. All other looply skills use explicit-only.

### Step 7: Workflow associado

Ask with options:
```
A skill possui workflow associado (stages, gates, handoffs)?
[s] Sim - vou perguntar sobre stages, gates e handoffs
[n] Nao - skill simples, sem workflow
```

Default: n.

If YES, ask sub-questions:

#### Step 7a: Nome do workflow
Ask: "Nome do workflow? (ex: 'my-skill-workflow')" Default: `<skill-name>-workflow`.

#### Step 7b: Stages
Ask: "Quantos stages o workflow tem?"
Then for each stage, ask:
- "Stage N: nome do stage?"
- "Stage N: owner (agente responsavel)?"
- "Stage N: task (nome da tarefa)?"
- "Stage N: inputs? (separados por virgula)"
- "Stage N: outputs? (separados por virgula)"
- "Stage N: depende de stage anterior? [s/n]"

#### Step 7c: Gates
Ask: "Quantos gates o workflow tem?"
Then for each gate, ask:
- "Gate N: nome do gate?"
- "Gate N: owner?"
- "Gate N: after qual stage?"
- "Gate N: blocks on failure? [s/n]"
- "Gate N: requires? (artefatos requeridos, separados por virgula)"
- "Gate N: checklist? (ex: 'definition-of-done')"

#### Step 7d: Handoffs
Ask: "Quantos handoffs?"
Then for each: "Handoff N: origem -> destino via artefato?"

### Step 8: Constraints

Ask: "Restricoes ou constraints adicionais? [opcional, Enter para pular]"
Example: "Nao modificar pipelines existentes sem confirmacao", "Manter compatibilidade com contrato atual"

Default: empty.

## Generation Rules

After collecting all answers, generate the artifacts following these exact templates.

### SKILL.md Template

Frontmatter:
```
---
name: looply-<skill-name>
description: <step-1-description>
---
```

Body structure:
```
Use this skill when the user explicitly invokes `$looply-<skill-name>`, asks to run `/looply:<skill-name>`, or clearly requests the <skill-name> workflow.
[If workflow: Workflow phase: `<phase>`.]
[If orchestrator: Primary orchestrator: `<orchestrator>`.]
Quick usage:
- `$looply-<skill-name> [args]`
Primary references:
- Workflow playbook: ../../../.looply/state/workflow-playbook.codex.md
- Host status contract: ../../../.looply/state/host-status-contract.json
- Managed pack: ../../../.looply/managed/packs/software-delivery-suite
- Custom overrides: ../../../.looply/custom
- Execution hints: ../../../.looply/state/execution-hints.codex.json
- Context index: ../../../.looply/state/context-index.md
- Project context: ../../../.looply/custom/project-context.md
- Session context: ../../../.looply/custom/session-context.md
Usage:
- Explicit mention: `$looply-<skill-name>`
- Workflow alias to honor: `/looply:<skill-name>` and `$looply-<skill-name>` depending on host
[If Codex: - Syntax in Codex: `$looply-<skill-name> [args]`]
Example:
- $looply-<skill-name> [example-args]
[Trigger description from step 2]
Curated example guidance:
- ICL mode: `on`
- Use examples only for style, structure and quality calibration.
- Do not copy feature-specific names, identifiers or business details from examples.
Execution rules:
1. Start by reading the workflow playbook and the feature state file if it exists.
2. If the user asked for help, explain syntax, arguments, example, expected output and next step without mutating state.
3. [If workflow: Create or update `.looply/custom/features/<feature-name>/workflow-status.md` before advancing stages.]
4. [If workflow: Respect blocking gates and do not skip required artifacts.]
5. Use managed pack files as canonical process definition and write local state only under `.looply/custom`.
6. Generate user-facing outputs in pt-BR unless the user explicitly asks for another language.
7. For existing projects, use the real local codebase as the primary source of truth and use context files only as accelerators.
8. If a context file has `status: empty`, `status: draft` or `status: stale`, validate it against the local codebase before trusting it.
9. Follow balanced interaction mode to avoid unnecessary repeated clarifications.
10. When curated examples are referenced, use them only for style, structure and quality calibration.
11. Keep the response visually structured with clear Markdown section titles.
12. Do not use emojis.
[Extra rules from step 8 if any]
---
## Composed Agent Context
The sections below were pre-composed by looply from agent context_slots.
## Constraints
[Step 8 constraints, each on its own line with '-' prefix]
## Escalation
[Empty - fill after first use]
## Project Rules
[Empty - fill after first use]
[If workflow: ## Workflow section with stages/gates/handoffs]
Arguments:
- skill-name: [required, description]
[Additional args if needed]
```

### agents/openai.yaml Template

```yaml
interface:
  display_name: "$looply-<skill-name>"
  short_description: "<step-1-description>"
  brand_color: "#7C3AED"
  default_prompt: "$looply-<skill-name> [args]"
policy:
  allow_implicit_invocation: <true|false>
```

### agents/claude.yaml Template (if cross-host)

Same structure as openai.yaml, with Claude-compatible paths.

### Command Help File Template

Path: `.looply/state/commands/codex/looply:<skill-name>.md`

Structure:
- Header with command name and invocation trigger
- Metadata: Workflow, Phase, Orchestrator, Description, Argument hint
- References section (list of paths)
- State file path
- Usage: Host, Alias, Syntax
- Example
- When to use
- Expected output
- Suggested next step
- Curated example guidance
- Help mode behavior
- Presentation rules
- Execution rules (17 standard rules)
- Argument mapping table

### LOOPLY_COMMANDS.md Update

Append in alphabetical order:
```
- `$looply-<skill-name> [args]`
  <step-1-description>
  Reference: .looply/state/commands/codex/looply:<skill-name>.md
```

### Workflow Playbook Update (if workflow)

Append after last workflow definition:
```
## Workflow: <workflow-name>
[Description]
[Phase/orchestrator/inputs/outputs]
[Stages with owners/tasks/dependencies]
[Handoffs]
[Gates with conditions]
```

## Preview and Confirmation

After generating all artifacts, display a preview:

1. Show SKILL.md content (first 40 lines, then "... (continuacao omitida no preview)")
2. Show openai.yaml content
3. Show claude.yaml content (if cross-host)
4. Show command help file header + metadata
5. Show diff of LOOPLY_COMMANDS.md (+ lines added)
6. If workflow: show diff of workflow playbook

Then ask:
```
Confirmar criacao da skill?
[s] Sim - escrever todos os arquivos
[n] Nao - cancelar sem escrever
```

On confirm (s):
1. Create `.agents/skills/<skill-name>/` directory
2. Write `SKILL.md`
3. Write `agents/openai.yaml`
4. Write `agents/claude.yaml` (if cross-host)
5. Write `.looply/state/commands/codex/looply:<skill-name>.md`
6. Update `LOOPLY_COMMANDS.md` (append in alphabetical order)
7. If workflow: update `.looply/state/workflow-playbook.codex.md`
8. Display summary of all created files

On cancel (n):
- Display "Criacao cancelada. Nenhum arquivo foi escrito."

## Validation Summary

After writing, validate:
- SKILL.md has valid YAML frontmatter with `name` and `description`
- Skill name matches directory name
- openai.yaml has `interface` and `policy` blocks
- Command help file exists and has expected sections
- LOOPLY_COMMANDS.md contains the new alias

## Error Handling

- If skill already exists: block with clear message, suggest alternative name
- If name invalid: show regex rule with examples
- If description empty/too long: ask again with hint
- If directory creation fails: report error and abort
- If file write fails: report which file failed and abort remaining writes

## Constraints

- Never modify existing skills -- only create new ones
- Always validate before writing
- Always show preview before writing
- Always write all files atomically (all or nothing)
- Output always in pt-BR
- brand_color always "#7C3AED"
- Follow existing skill patterns exactly
- Do not use emojis in generated files
