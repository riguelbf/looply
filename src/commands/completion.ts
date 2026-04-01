import type { Command } from "commander";
import path from "node:path";
import { detectSupportedShell, installShellCompletion, renderInstallInstructions } from "../lib/cli-completion/install.js";
import { introspectCompletionTree } from "../lib/cli-completion/introspect.js";
import { renderBashCompletion } from "../lib/cli-completion/render-bash.js";
import { renderPowerShellCompletion } from "../lib/cli-completion/render-powershell.js";
import { resolveCommandForTokens, resolveCompletionSuggestions, resolvePendingOption } from "../lib/cli-completion/runtime.js";
import type { CompletionShell } from "../lib/cli-completion/schema.js";
import { renderZshCompletion } from "../lib/cli-completion/render-zsh.js";

export function registerCompletionCommand(program: Command): void {
  const completion = program
    .command("completion")
    .description("Generate or inspect shell completion for the looply CLI");

  completion
    .argument("[shell]", "Shell name such as bash, zsh or powershell")
    .option("--shell <shell>", "Shell name such as bash, zsh or powershell")
    .option("--install", "Print install instructions together with the generated completion")
    .option("--dir <dir>", "Target directory for repository-aware completion values (defaults to current directory)")
    .action(async (shellArg, options) => {
      const shell = normalizeShell(options.shell ?? shellArg ?? detectCurrentShell());

      if (options.install) {
        console.log(renderInstallInstructions(shell));
        console.log("");
      }

      console.log(renderCompletionForShell(shell));
    });

  completion
    .command("install [shell]")
    .description("Print shell-specific install instructions for looply completion")
    .option("--shell <shell>", "Shell name such as bash, zsh or powershell")
    .option("--enable", "Install and enable shell completion automatically")
    .action(async (shellArg, options) => {
      const shell = normalizeShell(options.shell ?? shellArg ?? detectCurrentShell());
      if (options.enable) {
        const result = await installShellCompletion(shell);
        console.log(`Enabled ${shell} completion.`);
        console.log(`completion file: ${result.completionFile}`);
        console.log(`shell rc file: ${result.rcFile}${result.changedRcFile ? " (updated)" : " (already configured)"}`);
        return;
      }
      console.log(renderInstallInstructions(shell));
    });

  program
    .command("__complete", { hidden: true })
    .description("Internal completion runtime")
    .allowUnknownOption(true)
    .option("--shell <shell>", "Shell name such as bash, zsh or powershell")
    .option("--index <index>", "Current token index", "0")
    .option("--current-word <word>", "Current word being completed", "")
    .argument("[tokens...]", "Completion tokens")
    .action(async (tokens: string[], options) => {
      const shell = normalizeShell(options.shell ?? "bash");
      const targetRoot = path.resolve(process.cwd());
      const allTokens = Array.isArray(tokens) ? tokens : [];
      const requestedIndex = Number.parseInt(String(options.index ?? "0"), 10);
      const safeIndex = Number.isFinite(requestedIndex) ? requestedIndex : allTokens.length;
      const currentWord = typeof options.currentWord === "string" && options.currentWord !== ""
        ? options.currentWord
        : allTokens.at(safeIndex - 1) ?? "";
      const precedingTokens = allTokens.slice(0, Math.max(0, safeIndex - 1));
      const tree = introspectCompletionTree(program);
      const command = resolveCommandForTokens(tree, precedingTokens);
      const pendingOption = resolvePendingOption(command, precedingTokens);
      const suggestions = await resolveCompletionSuggestions({
        tree,
        tokens: pendingOption ? precedingTokens.slice(0, -1) : precedingTokens,
        currentWord,
        targetRoot,
        pendingOption
      });

      if (shell === "zsh") {
        for (const suggestion of suggestions) {
          if (suggestion.description) {
            console.log(`${suggestion.value}:${suggestion.description}`);
          } else {
            console.log(suggestion.value);
          }
        }
        return;
      }

      if (shell === "powershell") {
        for (const suggestion of suggestions) {
          console.log(`${suggestion.value}\t${suggestion.description ?? suggestion.value}`);
        }
        return;
      }

      for (const suggestion of suggestions) {
        console.log(suggestion.value);
      }
    });
}

function renderCompletionForShell(shell: CompletionShell): string {
  switch (shell) {
    case "bash":
      return renderBashCompletion();
    case "zsh":
      return renderZshCompletion();
    case "powershell":
      return renderPowerShellCompletion();
  }
}

function normalizeShell(value: string): CompletionShell {
  const detected = detectSupportedShell(value);
  if (detected) {
    return detected;
  }
  return "bash";
}

function detectCurrentShell(): string {
  return path.basename(process.env.SHELL ?? process.env.ComSpec ?? "bash");
}
