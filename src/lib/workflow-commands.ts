import path from "node:path";
import fs from "fs-extra";
import type { CatalogArtifact } from "./artifact-catalog.js";

export interface WorkflowCommandArgument {
  name: string;
  description: string;
  required: boolean;
  variadic: boolean;
}

export interface WorkflowCommandDefinition {
  workflowName: string;
  phase?: string;
  orchestrator?: string;
  alias: string;
  canonicalName: string;
  name: string;
  description: string;
  argumentHint: string;
  arguments: WorkflowCommandArgument[];
}

export interface WorkflowCommandReference {
  alias: string;
  description: string;
  argumentHint: string;
  reference: string;
}

export interface CodexSkillDefinition {
  workflowName: string;
  phase?: string;
  orchestrator?: string;
  name: string;
  displayName: string;
  description: string;
  argumentHint: string;
  alias: string;
  arguments: WorkflowCommandArgument[];
}

export interface ContextSlot {
  name: string;
  source: string;
  compose: "inline" | "reference";
  filter?: string[];
}

export interface ComposedSection {
  slotName: string;
  content: string;
  compose: "inline" | "reference";
}

export interface ComposedContext {
  workflowName: string;
  sections: ComposedSection[];
}

export function listWorkflowCommands(input: {
  pack: string;
  artifacts: CatalogArtifact[];
  packClosure?: string[];
}): WorkflowCommandDefinition[] {
  const allowedPacks = new Set(input.packClosure ?? [input.pack]);
  return input.artifacts
    .filter((artifact) => allowedPacks.has(artifact.pack) && artifact.type === "workflow")
    .flatMap((artifact) => {
      return toCommandDefinitions(artifact);
    })
    .sort((left, right) => left.alias.localeCompare(right.alias));
}

export function renderClaudeWorkflowCommand(input: {
  command: WorkflowCommandDefinition;
  outputLocale: "en" | "pt-BR";
  projectMode: "existing-project" | "greenfield";
  interactionMode: "guided" | "balanced" | "autonomous";
  iclMode: "on" | "reduced" | "off";
  playbookReference: string;
  packReference: string;
  customReference: string;
  hintsReference: string;
  stateTemplateReference: string;
  exampleHintsReference: string;
  exampleReferences: string[];
}): string {
  const { command } = input;
  const stateFileHint = ".looply/custom/features/$1/workflow-status.md";
  const exampleInvocation = renderExampleInvocation(command, "claude");
  const lines = [
    "---",
    `description: ${command.description}`,
    `argument-hint: ${command.argumentHint}`,
    "---",
    "",
    `Run the looply workflow \`${command.workflowName}\` using the alias \`/${command.alias}\`.`,
    command.phase ? `Workflow phase: \`${command.phase}\`.` : "",
    command.orchestrator ? `Primary orchestrator: \`${command.orchestrator}\`.` : "",
    "",
    "Context references:",
    `- Workflow playbook: @${input.playbookReference}`,
    `- Managed pack: @${input.packReference}`,
    `- Workflow state template: @${input.stateTemplateReference}`,
    `- Custom overrides: @${input.customReference}`,
    `- Execution hints: @${input.hintsReference}`,
    `- Example hints: @${input.exampleHintsReference}`,
    "- Context index: `./.looply/state/context-index.md`",
    "- Project context: `./.looply/custom/project-context.md`",
    "- Session context: `./.looply/custom/session-context.md`",
    `- Output locale: \`${input.outputLocale}\``,
    `- Project mode: \`${input.projectMode}\``,
    `- Interaction mode: \`${input.interactionMode}\``,
    "",
    "State handling:",
    `- Feature state file: \`${stateFileHint}\``,
    `- Context ledger: \`.looply/custom/features/<feature-name>/context-ledger.md\` (append decisions after each stage)`,
    "- Read it first when it exists, otherwise create it from the workflow state template.",
    "- Session links file: `.looply/custom/session-links.json`",
    "- If context markdown files are empty, draft or stale, inspect the local codebase before making meaningful decisions.",
    "",
    "Arguments:",
    `- Raw arguments: \`$ARGUMENTS\``
  ];

  for (const [index, argument] of command.arguments.entries()) {
    lines.push(`- ${argument.name}: \`$${index + 1}\` (${argument.required ? "required" : "optional"})`);
  }

  lines.push(
    "",
    "Usage:",
    `- Host: \`Claude Code\``,
    `- Alias: \`${formatCommandForHost("claude", command)}\``,
    `- Syntax: \`${formatCommandForHost("claude", command, command.argumentHint)}\``,
    "",
    "Example:",
    `- \`${exampleInvocation}\``,
    "",
    "When to use:",
    renderWhenToUse(command),
    "",
    "Expected output:",
    renderExpectedOutput(command),
    "",
    "Suggested next step:",
    renderSuggestedNextStep(command, "claude")
  );

  lines.push("", ...renderExampleGuidanceLines({
    host: "claude",
    mode: input.iclMode,
    exampleReferences: input.exampleReferences
  }));

  lines.push(
    "",
    "Help mode:",
    "- If the user passes `help`, `--help` or `ajuda`, explain this command only.",
    "- In help mode, show syntax, arguments, example, expected output and next step.",
    "- In help mode, do not update workflow state or create artifacts.",
    "",
    "Presentation rules:",
    "- Use clear Markdown section titles for Workflow, Stage, Current Task, Gate, Decision and Next Step.",
    "- Highlight workflow, stage and task names in bold.",
    "- Keep the response visually scannable with one blank line between sections.",
    "- Do not use emojis.",
    "",
    "Required behavior:",
    "1. Check first whether the user asked for command help.",
    "2. Normalize the incoming arguments into a short problem statement, scope, and constraints.",
    "3. Create or update the feature state file before deciding the next step. Also read and maintain the context ledger at `.looply/custom/features/<feature-name>/context-ledger.md`.",
    "4. Open the workflow playbook first and follow the documented stages in order.",
    "5. Respect every blocking gate before moving to the next stage.",
    "6. Produce or update the expected artifacts for the current stage before advancing.",
    "7. Fill only the phase-relevant block in the workflow state file: Discovery Focus, Planning Focus or Delivery Focus.",
    "8. Update the feature state file after every relevant transition. Append your stage decisions to the context ledger.",
    "9. Preserve managed files as canonical and place local overrides only in `.looply/custom`.",
    "10. Before acting as a specialist, consult the current agent `knowledge_sources`, especially specialist `best-practices` documents.",
    "11. When the current task declares templates or checklists, use them as the default output contract and quality bar.",
    "12. When curated examples are referenced, use them only for style, structure and quality calibration.",
    `13. Generate user-facing outputs in \`${input.outputLocale}\` unless the user explicitly asks for another language.`,
    `14. When project mode is \`${input.projectMode}\`, treat the local project root as the default feature context unless the user points to another folder.`,
    input.projectMode === "existing-project"
      ? "15. For existing projects, use the real local codebase as the primary source of truth and use context files only as accelerators."
      : "15. For greenfield projects, use managed artifacts and explicit assumptions until a codebase exists.",
    "16. If a context file has `status: empty`, `status: draft` or `status: stale`, validate it before trusting it.",
    `17. Follow \`${input.interactionMode}\` interaction mode to avoid unnecessary repeated clarifications.`
  );

  return lines.join("\n");
}

