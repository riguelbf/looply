import path from "node:path";
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

export function listWorkflowCommands(input: {
  pack: string;
  artifacts: CatalogArtifact[];
}): WorkflowCommandDefinition[] {
  return input.artifacts
    .filter((artifact) => artifact.pack === input.pack && artifact.type === "workflow")
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
  playbookReference: string;
  packReference: string;
  customReference: string;
  hintsReference: string;
  stateTemplateReference: string;
}): string {
  const { command } = input;
  const stateFileHint = ".looply/custom/features/$1/workflow-status.md";
  const exampleInvocation = renderExampleInvocation(command);
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
    "- Context index: `./.looply/state/context-index.md`",
    "- Project context: `./.looply/custom/project-context.md`",
    "- Session context: `./.looply/custom/session-context.md`",
    `- Output locale: \`${input.outputLocale}\``,
    `- Project mode: \`${input.projectMode}\``,
    `- Interaction mode: \`${input.interactionMode}\``,
    "",
    "State handling:",
    `- Feature state file: \`${stateFileHint}\``,
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
    `- Alias: \`/${command.alias}\``,
    `- Syntax: \`/${command.alias} ${command.argumentHint}\``,
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
    renderSuggestedNextStep(command)
  );

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
    "3. Create or update the feature state file before deciding the next step.",
    "4. Open the workflow playbook first and follow the documented stages in order.",
    "5. Respect every blocking gate before moving to the next stage.",
    "6. Produce or update the expected artifacts for the current stage before advancing.",
    "7. Fill only the phase-relevant block in the workflow state file: Discovery Focus, Planning Focus or Delivery Focus.",
    "8. Update the feature state file after every relevant transition.",
    "9. Preserve managed files as canonical and place local overrides only in `.looply/custom`.",
    `10. Generate user-facing outputs in \`${input.outputLocale}\` unless the user explicitly asks for another language.`,
    `11. When project mode is \`${input.projectMode}\`, treat the local project root as the default feature context unless the user points to another folder.`,
    input.projectMode === "existing-project"
      ? "12. For existing projects, use the real local codebase as the primary source of truth and use context files only as accelerators."
      : "12. For greenfield projects, use managed artifacts and explicit assumptions until a codebase exists.",
    "13. If a context file has `status: empty`, `status: draft` or `status: stale`, validate it before trusting it.",
    `14. Follow \`${input.interactionMode}\` interaction mode to avoid unnecessary repeated clarifications.`
  );

  return lines.join("\n");
}

export function renderCodexWorkflowCommand(input: {
  command: WorkflowCommandDefinition;
  outputLocale: "en" | "pt-BR";
  projectMode: "existing-project" | "greenfield";
  interactionMode: "guided" | "balanced" | "autonomous";
  playbookReference: string;
  packReference: string;
  customReference: string;
  hintsReference: string;
  stateTemplateReference: string;
}): string {
  const { command } = input;
  const stateFileHint = ".looply/custom/features/<feature-name>/workflow-status.md";
  const exampleInvocation = renderExampleInvocation(command);

  const lines = [
    `# ${command.alias}`,
    "",
    `Invoke this workflow when the user asks for \`${command.alias}\` or \`/${command.alias}\`.`,
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
    "- ./.looply/state/context-index.md",
    "- ./.looply/custom/project-context.md",
    "- ./.looply/custom/session-context.md",
    `- output locale: ${input.outputLocale}`,
    `- project mode: ${input.projectMode}`,
    `- interaction mode: ${input.interactionMode}`,
    "",
    `State file: ${stateFileHint}`,
    "Read it first when it exists, otherwise create it from the workflow state template.",
    "Session links file: .looply/custom/session-links.json",
    "",
    "Argument mapping:"
  ];

  lines.push(
    "",
    "Usage:",
    `- Alias: /${command.alias}`,
    `- Syntax: /${command.alias} ${command.argumentHint}`.trimEnd(),
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
    renderSuggestedNextStep(command)
  );

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
    "3. Create or update the feature state file before deciding the next step.",
    "4. Open the workflow playbook and follow stages sequentially.",
    "5. Do not skip blocking gates.",
    "6. Fill only the phase-relevant block in the workflow state file: Discovery Focus, Planning Focus or Delivery Focus.",
    "7. Update the feature state file after every relevant transition.",
    "8. Use managed pack files as the canonical process definition.",
    "9. Read execution hints only as advisory metadata for cost and context selection.",
    `10. Generate user-facing outputs in ${input.outputLocale} unless the user explicitly asks for another language.`,
    `11. When project mode is ${input.projectMode}, treat the local project root as the default feature context unless the user points to another folder.`,
    input.projectMode === "existing-project"
      ? "12. For existing projects, use the real local codebase as the primary source of truth and use context files only as accelerators."
      : "12. For greenfield projects, use managed artifacts and explicit assumptions until a codebase exists.",
    "13. If a context file has `status: empty`, `status: draft` or `status: stale`, inspect the codebase before trusting it.",
    `14. Follow ${input.interactionMode} interaction mode to avoid unnecessary repeated clarifications.`
  );

  return lines.join("\n");
}

