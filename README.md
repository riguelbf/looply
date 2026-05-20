<p align="center">
  <img src="./assets/looply-banner.svg" alt="Looply" width="760" />
</p>

<p align="center">
  <strong>Engineering artifacts for AI-assisted teams.</strong><br>
  From discovery to delivery — structured, host-agnostic, and versioned.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@looply-cli/looply"><img src="https://img.shields.io/npm/v/@looply-cli/looply?color=cb0000" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@looply-cli/looply"><img src="https://img.shields.io/npm/dw/@looply-cli/looply" alt="npm downloads"></a>
  <a href="https://github.com/riguelbf/looply/actions/workflows/publish-npm.yml"><img src="https://github.com/riguelbf/looply/actions/workflows/publish-npm.yml/badge.svg" alt="build"></a>
  <a href="https://github.com/riguelbf/looply/actions/workflows/docs-pages.yml"><img src="https://github.com/riguelbf/looply/actions/workflows/docs-pages.yml/badge.svg" alt="docs"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="license"></a>
  <a href="#quick-start"><img src="https://img.shields.io/badge/node-%3E%3D22-brightgreen" alt="node"></a>
</p>

---

## Recent Updates

### v1.9 — Critique & Refinement

| Update | Description |
|--------|-------------|
| **Critique Command** | New `$looply-critique` slash command for deep critique and improvement of any workflow step artifact. Automatically detects the active artifact (PRD, story backlog, tech spec, ADR, etc.), applies artifact-specific critique rules, generates a temporary refinement report with improvements, and presents a terminal decision form (approve, comment, cancel). Loops until the user approves the final version. |

### v1.8 — Auto-Resume & Session Continuity

| Update | Description |
|--------|-------------|
| **Auto-Resume Skill** | New `$looply-auto-resume` slash command that auto-detects persisted workflow state on new session start. Scans `.looply/custom/features/` for active features, presents the current stage/gate status, and always questions the user before taking any action. Cross-host support for Codex, OpenCode and Claude Code with implicit invocation enabled. |
| **Interview-Driven Continuity** | Never advances stages without explicit user confirmation. After each action, loops back and asks what to do next -- ensuring human-in-the-loop at every workflow transition. |

### v1.7 — Shared Context Memory

| Update | Description |
|--------|-------------|
| **Context Ledger** | Append-only shared memory per feature. Each workflow stage appends decisions, rationale, constraints and risks to a SQLite database (`context-ledger.db`). Agents interact via `looply ledger` CLI commands. Budget-aware: `--summary-only` for low budget, full read for medium+. |
| **Pre-Action Gate** | Enforced before any code change across all three hosts. Session binding, feature state check, context-ledger read, and knowledge-graph awareness are mandatory gates via updated `AGENTS.md`/`OPENCODE.md`/`CLAUDE.md` entrypoints. |
| **Context Index Expansion** | `context-ledger.db`, `knowledge-graph.json` and `code-context.json` now registered in the context-index priority order — LLM discovers all structural memory automatically. |
| **Knowledge Wiring** | New `workflow.ledger` context slot source for agents. Budget-aware compression: low budget = summary only, medium+ = full ledger. Cross-host enforcement via entrypoint + skill execution rules. |
| **SQLite Ledger** | Structured schema (`entries` + `summary` tables) guarantees field presence. Atomic writes via `better-sqlite3`. CLI commands (`looply ledger read/append/summary`) provide structured JSON output for agents — no Markdown parsing needed. |

### v1.6 — MCP Activation

| Update | Description |
|--------|-------------|
| **MCP Activation** | Activate MCP servers with a single command. Looply comes with 7 pre-built templates (GitHub, Kubernetes, Linear, MySQL, PostgreSQL, ELK, Grafana). Interactive questionnaire collects credentials, auto-installs the npm package, and generates cross-host configuration for OpenCode, Codex and Claude Code. |
| **MCP CLI** | `looply mcp list` shows available MCPs with activation status. `looply mcp activate` guides you through an interactive setup. `looply mcp status` shows active MCPs per host. `looply mcp deactivate <name>` removes configuration and credentials. |
| **Cross-Host MCP Config** | MCP configuration is generated simultaneously for all installed hosts (OpenCode primary). Non-destructive merge preserves manually configured MCPs. |
| **Secure Credentials** | MCP credentials stored in `.looply/custom/mcp/` (gitignored) -- never in plain text in host config files. |

### v1.5 — Problem Diagnosis & Auto-Fresh