export function renderCodexWorkflowCommand(input: {
  command: WorkflowCommandDefinition;
  outputLocale: "en" | "pt-BR";
  projectMode: "existing-project" | "greenfield";
  interactionMode: "guided" | "balanced" | "autonomous";
  iclMode: "on" | "reduced" | "off";
  playbookReference: string;
  packReference: string;
  customReference: string;
  hintsReference: string;
  stateTemplateReference: string;
  exampleHintsReference: string;
  exampleReferences: string[];
}): string {
  const { command } = input;
  const stateFileHint = ".looply/custom/features/<feature-name>/workflow-status.md";
  const exampleInvocation = renderExampleInvocation(command, "codex");

  const lines = [
    `# ${command.alias}`,
    "",
    `Invoke this workflow when the user asks for \`${command.alias}\`, \`/${command.alias}\`, or the Codex skill \`${formatCommandForHost("codex", command)}\`.`,
    "",
    `Workflow: \`${command.workflowName}\``,
    command.phase ? `Phase: \`${command.phase}\`` : "",
    command.orchestrator ? `Orchestrator: \`${command.orchestrator}\`` : "",
    `Description: ${command.description}`,
    `Argument hint: ${command.argumentHint}`,
    "",
    "References:",
    `- ${input.playbookReference}`,
    `- ${input.packReference}`,
    `- ${input.stateTemplateReference}`,
    `- ${input.customReference}`,
    `- ${input.hintsReference}`,
    `- ${input.exampleHintsReference}`,
    "- ./.looply/state/context-index.md",
    "- ./.looply/custom/project-context.md",
    "- ./.looply/custom/session-context.md",
    `- output locale: ${input.outputLocale}`,
    `- project mode: ${input.projectMode}`,
    `- interaction mode: ${input.interactionMode}`,
    "",
    `State file: ${stateFileHint}`,
    "Context ledger: .looply/custom/features/<feature-name>/context-ledger.md (append decisions after each stage)",
    "Read it first when it exists, otherwise create it from the workflow state template.",
    "Session links file: .looply/custom/session-links.json",
    "",
    "Argument mapping:"
  ];

  lines.push(
    "",
    "Usage:",
    `- Host: Codex`,
    `- Alias: ${formatCommandForHost("codex", command)}`,
    `- Syntax: ${formatCommandForHost("codex", command, command.argumentHint)}`.trimEnd(),
    "",
    "Example:",
    `- ${exampleInvocation}`,
    "",
    "When to use:",
    renderWhenToUse(command),
    "",
    "Expected output:",
    renderExpectedOutput(command),
    "",
    "Suggested next step:",
    renderSuggestedNextStep(command, "codex")
  );

  lines.push("", ...renderExampleGuidanceLines({
    host: "codex",
    mode: input.iclMode,
    exampleReferences: input.exampleReferences
  }));

  if (command.arguments.length === 0) {
    lines.push("- Use the raw user request as workflow input.");
  } else {
    for (const [index, argument] of command.arguments.entries()) {
      lines.push(`- arg${index + 1}: ${argument.name} (${argument.required ? "required" : "optional"})`);
      lines.push(`  ${argument.description}`);
    }
  }

  lines.push(
    "",
    "Help mode:",
    "- If the user says `help`, `--help` or `ajuda`, explain this command only.",
    "- In help mode, show syntax, arguments, example, expected output and next step.",
    "- In help mode, do not update workflow state or create artifacts.",
    "",
    "Presentation rules:",
    "- Use clear Markdown section titles for Workflow, Stage, Current Task, Gate, Decision and Next Step.",
    "- Highlight workflow, stage and task names in bold.",
    "- Keep the response visually scannable with one blank line between sections.",
    "- Do not use emojis.",
    "",
    "Execution rules:",
    "1. Check first whether the user asked for command help.",
    "2. Parse the user message into the declared arguments before taking action.",
    "3. Create or update the feature state file before deciding the next step. Also read and maintain the context ledger at `.looply/custom/features/<feature-name>/context-ledger.md`.",
    "4. Open the workflow playbook and follow stages sequentially.",
    "5. Do not skip blocking gates.",
    "6. Fill only the phase-relevant block in the workflow state file: Discovery Focus, Planning Focus or Delivery Focus.",
    "7. Update the feature state file after every relevant transition. Append your stage decisions to the context ledger.",
    "8. Use managed pack files as the canonical process definition.",
    "9. Read execution hints only as advisory metadata for cost and context selection.",
    "10. Before acting as a specialist, consult the current agent `knowledge_sources`, especially specialist `best-practices` documents.",
    "11. When the current task declares templates or checklists, use them as the default output contract and quality bar.",
    "12. When curated examples are referenced, use them only for style, structure and quality calibration.",
    `13. Generate user-facing outputs in ${input.outputLocale} unless the user explicitly asks for another language.`,
    `14. When project mode is ${input.projectMode}, treat the local project root as the default feature context unless the user points to another folder.`,
    input.projectMode === "existing-project"
      ? "15. For existing projects, use the real local codebase as the primary source of truth and use context files only as accelerators."
      : "15. For greenfield projects, use managed artifacts and explicit assumptions until a codebase exists.",
    "16. If a context file has `status: empty`, `status: draft` or `status: stale`, inspect the codebase before trusting it.",
    `17. Follow ${input.interactionMode} interaction mode to avoid unnecessary repeated clarifications.`
  );

  return lines.join("\n");
}

