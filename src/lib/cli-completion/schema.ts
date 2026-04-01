export type CompletionShell = "bash" | "zsh" | "powershell";

export interface CompletionArgumentNode {
  name: string;
  required: boolean;
  variadic: boolean;
  description: string;
}

export interface CompletionOptionNode {
  name: string;
  flags: string;
  description: string;
  short?: string;
  long?: string;
  required: boolean;
  expectsValue: boolean;
  optionalValue: boolean;
  valueName?: string;
}

export interface CompletionCommandNode {
  name: string;
  aliases: string[];
  description: string;
  summary: string;
  hidden: boolean;
  path: string[];
  options: CompletionOptionNode[];
  arguments: CompletionArgumentNode[];
  subcommands: CompletionCommandNode[];
}
