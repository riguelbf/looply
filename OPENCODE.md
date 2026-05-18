# Managed by looply for opencode

Primary references:
- ./.looply/managed/packs/software-delivery-suite/pack.md
- ./.looply/custom/
- ./.looply/state/workflow-playbook.opencode.md
- ./.looply/state/execution-hints.opencode.json
- ./.looply/state/example-index.json
- ./.looply/state/example-hints.opencode.json
- ./.looply/state/locale.json
- ./.looply/state/project-context.json
- ./.looply/state/context-index.md
- ./.looply/state/code-context.json
- ./.looply/state/knowledge-graph.json
- ./.looply/state/interaction-policy.json
- ./.looply/custom/project-context.md
- ./.looply/custom/integrations/integrations-index.md
- ./.looply/custom/rules/rules-index.md
- ./.looply/custom/session-context.md
- ./.looply/custom/session-links.json
- ./HOST_CONTRACT.md
- ./OPENCODE_COMMANDS.md
- ./.agents/skills/

Default output locale: `pt-BR`
Project mode: `existing-project`
Interaction mode: `balanced`
ICL example guidance: `on`

Invocable workflow aliases:
- /looply:help [command-name]
- /looply:cloud-workload-design <feature-name> <scope-reference> [constraints...]
- /looply:critique <feature-name> [notes...]
- /looply:idea-to-prd <feature-name> [problem-statement] [constraints...]
- /looply:next <feature-name> [session-label] [notes...]
- /looply:platform-foundation-evolution <initiative-name> [constraints...]
- /looply:prd-to-stories <feature-name> [prd-reference] [notes...]
- /looply:resume <feature-name> [session-label] [notes...]
- /looply:story-to-production <feature-name> <story-reference> [constraints...]
- /looply:workflow-status <feature-name> [session-label] [notes...]

Alias policy for OpenCode:
1. Use the `looply` skill as the main discovery and routing entrypoint.
2. Treat `$looply-*` strings as looply workflow aliases.
3. Open `OPENCODE_COMMANDS.md` when you need the command index and `./.looply/state/commands/opencode/` for command-specific help.
4. Prefer the generated skills in `./.agents/skills/` for explicit skill invocation.
5. Before acting as a specialist, inspect the current agent `knowledge_sources`, especially specialist `best-practices` files.
6. If the current task declares templates or checklists, use them as the default artifact contract and quality bar.
7. When a workflow command references curated examples, use them only for style and quality calibration.
8. If the user writes `$looply-... help`, explain the alias instead of executing it.
9. Generate user-facing outputs in `pt-BR` unless the user explicitly asks for another language.
10. In `existing-project`, treat the local project root as the default context for feature work unless the user points to another folder.
11. For existing projects, use the real local codebase as the primary source of truth. Use context markdown files only as accelerators when they are filled and current.
12. If project or feature context files are empty, draft, stale or inconsistent, inspect the real codebase before making meaningful decisions.
13. When a feature mentions a known external integration, inspect `.looply/custom/integrations/integrations-index.md` and the corresponding integration context file before making design decisions.
14. Follow `balanced` interaction mode to avoid unnecessary repeated clarifications.
15. When multiple sessions are active, use `.looply/custom/session-links.json` together with `session-label` to bind each session to the correct feature.

Knowledge graph policy:
17. When assessing change impact, module dependencies or database schema, read `.looply/state/knowledge-graph.json` before inspecting individual files. Use `looply refresh-code-context` if the graph is missing or stale.

Execution order for feature work:
1. Open the workflow playbook first.
2. Check `.looply/state/context-index.md` to understand context priority and validity rules.
3. Follow stages in order and respect blocking gates.
4. Use the managed pack as the canonical process base.
5. Preserve local customizations from `.looply/custom`.
6. Treat execution hints as advisory metadata for cost and context selection.