export function listCodexSkills(input: {
  commands: WorkflowCommandDefinition[];
}): CodexSkillDefinition[] {
  return input.commands.map((command) => ({
    workflowName: command.workflowName,
    phase: command.phase,
    orchestrator: command.orchestrator,
    name: command.alias.replaceAll(":", "-"),
    displayName: `$${command.alias.replaceAll(":", "-")}`,
    description: renderCodexSkillDescription(command),
    argumentHint: command.argumentHint,
    alias: command.alias,
    arguments: command.arguments
  }));
}

export async function composeContextForWorkflows(
  sourceRoot: string,
  catalog: CatalogArtifact[],
  commands: WorkflowCommandDefinition[]
): Promise<Map<string, ComposedSection[]>> {
  const contextMap = new Map<string, ComposedSection[]>();
  const workflowArtifacts = catalog.filter((a) => a.type === "workflow");
  const agentArtifacts = catalog.filter((a) => a.type === "agent");
  const ruleArtifacts = catalog.filter((a) => a.type === "rule");

  for (const command of commands) {
    const workflow = workflowArtifacts.find((w) => w.name === command.workflowName);
    if (!workflow) continue;

    const sections: ComposedSection[] = [];
    const stages = Array.isArray(workflow.frontmatter.stages)
      ? (workflow.frontmatter.stages as Array<Record<string, unknown>>)
      : [];

    for (const stage of stages) {
      const agentName = String(stage.agent ?? "");
      const agent = agentArtifacts.find((a) => a.name === agentName);
      if (!agent) continue;

      const slots = Array.isArray(agent.frontmatter.context_slots)
        ? (agent.frontmatter.context_slots as ContextSlot[])
        : [];
      if (slots.length === 0) continue;

      for (const slot of slots) {
        const content = await resolveContextSlot(sourceRoot, slot, agent, ruleArtifacts);
        if (content) {
          sections.push({
            slotName: `${String(stage.name ?? "")}: ${slot.name}`,
            content,
            compose: slot.compose
          });
        }
      }
    }

    if (sections.length > 0) {
      contextMap.set(command.workflowName, sections);
    }
  }

  return contextMap;
}

async function resolveContextSlot(
  sourceRoot: string,
  slot: ContextSlot,
  agent: CatalogArtifact,
  ruleArtifacts: CatalogArtifact[]
): Promise<string | null> {
  switch (slot.source) {
    case "self.constraints": {
      return renderSlotSection(slot.name, agent.frontmatter.constraints);
    }
    case "self.escalation_rules": {
      return renderSlotSection(slot.name, agent.frontmatter.escalation_rules);
    }
    case "self.knowledge_sources": {
      const sources = Array.isArray(agent.frontmatter.knowledge_sources)
        ? (agent.frontmatter.knowledge_sources as string[])
        : [];
      if (sources.length === 0) return null;
      const packRoot = path.join(sourceRoot, "packs", agent.pack);
      const bodies: string[] = [];
      for (const sourcePath of sources) {
        const resolved = path.resolve(packRoot, sourcePath);
        if (await fs.pathExists(resolved)) {
          const content = await fs.readFile(resolved, "utf8");
          const body = extractMarkdownBody(content);
          if (body) bodies.push(`### ${path.basename(sourcePath, ".md")}\n\n${body}`);
        }
      }
      if (bodies.length === 0) return null;
      return renderedSlotHeading(slot.name) + "\n\n" + bodies.join("\n\n");
    }
    case "rules": {
      const filter = slot.filter ?? [];
      const relevantRules = ruleArtifacts.filter((r) =>
        filter.includes(r.name)
      );
      if (relevantRules.length === 0) return null;
      const bodies: string[] = [];
      for (const rule of relevantRules) {
        if (!rule.file) continue;
        const resolved = path.join(sourceRoot, rule.file);
        if (await fs.pathExists(resolved)) {
          const content = await fs.readFile(resolved, "utf8");
          const body = extractMarkdownBody(content);
          if (body) bodies.push(`### ${rule.name}\n\n${body}`);
        }
      }
      if (bodies.length === 0) return null;
      return renderedSlotHeading(slot.name) + "\n\n" + bodies.join("\n\n");
    }
    case "stage.inputs": {
      return null; // reference slots are not resolved at build time
    }
    case "feature": {
      return null; // reference slots are not resolved at build time
    }
    case "workflow.ledger": {
      return null; // reference slots are not resolved at build time
    }
    default:
      return null;
  }
}