| Update | Description |
|--------|-------------|
| **Problem Evaluator** | New workflow for diagnosing app problems. Uses looply artifacts (stories, specs, code graph, knowledge graph) as primary source for root cause analysis. Falls back to autonomous codebase deep-dive when artifacts are insufficient. |
| **Problem Investigator Agent** | New specialized agent that triangulates evidence across looply artifacts and codebase inspection for root cause analysis. |
| **Auto-Fresh Code Context** | Code context and knowledge graph now auto-refresh before every workflow. SHA256-based stale detection ensures data is always current without manual `refresh-code-context`. `--check` flag added to CLI for programmatic verification. |
| **File Hasher** | SHA256 file hash tracking in `.looply/state/file-hashes.json` for instant stale detection. Changed file detection without re-scanning the entire project. |

### v1.4 — Discovery & Host Expansion

| Update | Description |
|--------|-------------|
| **Skill Search** | Mandatory discovery gate — classifies user intent against all 10 looply workflows and enforces skill-first routing before any code action. `allow_implicit_invocation: true`. |
| **OpenCode Host** | Native publisher for OpenCode: `OPENCODE.md` entrypoint, workflow playbook, execution hints, skills, and command index. Install with `--host opencode`. |
| **Skill Creator** | Interactive slash command `/looply:skill-creator` that guides creation of looply skills. Asks questions, validates names, and generates cross-host SKILL.md, yamls, help files and indices. |

### v1.3 — Code Intelligence

| Update | Description |
|--------|-------------|
| **Knowledge Graph** | Persistent graph connecting modules, classes, functions and database tables. Traverses cross-module dependencies, extracts DB schema from Prisma/Drizzle/TypeORM/SQL (zero connection). `looply refresh-code-context`. |
| **DB Schema (Layer 1)** | Extracts tables, columns and foreign keys from `prisma/schema.prisma`, Drizzle, TypeORM decorators and SQL migrations. Static, no credentials. |
| **Cross-module Resolver** | `dependsOnModules` populated with real module dependencies by resolving relative imports across TypeScript, JavaScript, Python and .NET. |

### v1.2 — Quality of Life

| Update | Description |
|--------|-------------|
| **Update Notifier** | Checks npm for newer `@looply-cli/looply` on every command. 24h cache, non-blocking. |
| **Install Flow** | Prompts to generate code intelligence on completion. `story-to-production` skill references the knowledge graph in execution rules. |

---

> 📌 **Current status**: see [PROJECT_STATUS.md](./PROJECT_STATUS.md) for the up-to-date product snapshot, in-progress work, and next steps.

## Why Looply

AI coding agents are powerful but inconsistent. Without structure, every session starts from scratch — different tone, different conventions, different quality bar.

Looply solves this by shipping a curated, versioned set of **packs** — Markdown artifacts that encode your team's workflows, standards, agents, and operational context. Agents read them before producing output, so every session is calibrated the same way.

## How It Works

1. **Install** a pack into your project: `looply install`
2. **Publish** the pack to your AI hosts (Codex, Claude Code, OpenCode)
3. **Work** through structured workflows (`idea-to-prd` → `prd-to-stories` → `story-to-production`)
4. **Intervene** when needed (`replay`, `run-task`, `run-agent`, `reconcile`)
5. **Repeat** — packs are versioned, shared, and improved over time

## Quick Start

```bash
npm install -g @looply-cli/looply
cd your-project
looply install
```

Or try without installing:

```bash
npx @looply-cli/looply --help
```

## Features

| Area | Description |
|---|---|
| **Packs** | `engineering-base`, `product-base`, `software-delivery-suite` — modular, composable via `includes` |
| **Multi-host** | Publishes the same artifact set to Codex, Claude Code, and OpenCode |
| **Workflows** | `idea-to-prd`, `prd-to-stories`, `story-to-production`, `problem-evaluator`, `cloud-workload-design`, `platform-foundation-evolution` — handoff between agents |
| **Interventions** | `replay`, `run-task`, `run-agent`, `reconcile` — deviate from a workflow without losing state |
| **Skill Creator** | Interactive slash command to create new looply skills with validation, templates and index updates |
| **MCP Activation** | Activate MCP servers (GitHub, K8s, Linear, MySQL, PG, ELK, Grafana) with interactive setup, auto-install and cross-host config |
| **Auto-Resume** | Auto-detects persisted workflow state on new session start, questions user before acting, cross-host implicit invocation |
| **Skill Search** | Mandatory discovery skill that classifies user intent, maps to workflows, and enforces skill-first routing before code actions |
| **Project rules** | Six categories (`coding-standards`, `testing-requirements`, `security-policies`, etc.) — standard defaults or custom |
| **ICL guidance** | In-context example layer that calibrates agent output style and quality |
| **Code intelligence** | Multi-language code-context discovery + Knowledge Graph with module dependency resolution and database schema extraction |
| **Autocomplete** | Bash, Zsh, PowerShell — generated from the real CLI tree |
| **Desktop companion** | Local Electron app for browsing project snapshots, features, and sessions |
| **Docs** | Built-in VitePress portal — `looply docs open` or automated GitHub Pages deploy |