export function renderHelpCommandDocument(input: {
  host: "codex" | "claude";
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
    lines.push(`- \`/${command.alias}\` ${command.argumentHint}`.trimEnd());
    lines.push(`  ${command.description}`);
    lines.push(`  Reference: ${input.host === "claude" ? `@${reference.reference}` : reference.reference}`);
  }

  lines.push(
    "",
    "Recommended sequence:",
    "1. `/looply:idea-to-prd <feature-name> [problem-statement] [constraints...]`",
    "2. `/looply:prd-to-stories <feature-name> [prd-reference] [notes...]`",
    "3. `/looply:story-to-production <feature-name> <story-reference> [constraints...]`",
    "4. `/looply:workflow-status <feature-name> [notes...]`",
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
    lines.push(`- \`/${command.alias}\` ${command.argumentHint}`.trimEnd());
    lines.push(`  ${command.description}`);
    lines.push(`  Reference: ${reference.reference}`);
  }

  lines.push(
    "",
    "Recommended sequence:",
    "1. `/looply:idea-to-prd <feature-name> [problem-statement] [constraints...]`",
    "2. `/looply:prd-to-stories <feature-name> [prd-reference] [notes...]`",
    "3. `/looply:story-to-production <feature-name> <story-reference> [constraints...]`",
    "4. `/looply:workflow-status <feature-name> [notes...]`"
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

function renderWhenToUse(command: WorkflowCommandDefinition): string {
  switch (command.name) {
    case "idea-to-prd":
      return "- Use when the feature is still in discovery and you need a PRD.";
    case "prd-to-stories":
      return "- Use when the PRD is approved and you need a delivery-ready story backlog.";
    case "story-to-production":
      return "- Use when a story was selected and delivery should advance through design, implementation and release planning.";
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

function renderSuggestedNextStep(command: WorkflowCommandDefinition): string {
  switch (command.name) {
    case "idea-to-prd":
      return "- After approval, run `/looply:prd-to-stories`.";
    case "prd-to-stories":
      return "- After story selection, run `/looply:story-to-production`.";
    case "story-to-production":
      return "- Use `/looply:workflow-status` whenever you need to resume or inspect delivery.";
    case "workflow-status":
      return "- Continue with the workflow recommended in the state file.";
    case "resume":
      return "- Continue with the task and workflow returned by the resumed state.";
    case "next":
      return "- Execute the recommended next task or switch to `/looply:resume` for a fuller recap.";
    default:
      return "- Check the workflow state file for the next recommended command.";
  }
}

function renderExampleInvocation(command: WorkflowCommandDefinition): string {
  switch (command.name) {
    case "idea-to-prd":
      return "/looply:idea-to-prd pix-webhook-retry \"falhas transientes no webhook PIX geram reconciliacao manual\" \"manter compatibilidade com contrato atual\"";
    case "prd-to-stories":
      return "/looply:prd-to-stories pix-webhook-retry prd-pix-webhook-retry";
    case "story-to-production":
      return "/looply:story-to-production pix-webhook-retry story-01-retry-automatico";
    case "workflow-status":
      return "/looply:workflow-status pix-webhook-retry";
    case "resume":
      return "/looply:resume pix-webhook-retry backend-afternoon";
    case "next":
      return "/looply:next pix-webhook-retry backend-afternoon";
    default:
      return `/${command.alias}`.trimEnd();
  }
}