function extractMarkdownBody(content: string): string {
  const parts = content.split("---");
  if (parts.length >= 3) {
    return parts.slice(2).join("---").trim();
  }
  return content.trim();
}

function renderSlotSection(slotName: string, items: unknown): string | null {
  const lines = Array.isArray(items) ? (items as string[]) : [];
  if (lines.length === 0) return null;
  return renderedSlotHeading(slotName) + "\n\n" + lines.map((line) => `- ${line}`).join("\n");
}

function renderedSlotHeading(name: string): string {
  return `## ${capitalizeSlotName(name)}`;
}

function capitalizeSlotName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function renderCodexSkillDocument(input: {
  skill: CodexSkillDefinition;
  outputLocale: "en" | "pt-BR";
  projectMode: "existing-project" | "greenfield";
  interactionMode: "guided" | "balanced" | "autonomous";
  iclMode: "on" | "reduced" | "off";
  playbookReference: string;
  statusContractReference: string;
  packReference: string;
  customReference: string;
  hintsReference: string;
  stateTemplateReference: string;
  contextIndexReference: string;
  projectContextReference: string;
  sessionContextReference: string;
  exampleHintsReference: string;
  exampleReferences: string[];
  knowledgeGraphReference?: string;
  composedSections?: ComposedSection[];
}): string {
  const { skill } = input;
  const commandForExample: WorkflowCommandDefinition = {
    workflowName: skill.workflowName,
    phase: skill.phase,
    orchestrator: skill.orchestrator,
    name: skill.alias.replace(/^looply:/, ""),
    canonicalName: skill.alias.replace(/^looply:/, ""),
    alias: skill.alias,
    description: skill.description,
    argumentHint: skill.argumentHint,
    arguments: skill.arguments
  };

  const lines = [
    "---",
    `name: ${skill.name}`,
    `description: ${skill.description}`,
    "---",
    "",
    `Use this skill when the user explicitly invokes \`$${skill.name}\`, asks to run \`/${skill.alias}\`, or clearly requests the \`${skill.workflowName}\` workflow.`,
    skill.phase ? `Workflow phase: \`${skill.phase}\`.` : "",
    skill.orchestrator ? `Primary orchestrator: \`${skill.orchestrator}\`.` : "",
    "",
    "Quick usage:",
    `- \`${renderCodexSkillPrompt(skill)}\``,
    "",
    "Primary references:",
    `- Workflow playbook: ${input.playbookReference}`,
    `- Host status contract: ${input.statusContractReference}`,
    `- Managed pack: ${input.packReference}`,
    `- Workflow state template: ${input.stateTemplateReference}`,
    `- Context ledger: .looply/custom/features/<feature-name>/context-ledger.md (shared decision memory)`,
    `- Custom overrides: ${input.customReference}`,
    `- Execution hints: ${input.hintsReference}`,
    `- Example hints: ${input.exampleHintsReference}`,
    `- Context index: ${input.contextIndexReference}`,
    `- Project context: ${input.projectContextReference}`,
    `- Session context: ${input.sessionContextReference}`,
    input.knowledgeGraphReference ? `- Knowledge graph: ${input.knowledgeGraphReference} (use para impacto, dependencias entre modulos e schema de banco)` : null,
    "",
    "Usage:",
    `- Explicit mention: \`$${skill.name}\``,
    `- Workflow alias to honor: \`${formatCommandForHost("claude", commandForExample)}\` and \`${formatCommandForHost("codex", commandForExample)}\` depending on host`,
    `- Syntax in Codex: \`${formatCommandForHost("codex", commandForExample, skill.argumentHint)}\``,
    "",
    "Example:",
    `- ${renderExampleInvocation(commandForExample, "codex")}`,
    "",
    ...renderExampleGuidanceLines({
      host: "codex",
      mode: input.iclMode,
      exampleReferences: input.exampleReferences
    }),
    "",
    "Execution rules:",
    "1. Start by reading the workflow playbook, the host status contract if it exists, the feature state file if it already exists, and the context ledger at `.looply/custom/features/<feature-name>/context-ledger.md` if it already exists.",
    "2. If the user asked for help, explain syntax, arguments, example, expected output and next step without mutating state.",
    "3. Create or update `.looply/custom/features/<feature-name>/workflow-status.md` before advancing stages.",
    "4. After completing a workflow stage, append decisions, rationale, constraints and risks to `.looply/custom/features/<feature-name>/context-ledger.md` and update its `## Context Summary` section.",
    "5. Respect blocking gates and do not skip required artifacts.",
    "6. Use managed pack files as canonical process definition and write local state only under `.looply/custom`.",
    `7. Generate user-facing outputs in ${input.outputLocale} unless the user explicitly asks for another language.`,
    input.projectMode === "existing-project"
      ? "8. For existing projects, use the real local codebase as the primary source of truth and use context files only as accelerators."
      : "8. For greenfield projects, use managed artifacts and explicit assumptions until a codebase exists.",
    "9. If a context file has `status: empty`, `status: draft` or `status: stale`, validate it against the local codebase before trusting it.",
    `10. Follow ${input.interactionMode} interaction mode to avoid unnecessary repeated clarifications.`,
    "11. When curated examples are referenced, use them only for style, structure and quality calibration.",
    "12. Keep the response visually structured with clear Markdown section titles for Workflow, Stage, Current Task, Gate, Decision and Next Step.",
    "13. Do not use emojis.",
    skill.workflowName === "story-to-production"
      ? "14. Before implementing, check `.looply/state/knowledge-graph.json` for module dependencies, database tables and entities impacted by the story. Run `looply refresh-code-context` if the graph is missing or stale."
      : null
  ];

  if (input.composedSections && input.composedSections.length > 0) {
    const inlineSections = input.composedSections.filter((s) => s.compose === "inline");
    const referenceSections = input.composedSections.filter((s) => s.compose === "reference");

    if (inlineSections.length > 0 || referenceSections.length > 0) {
      lines.push("", "---", "", "## Composed Agent Context");
      lines.push("");
      lines.push("The sections below were pre-composed by looply from agent context_slots. Inline sections contain content resolved during install/sync. Reference sections list files the host should read at runtime.");
      lines.push("");
    }

    for (const section of inlineSections) {
      lines.push(section.content);
    }

    if (referenceSections.length > 0) {
      lines.push("", "### Reference Context (resolve at runtime)");
      lines.push("");
      lines.push("The following artifacts should be read at runtime from the feature directory:");
      for (const section of referenceSections) {
        lines.push(`- ${section.slotName}: \`.looply/custom/features/$1/\``);
      }
    }
  }

  if (skill.arguments.length > 0) {
    lines.push("", "Arguments:");
    for (const argument of skill.arguments) {
      lines.push(`- ${argument.name}: ${argument.description} (${argument.required ? "required" : "optional"})`);
    }
  }

  return lines.filter((line) => line !== "").join("\n");
}