## Usage

```bash
# Interactive install with guided questionnaire
looply install

# Explicit parameters (non-interactive)
looply install \
  --host codex,claude,opencode \
  --scope project \
  --pack all \
  --locale pt-BR \
  --project-mode existing-project \
  --interaction-mode balanced

# Check project status
looply status
looply status --json

# Start a workflow
looply autonomy minha-feature

# Intervene during a workflow
looply replay minha-feature --from tech-spec
looply run-task minha-feature review-code
looply reconcile minha-feature

# Validate and diagnose
looply validate
looply doctor --host codex,claude,opencode --scope project

# Manage ICL guidance
looply icl set reduced

# Open documentation
looply docs open
```

## Commands

| Command | Description |
|---|---|
| `install` | Install packs and publish to hosts |
| `uninstall` | Remove looply from the project |
| `reinstall` | Reinstall while preserving customizations |
| `validate` | Validate artifacts and contracts |
| `doctor` | Installation diagnostics per host/scope |
| `status` | Consolidated project snapshot |
| `sync` | Sync published state with source |
| `refresh-context` | Update project context and code-context |
| `refresh-code-context` | Refresh code-context snapshot and knowledge graph (`--skip-graph` to skip, `--check` to auto-refresh only if stale) |
| `check-updates` | Check for newer pack versions |
| `upgrade` | Upgrade packs |
| `autonomy` | Derive the next host-driven cycle for a feature |
| `replay` | Resume a workflow from a previous artifact |
| `run-task` | Record a manual task execution |
| `run-agent` | Record a manual agent intervention |
| `reconcile` | Reconcile a feature after interventions |
| `list` | List available workflows, agents, or tasks |
| `inspect` | Show details of a workflow or agent |
| `integrations` | Expose known integration contexts |
| `mcp` | Activate, list, status and deactivate MCP servers |
| `icl` | Manage ICL example guidance |
| `docs` | Generate, build, and serve documentation |
| `completion` | Generate and install shell autocomplete |

## Workflows

| Workflow | Purpose |
|---|---|
| `idea-to-prd` | Transform an idea into a PRD with context and constraints |
| `prd-to-stories` | Break a PRD into implementable stories |
| `story-to-production` | Take a story from tech design through review to release |
| `problem-evaluator` | Diagnose app problems using looply artifacts with codebase deep-dive as fallback |
| `workflow-status` | Inspect state and recommend the next step |
| `cloud-workload-design` | Cloud topology, async-first, queueing, and governance decisions |
| `platform-foundation-evolution` | Shared foundation, guardrails, pipelines, identity, and observability |
| `auto-resume` | Auto-detect persisted state on new session, present stage/gate status, always question user before acting |
| `critique` | Deep critique and improvement of the current workflow step artifact with terminal approval form |
| `skill-creator` | Interactive creation of new looply skills. Generates SKILL.md, yamls, help files and updates indices |
| `skill-search` | Mandatory discovery layer. Maps user intent to workflows and enforces skill-first routing |

## Approach

**Artifact-first.** Every workflow stage produces a versioned Markdown artifact. Nothing lives only in chat history.

**Task-first.** Workflows are composed of discrete tasks, each owned by a named agent with explicit input/output contracts.

**Host-agnostic core.** The artifact engine doesn't know about any specific AI host. Publishing is a separate, host-aware layer.

**Codebase-first.** In existing projects, the real repository is always the primary source of truth. Looply context files are accelerators — not replacements.

**Incremental sync.** Updates are applied by file ownership. User customizations in `.looply/custom/` are never overwritten.

**Progressive disclosure.** Packs include checklists, templates, and decision trees that grow with the team — without requiring everyone to know everything upfront.

## Documentation

Full documentation at [riguelbf.github.io/looply](https://riguelbf.github.io/looply).

## Contributing

Looply is an opinionated tool. Contributions are welcome in the form of issues and pull requests. When proposing changes, start with the rationale — what problem it solves and why the current design falls short.

## License

[Apache 2.0](./LICENSE)
