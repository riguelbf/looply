import fs from "fs-extra";
import path from "node:path";
import type { CompletionCommandNode, CompletionOptionNode } from "./schema.js";

export interface CompletionSuggestion {
  value: string;
  description?: string;
}

export interface CompletionRequest {
  tree: CompletionCommandNode;
  tokens: string[];
  currentWord: string;
  targetRoot: string;
  pendingOption?: CompletionOptionNode | null;
}

const ENUM_OPTION_VALUES: Record<string, CompletionSuggestion[]> = {
  "--host": [
    { value: "codex", description: "OpenAI Codex host" },
    { value: "claude", description: "Claude host" }
  ],
  "--scope": [
    { value: "project", description: "Project-scoped installation" },
    { value: "global", description: "Global installation" }
  ],
  "--locale": [
    { value: "en", description: "English output" },
    { value: "pt-BR", description: "Brazilian Portuguese output" }
  ],
  "--project-mode": [
    { value: "existing-project", description: "Use repository-first inference" },
    { value: "greenfield", description: "Use artifact-first inference" }
  ],
  "--interaction-mode": [
    { value: "guided", description: "More guided interactions" },
    { value: "balanced", description: "Balanced interactions" },
    { value: "autonomous", description: "More autonomous interactions" }
  ],
  "--shell": [
    { value: "bash", description: "Bash shell completion" },
    { value: "zsh", description: "Zsh shell completion" },
    { value: "powershell", description: "PowerShell shell completion" }
  ],
  "--workflow": [
    { value: "story-to-production", description: "Story to production workflow" }
  ],
  "--status": [
    { value: "draft" },
    { value: "active" },
    { value: "stale" }
  ],
  "--coverage": [
    { value: "low" },
    { value: "medium" },
    { value: "high" }
  ]
};

export async function resolveCompletionSuggestions(
  request: CompletionRequest
): Promise<CompletionSuggestion[]> {
  const context = await resolveCommandContext(request.tree, request.tokens);
  if (request.pendingOption) {
    return filterSuggestions(
      await resolveOptionValueSuggestions(request.pendingOption, context.command, request.targetRoot),
      request.currentWord
    );
  }

  if (request.currentWord.startsWith("-")) {
    const optionSuggestions = context.command.options.flatMap((option) => renderOptionSuggestions(option));
    return filterSuggestions(optionSuggestions, request.currentWord);
  }

  const nextSubcommands: CompletionSuggestion[] = context.command.subcommands.map((subcommand) => ({
    value: subcommand.name,
    description: subcommand.summary || subcommand.description
  }));

  const positionalSuggestions = await resolveArgumentSuggestions(context.command, context.positionIndex, request.targetRoot);
  return filterSuggestions(nextSubcommands.concat(positionalSuggestions), request.currentWord);
}

async function resolveCommandContext(tree: CompletionCommandNode, tokens: string[]): Promise<{
  command: CompletionCommandNode;
  positionIndex: number;
}> {
  let command = tree;
  let positionIndex = 0;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "" || token.startsWith("-")) {
      continue;
    }

    const option = findOption(command, token);
    if (option && option.expectsValue) {
      index += 1;
      continue;
    }

    const subcommand = command.subcommands.find((entry) => entry.name === token || entry.aliases.includes(token));
    if (subcommand) {
      command = subcommand;
      positionIndex = 0;
      continue;
    }

    positionIndex += 1;
  }

  return { command, positionIndex };
}

export function resolvePendingOption(
  command: CompletionCommandNode,
  tokens: string[]
): CompletionOptionNode | null {
  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    const token = tokens[index];
    if (token === "") {
      continue;
    }
    if (!token.startsWith("-")) {
      return null;
    }
    const option = findOption(command, token);
    if (!option || !option.expectsValue) {
      return null;
    }
    return option;
  }
  return null;
}

async function resolveOptionValueSuggestions(
  option: CompletionOptionNode,
  command: CompletionCommandNode,
  targetRoot: string
): Promise<CompletionSuggestion[]> {
  if (option.long && ENUM_OPTION_VALUES[option.long]) {
    return ENUM_OPTION_VALUES[option.long];
  }

  if ((command.name === "run-task" || command.name === "run-agent" || command.name === "replay") && option.long === "--dir") {
    return [];
  }

  return [];
}