export function renderCodexSkillMetadata(input: {
  skill: CodexSkillDefinition;
}): string {
  return [
    "interface:",
    `  display_name: \"${input.skill.displayName}\"`,
    `  short_description: \"${escapeYamlDoubleQuoted(input.skill.description)}\"`,
    "  brand_color: \"#7C3AED\"",
    `  default_prompt: \"${escapeYamlDoubleQuoted(renderCodexSkillPrompt(input.skill))}\"`,
    "",
    "policy:",
    "  allow_implicit_invocation: false"
  ].join("\n");
}

export function renderCodexLauncherSkillDocument(input: {
  pack: string;
  outputLocale: "en" | "pt-BR";
  projectMode: "existing-project" | "greenfield";
  interactionMode: "guided" | "balanced" | "autonomous";
  playbookReference: string;
  commandsIndexReference: string;
  hostContractReference: string;
  statusContractReference: string;
  commands: WorkflowCommandDefinition[];
}): string {
  const lines = [
    "---",
    "name: looply",
    "description: Use when the user asks what looply can do, how to start a workflow, which workflow to use, or how to continue a feature in Codex.",
    "---",
    "",
    "Use this skill as the main entrypoint for Looply inside Codex.",
    "",
    "Primary references:",
    `- Workflow playbook: ${input.playbookReference}`,
    `- Command index: ${input.commandsIndexReference}`,
    `- Host contract: ${input.hostContractReference}`,
    `- Host status contract: ${input.statusContractReference}`,
    "- Project contract: ../../../AGENTS.md",
    "",
    "When to use:",
    "- The user does not know which looply workflow to start.",
    "- The user asks how to continue a feature.",
    "- The user wants the available looply workflows.",
    "- The user asks for help with looply in Codex.",
    "",
    "Behavior:",
    "1. If the user asks what Looply can do, list the available workflows and when to use each one.",
    "2. If the user describes a raw idea, recommend `idea-to-prd`.",
    "3. If the user already has a PRD, recommend `prd-to-stories`.",
    "4. If the user already has a story and wants to implement, recommend `story-to-production`.",
    "5. If the user needs cloud topology, async-first trade-offs, governance or workload cost direction, recommend `cloud-workload-design`.",
    "6. If the user needs shared platform baselines, guardrails, pipelines or foundation evolution, recommend `platform-foundation-evolution`.",
    "7. If the user wants to know where work stopped, recommend `workflow-status`, `resume` or `next`.",
    "8. If the user asks for host-driven autonomy, consult `HOST_CONTRACT.md`, `host-status-contract.json` and use `looply autonomy <feature>` to derive the next cycle.",
    "9. Before routing to a specialist, inspect the agent `knowledge_sources`, especially specialist `best-practices` files.",
    "10. If the current task declares templates or checklists, treat them as the default artifact contract and quality bar.",
    "11. When curated examples are referenced by a workflow command, treat them as style guidance only.",
    "12. Prefer explicit next-step guidance over generic explanations.",
    `13. Use ${input.outputLocale} for user-facing responses unless the user explicitly asks for another language.`,
    `14. Respect project mode ${input.projectMode} and interaction mode ${input.interactionMode}.`,
    "",
    "Available workflows:"
  ];

  for (const command of input.commands) {
    if (command.canonicalName === "help") {
      continue;
    }
    lines.push(`- \`${formatCommandForHost("codex", command, command.argumentHint)}\``.trimEnd());
    lines.push(`  ${command.description}`);
  }

  lines.push(
    "",
    "Recommended sequence:",
    "1. `$looply-idea-to-prd <feature-name> [problem-statement] [constraints...]`",
    "2. `$looply-prd-to-stories <feature-name> [prd-reference] [notes...]`",
    "3. `$looply-story-to-production <feature-name> <story-reference> [constraints...]`",
    "4. `$looply-cloud-workload-design <feature-name> <scope-reference> [constraints...]` when cloud topology, async-first or governance is the main problem",
    "5. `$looply-platform-foundation-evolution <initiative-name> [constraints...]` when shared platform baseline or guardrails are the main problem",
    "6. `$looply-workflow-status <feature-name> [notes...]`",
    "",
    "Presentation rules:",
    "- Use clear Markdown section titles.",
    "- Prefer concise recommendations.",
    "- Do not use emojis."
  );

  return lines.join("\n");
}

