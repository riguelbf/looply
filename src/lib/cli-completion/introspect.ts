import type { Argument, Command, Option } from "commander";
import type {
  CompletionArgumentNode,
  CompletionCommandNode,
  CompletionOptionNode
} from "./schema.js";

export function introspectCompletionTree(program: Command): CompletionCommandNode {
  return introspectCommand(program, []);
}

function introspectCommand(command: Command, parentPath: string[]): CompletionCommandNode {
  const name = command.name();
  const path = parentPath.concat(name);
  const aliases = command.aliases();
  const description = command.description() ?? "";
  const summary = command.summary() ?? description;
  const options = dedupeOptions(collectVisibleOptions(command)).map(introspectOption);
  const argumentsList = collectArguments(command).map(introspectArgument);
  const subcommands = command.commands
    .filter((subcommand) => !isHidden(subcommand))
    .map((subcommand) => introspectCommand(subcommand, path));

  return {
    name,
    aliases,
    description,
    summary,
    hidden: isHidden(command),
    path,
    options,
    arguments: argumentsList,
    subcommands
  };
}

function collectVisibleOptions(command: Command): Option[] {
  return command.options.filter((option) => !isHidden(option));
}

function collectArguments(command: Command): Argument[] {
  return (command.registeredArguments ?? []) as Argument[];
}

function introspectOption(option: Option): CompletionOptionNode {
  const long = option.long || undefined;
  const short = option.short || undefined;
  const valueName = extractValueName(option.flags);

  return {
    name: long ?? short ?? option.attributeName(),
    flags: option.flags,
    description: option.description ?? "",
    short,
    long,
    required: Boolean(option.mandatory),
    expectsValue: Boolean(option.required || option.optional),
    optionalValue: Boolean(option.optional),
    valueName
  };
}

function introspectArgument(argument: Argument): CompletionArgumentNode {
  return {
    name: argument.name(),
    required: argument.required,
    variadic: argument.variadic,
    description: argument.description ?? ""
  };
}

function dedupeOptions(options: Option[]): Option[] {
  const seen = new Set<string>();
  const unique: Option[] = [];

  for (const option of options) {
    const key = `${option.long}|${option.short}|${option.flags}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(option);
  }

  return unique;
}

function extractValueName(flags: string): string | undefined {
  const match = flags.match(/[<[ ]([A-Za-z0-9_-]+)[>\]]/);
  return match?.[1];
}

function isHidden(input: unknown): boolean {
  const candidate = input as { hidden?: boolean | (() => boolean); _hidden?: boolean };
  if (typeof candidate.hidden === "function") {
    return Boolean(candidate.hidden());
  }
  return Boolean(candidate.hidden ?? candidate._hidden);
}