async function resolveArgumentSuggestions(
  command: CompletionCommandNode,
  positionIndex: number,
  targetRoot: string
): Promise<CompletionSuggestion[]> {
  const argument = command.arguments[positionIndex];
  if (!argument) {
    return [];
  }

  if (argument.name === "feature" || argument.name === "name") {
    if (command.name === "run-task" || command.name === "run-agent" || command.name === "replay") {
      return listFeatureSuggestions(targetRoot);
    }
    if (command.path.join(" ") === "looply integrations configure") {
      return listIntegrationSuggestions(targetRoot);
    }
  }

  if (argument.name === "task" && command.name === "run-task") {
    return listTaskSuggestions(targetRoot);
  }

  if (argument.name === "agent" && command.name === "run-agent") {
    return listAgentSuggestions(targetRoot);
  }

  if (argument.name === "shell" && command.path.join(" ") === "looply completion") {
    return [
      { value: "bash" },
      { value: "zsh" },
      { value: "powershell" }
    ];
  }

  return [];
}

function renderOptionSuggestions(option: CompletionOptionNode): CompletionSuggestion[] {
  const suggestions: CompletionSuggestion[] = [];
  if (option.long) {
    suggestions.push({ value: option.long, description: option.description });
  }
  if (option.short) {
    suggestions.push({ value: option.short, description: option.description });
  }
  return suggestions;
}

function findOption(command: CompletionCommandNode, token: string): CompletionOptionNode | null {
  return command.options.find((option) => option.long === token || option.short === token) ?? null;
}

function filterSuggestions(suggestions: CompletionSuggestion[], currentWord: string): CompletionSuggestion[] {
  const prefix = currentWord.trim();
  const deduped = new Map<string, CompletionSuggestion>();

  for (const suggestion of suggestions) {
    if (prefix !== "" && !suggestion.value.startsWith(prefix)) {
      continue;
    }
    if (!deduped.has(suggestion.value)) {
      deduped.set(suggestion.value, suggestion);
    }
  }

  return Array.from(deduped.values()).sort((left, right) => left.value.localeCompare(right.value));
}

async function listFeatureSuggestions(targetRoot: string): Promise<CompletionSuggestion[]> {
  const featuresRoot = path.join(targetRoot, ".looply", "custom", "features");
  if (!(await fs.pathExists(featuresRoot))) {
    return [];
  }

  const entries = await fs.readdir(featuresRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ value: entry.name, description: "Feature" }))
    .sort((left, right) => left.value.localeCompare(right.value));
}

async function listIntegrationSuggestions(targetRoot: string): Promise<CompletionSuggestion[]> {
  const integrationsRoot = path.join(targetRoot, ".looply", "custom", "integrations");
  if (!(await fs.pathExists(integrationsRoot))) {
    return [];
  }

  const entries = await fs.readdir(integrationsRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => ({ value: entry.name.replace(/\.md$/, ""), description: "Integration" }))
    .sort((left, right) => left.value.localeCompare(right.value));
}

async function listTaskSuggestions(targetRoot: string): Promise<CompletionSuggestion[]> {
  const features = await listFeatureSuggestions(targetRoot);
  if (features.length === 0) {
    return [];
  }
  return [
    { value: "create-tech-spec" },
    { value: "implement-api" },
    { value: "technical-review" }
  ];
}

async function listAgentSuggestions(targetRoot: string): Promise<CompletionSuggestion[]> {
  const features = await listFeatureSuggestions(targetRoot);
  if (features.length === 0) {
    return [];
  }
  return [
    { value: "architect" },
    { value: "backend" },
    { value: "frontend" },
    { value: "qa" },
    { value: "orchestrator" }
  ];
}

export function resolveCommandForTokens(tree: CompletionCommandNode, tokens: string[]): CompletionCommandNode {
  let command = tree;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.startsWith("-")) {
      const option = findOption(command, token);
      if (option?.expectsValue) {
        index += 1;
      }
      continue;
    }

    const subcommand = command.subcommands.find((entry) => entry.name === token || entry.aliases.includes(token));
    if (!subcommand) {
      break;
    }

    command = subcommand;
  }

  return command;
}