export function renderCodexLauncherSkillMetadata(): string {
  return [
    "interface:",
    "  display_name: \"$looply\"",
    "  short_description: \"Looply entrypoint for workflow discovery and next-step guidance in Codex.\"",
    "  brand_color: \"#7C3AED\"",
    "  default_prompt: \"$looply\""
  ].join("\n");
}

export function renderHelpCommandDocument(input: {
  host: "codex" | "claude" | "opencode";
  pack: string;
  outputLocale: "en" | "pt-BR";
  projectMode: "existing-project" | "greenfield";
  interactionMode: "guided" | "balanced" | "autonomous";
  commands: WorkflowCommandDefinition[];
  commandReferences: WorkflowCommandReference[];
}): string {
  const header =
    input.host === "claude"
      ? ["---", "description: Show looply commands and the recommended workflow sequence", "argument-hint: [command-name]", "---", ""]
      : ["# looply:help", ""];

  const lines: string[] = [
    `looply help for pack \`${input.pack}\`.`,
    "",
    "Available commands:"
  ];

  for (const [index, command] of input.commands.entries()) {
    const reference = input.commandReferences[index];
    lines.push(
      `- \`${input.host === "claude" ? formatCommandForHost("claude", command, command.argumentHint) : formatCommandForHost("codex", command, command.argumentHint)}\``
        .trimEnd()
    );
    lines.push(`  ${command.description}`);
    lines.push(`  Reference: ${input.host === "claude" ? `@${reference.reference}` : reference.reference}`);
  }

  lines.push(
    "",
    "Recommended sequence:",
    input.host === "claude"
      ? "1. `/looply:idea-to-prd <feature-name> [problem-statement] [constraints...]`"
      : "1. `$looply-idea-to-prd <feature-name> [problem-statement] [constraints...]`",
    input.host === "claude"
      ? "2. `/looply:prd-to-stories <feature-name> [prd-reference] [notes...]`"
      : "2. `$looply-prd-to-stories <feature-name> [prd-reference] [notes...]`",
    input.host === "claude"
      ? "3. `/looply:story-to-production <feature-name> <story-reference> [constraints...]`"
      : "3. `$looply-story-to-production <feature-name> <story-reference> [constraints...]`",
    input.host === "claude"
      ? "4. `/looply:cloud-workload-design <feature-name> <scope-reference> [constraints...]` for workload cloud topology or async-first design"
      : "4. `$looply-cloud-workload-design <feature-name> <scope-reference> [constraints...]` for workload cloud topology or async-first design",
    input.host === "claude"
      ? "5. `/looply:platform-foundation-evolution <initiative-name> [constraints...]` for shared platform baselines and guardrails"
      : "5. `$looply-platform-foundation-evolution <initiative-name> [constraints...]` for shared platform baselines and guardrails",
    input.host === "claude"
      ? "6. `/looply:workflow-status <feature-name> [notes...]`"
      : "6. `$looply-workflow-status <feature-name> [notes...]`",
    "",
    "Help behavior:",
    "- If the user passes a command name like `idea-to-prd`, explain only that command.",
    "- Resolve the command using the reference list above.",
    "- Return syntax, arguments, example, expected output and suggested next step.",
    "- Do not execute workflows while answering help.",
    `- Default user-facing language: \`${input.outputLocale}\`.`,
    `- Project mode: \`${input.projectMode}\`.`,
    `- Interaction mode: \`${input.interactionMode}\`.`,
    "- Context priority is defined in `.looply/state/context-index.md`.",
    "- When multiple sessions are open, use `session-label` and `.looply/custom/session-links.json` to reconnect the right feature."
  );

  return [...header, ...lines].join("\n");
}

export function renderCodexCommandIndex(input: {
  pack: string;
  outputLocale: "en" | "pt-BR";
  projectMode: "existing-project" | "greenfield";
  interactionMode: "guided" | "balanced" | "autonomous";
  commands: WorkflowCommandDefinition[];
  commandReferences: WorkflowCommandReference[];
}): string {
  const lines: string[] = [
    "# LOOPLY Commands",
    "",
    `This file documents the looply workflow aliases for pack \`${input.pack}\`.`,
    `Default output locale: \`${input.outputLocale}\`.`,
    `Project mode: \`${input.projectMode}\`.`,
    `Interaction mode: \`${input.interactionMode}\`.`,
    "",
    "Alias handling for Codex:",
    "- Treat `/looply:*` strings as operational aliases defined by looply.",
    "- If slash command discovery does not expose them in the UI, still honor them when they appear in user messages.",
    "- If the user asks for help, open the referenced command file first and explain syntax, arguments, example, expected output and next step.",
    "- Read `.looply/state/context-index.md` to understand when context files are trustworthy and when the codebase must be inspected directly.",
    "- When multiple sessions are open, use `session-label` and `.looply/custom/session-links.json` to reconnect the right feature.",
    "",
    "Available aliases:"
  ];

  for (const [index, command] of input.commands.entries()) {
    const reference = input.commandReferences[index];
    lines.push(`- \`${formatCommandForHost("codex", command, command.argumentHint)}\``.trimEnd());
    lines.push(`  ${command.description}`);
    lines.push(`  Reference: ${reference.reference}`);
  }

  lines.push(
    "",
    "Recommended sequence:",
    "1. `$looply-idea-to-prd <feature-name> [problem-statement] [constraints...]`",
    "2. `$looply-prd-to-stories <feature-name> [prd-reference] [notes...]`",
    "3. `$looply-story-to-production <feature-name> <story-reference> [constraints...]`",
    "4. `$looply-cloud-workload-design <feature-name> <scope-reference> [constraints...]` for workload cloud topology or async-first design",
    "5. `$looply-platform-foundation-evolution <initiative-name> [constraints...]` for shared platform baselines and guardrails",
    "6. `$looply-workflow-status <feature-name> [notes...]`"
  );

  return lines.join("\n");
}

export function relativePathForDisplay(fromDirectory: string, absolutePath: string): string {
  const relative = path.relative(fromDirectory, absolutePath).replaceAll("\\", "/");
  return relative.startsWith(".") ? relative : `./${relative}`;
}

function toCommandDefinitions(artifact: CatalogArtifact): WorkflowCommandDefinition[] {
  const command = artifact.frontmatter.command;
  if (typeof command !== "object" || command === null) {
    return [];
  }

  const commandRecord = command as Record<string, unknown>;
  const name = typeof commandRecord.name === "string" ? commandRecord.name : "";
  if (!name) {
    return [];
  }
  const aliases = Array.isArray(commandRecord.aliases)
    ? commandRecord.aliases.map((item) => String(item)).filter((item) => item !== "")
    : [];

  const argumentsValue = Array.isArray(commandRecord.arguments) ? commandRecord.arguments : [];
  const argumentsList = argumentsValue
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      name: String(item.name ?? ""),
      description: String(item.description ?? ""),
      required: item.required === true,
      variadic: item.variadic === true
    }))
    .filter((item) => item.name !== "" && item.description !== "");

  const base: WorkflowCommandDefinition = {
    workflowName: artifact.name,
    phase: typeof artifact.frontmatter.phase === "string" ? String(artifact.frontmatter.phase) : undefined,
    orchestrator: typeof (artifact.frontmatter.orchestrator) === "string" ? String(artifact.frontmatter.orchestrator) : undefined,
    name,
    canonicalName: name,
    alias: `looply:${name}`,
    description: typeof commandRecord.description === "string"
      ? commandRecord.description
      : `Run workflow ${artifact.name}`,
    argumentHint: typeof commandRecord.argument_hint === "string" ? commandRecord.argument_hint : "",
    arguments: argumentsList
  };

  return [
    base,
    ...aliases.map((alias) => ({
      ...base,
      name: alias,
      alias: `looply:${alias}`,
      description: renderAliasDescription(alias, base.description)
    }))
  ];
}

function renderAliasDescription(alias: string, fallback: string): string {
  switch (alias) {
    case "resume":
      return "Resume the current feature workflow from the persisted state";
    case "next":
      return "Show the next recommended step for the current feature workflow";
    default:
      return fallback;
  }
}

function renderCodexSkillDescription(command: WorkflowCommandDefinition): string {
  switch (command.name) {
    case "idea-to-prd":
      return "Use for discovery work that turns a feature idea into a PRD. Do not use for story breakdown or implementation.";
    case "prd-to-stories":
      return "Use when a PRD already exists and needs to be broken into delivery stories. Do not use for raw idea discovery or implementation.";
    case "story-to-production":
      return "Use when a delivery story already exists and needs technical design, implementation, review and release preparation. Do not use before discovery and planning are complete.";
    case "cloud-workload-design":
      return "Use when the main problem is cloud topology, async-first communication, governance posture or workload cost direction before delivery.";
    case "platform-foundation-evolution":
      return "Use when the main problem is shared platform baseline, guardrails, pipelines, identity or observability foundation rather than a single workload feature.";
    case "workflow-status":
      return "Use to inspect the persisted state of a feature workflow and decide the next recommended step.";
    case "resume":
      return "Use to resume a persisted feature workflow from its saved state, especially when multiple sessions exist.";
    case "next":
      return "Use to show the next recommended step for a persisted feature workflow without restarting the whole flow.";
    default:
      return command.description;
  }
}

function escapeYamlDoubleQuoted(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"");
}

function renderCodexSkillPrompt(skill: CodexSkillDefinition): string {
  const placeholders = skill.arguments.map((argument) => {
    const base = argument.variadic
      ? `[${argument.name}...]`
      : argument.required
        ? `<${argument.name}>`
        : `[${argument.name}]`;

    const quoted = argument.name.includes("problem") || argument.name.includes("story") || argument.name.includes("constraints") || argument.name.includes("notes")
      ? `"${base}"`
      : base;

    return quoted;
  });

  return [`$${skill.name}`, ...placeholders].join(" ").trim();
}

function renderWhenToUse(command: WorkflowCommandDefinition): string {
  switch (command.name) {
    case "idea-to-prd":
      return "- Use when the feature is still in discovery and you need a PRD.";
    case "prd-to-stories":
      return "- Use when the PRD is approved and you need a delivery-ready story backlog.";
    case "story-to-production":
      return "- Use when a story was selected and delivery should advance through design, implementation and release planning.";
    case "cloud-workload-design":
      return "- Use when the main open question is cloud topology, async-first communication, governance controls or cost posture for a workload.";
    case "platform-foundation-evolution":
      return "- Use when the main open question is how to evolve shared platform foundation, guardrails or templates used by multiple teams.";
    case "workflow-status":
      return "- Use when you need to resume work or inspect the current state of a feature.";
    case "resume":
      return "- Use when you want to continue a feature from the persisted state of the current session or feature.";
    case "next":
      return "- Use when you only need the next recommended step, task and gate for a feature.";
    default:
      return "- Use when this workflow is the next recommended step in the feature lifecycle.";
  }
}

function renderExpectedOutput(command: WorkflowCommandDefinition): string {
  switch (command.name) {
    case "idea-to-prd":
      return "- An approved PRD and updated workflow state.";
    case "prd-to-stories":
      return "- A story backlog and updated workflow state.";
    case "story-to-production":
      return "- A release plan plus intermediate delivery artifacts.";
    case "cloud-workload-design":
      return "- A cloud tech spec, a cloud ADR and governance or cost review artifacts.";
    case "platform-foundation-evolution":
      return "- A platform foundation tech spec plus governance and cost review artifacts.";
    case "workflow-status":
      return "- A short decision summary and refreshed workflow state.";
    case "resume":
      return "- A resumed workflow summary plus refreshed workflow state.";
    case "next":
      return "- The next recommended workflow, task and gate plus refreshed workflow state.";
    default:
      return "- Updated workflow artifacts and persisted state.";
  }
}

function renderSuggestedNextStep(command: WorkflowCommandDefinition, host: "claude" | "codex" | "opencode"): string {
  switch (command.name) {
    case "idea-to-prd":
      return `- Host: ${renderHostLabel(host)}. After approval, run \`${formatNamedCommandForHost(host, "prd-to-stories")}\`.`;
    case "prd-to-stories":
      return `- Host: ${renderHostLabel(host)}. After story selection, run \`${formatNamedCommandForHost(host, "story-to-production")}\`.`;
    case "story-to-production":
      return `- Host: ${renderHostLabel(host)}. Use \`${formatNamedCommandForHost(host, "workflow-status")}\` whenever you need to resume or inspect delivery.`;
    case "cloud-workload-design":
      return `- Host: ${renderHostLabel(host)}. After cloud planning, continue with \`${formatNamedCommandForHost(host, "story-to-production")}\` or revisit \`${formatNamedCommandForHost(host, "workflow-status")}\` for the persisted next step.`;
    case "platform-foundation-evolution":
      return `- Host: ${renderHostLabel(host)}. After platform alignment, persist the follow-up in \`${formatNamedCommandForHost(host, "workflow-status")}\` or hand off the resulting baseline to the delivery workflow that will consume it.`;
    case "workflow-status":
      return `- Host: ${renderHostLabel(host)}. Continue with the workflow recommended in the state file using the host-specific alias.`;
    case "resume":
      return `- Host: ${renderHostLabel(host)}. Continue with the task and workflow returned by the resumed state.`;
    case "next":
      return `- Host: ${renderHostLabel(host)}. Execute the recommended next task or switch to \`${formatNamedCommandForHost(host, "resume")}\` for a fuller recap.`;
    default:
      return `- Host: ${renderHostLabel(host)}. Check the workflow state file for the next recommended command.`;
  }
}

function renderExampleGuidanceLines(input: {
  host: "claude" | "codex" | "opencode";
  mode: "on" | "reduced" | "off";
  exampleReferences: string[];
}): string[] {
  const lines = [
    "Curated example guidance:",
    `- ICL mode: \`${input.mode}\``
  ];

  if (input.mode === "off") {
    lines.push("- Example guidance is disabled for this project. Use templates, checklists, workflow state and the live codebase only.");
    return lines;
  }

  lines.push("- Use examples only for style, structure and quality calibration.");
  lines.push("- Do not copy feature-specific names, identifiers or business details from examples.");

  if (input.exampleReferences.length === 0) {
    lines.push("- No example was selected for this workflow.");
    return lines;
  }

  lines.push("- Selected examples:");
  for (const reference of input.exampleReferences) {
    lines.push(`- ${input.host === "claude" ? `@${reference}` : reference}`);
  }

  return lines;
}

function renderExampleInvocation(command: WorkflowCommandDefinition, host: "claude" | "codex" | "opencode"): string {
  switch (command.name) {
    case "idea-to-prd":
      return formatNamedCommandForHost(
        host,
        "idea-to-prd",
        'pix-webhook-retry "falhas transientes no webhook PIX geram reconciliacao manual" "manter compatibilidade com contrato atual"'
      );
    case "prd-to-stories":
      return formatNamedCommandForHost(host, "prd-to-stories", "pix-webhook-retry prd-pix-webhook-retry");
    case "story-to-production":
      return formatNamedCommandForHost(host, "story-to-production", "pix-webhook-retry story-01-retry-automatico");
    case "cloud-workload-design":
      return formatNamedCommandForHost(host, "cloud-workload-design", 'pix-webhook-retry payments-api "introduzir fila para retries de webhook e revisar controles cloud"');
    case "platform-foundation-evolution":
      return formatNamedCommandForHost(host, "platform-foundation-evolution", '"platform-observability-baseline" "padronizar tracing, logging e guardrails de deploy"');
    case "workflow-status":
      return formatNamedCommandForHost(host, "workflow-status", "pix-webhook-retry");
    case "resume":
      return formatNamedCommandForHost(host, "resume", "pix-webhook-retry backend-afternoon");
    case "next":
      return formatNamedCommandForHost(host, "next", "pix-webhook-retry backend-afternoon");
    default:
      return formatCommandForHost(host, command).trimEnd();
  }
}

function formatCommandForHost(
  host: "claude" | "codex" | "opencode",
  command: WorkflowCommandDefinition,
  args = ""
): string {
  const prefix = host === "claude" ? `/${command.alias}` : `$${command.alias.replaceAll(":", "-")}`;
  return [prefix, args].filter((part) => part.trim() !== "").join(" ").trim();
}

function formatNamedCommandForHost(host: "claude" | "codex" | "opencode", commandName: string, args = ""): string {
  const alias = `looply:${commandName}`;
  const prefix = host === "claude" ? `/${alias}` : `$${alias.replaceAll(":", "-")}`;
  return [prefix, args].filter((part) => part.trim() !== "").join(" ").trim();
}

function renderHostLabel(host: "claude" | "codex" | "opencode"): string {
  if (host === "claude") return "Claude Code";
  if (host === "opencode") return "OpenCode";
  return "Codex";
}
