import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import type { CompletionShell } from "./schema.js";
import { renderBashCompletion } from "./render-bash.js";
import { renderPowerShellCompletion } from "./render-powershell.js";
import { renderZshCompletion } from "./render-zsh.js";

const LOOPLY_COMPLETION_START = "# looply completion start";
const LOOPLY_COMPLETION_END = "# looply completion end";

export interface ShellCompletionInstallResult {
  shell: CompletionShell;
  completionFile: string;
  rcFile: string;
  changedRcFile: boolean;
}

export function detectSupportedShell(value?: string | null): CompletionShell | null {
  const candidate = value ?? process.env.SHELL ?? process.env.ComSpec ?? "";
  const normalized = path.basename(candidate).toLowerCase();
  if (normalized === "zsh") {
    return "zsh";
  }
  if (normalized === "bash") {
    return "bash";
  }
  if (normalized === "pwsh" || normalized === "pwsh.exe" || normalized === "powershell" || normalized === "powershell.exe") {
    return "powershell";
  }
  if (!value && process.env.PSModulePath) {
    return "powershell";
  }
  return null;
}

export function renderInstallInstructions(shell: CompletionShell): string {
  const targets = resolveShellTargets(shell);
  switch (shell) {
    case "bash":
      return [
        "Install bash completion:",
        `  mkdir -p ${targets.completionDirectory}`,
        `  looply completion bash > ${targets.completionFile}`,
        `  source ${targets.rcFile}`
      ].join("\n");
    case "zsh":
      return [
        "Install zsh completion:",
        `  mkdir -p ${targets.completionDirectory}`,
        `  looply completion zsh > ${targets.completionFile}`,
        `  source ${targets.rcFile}`
      ].join("\n");
    case "powershell":
      return [
        "Install PowerShell completion:",
        `  New-Item -ItemType Directory -Force -Path '${targets.completionDirectory}' | Out-Null`,
        `  looply completion powershell > '${targets.completionFile}'`,
        `. '${targets.rcFile}'`
      ].join("\n");
  }
}

export async function installShellCompletion(shell: CompletionShell): Promise<ShellCompletionInstallResult> {
  const targets = resolveShellTargets(shell);
  const completionScript = renderCompletionScript(shell);
  await fs.ensureDir(targets.completionDirectory);
  await fs.writeFile(targets.completionFile, completionScript, "utf8");

  const existingRc = await fs.pathExists(targets.rcFile)
    ? await fs.readFile(targets.rcFile, "utf8")
    : "";
  const nextRc = upsertLooplyCompletionBlock(existingRc, renderRcBlock(shell));
  const changedRcFile = nextRc !== existingRc;
  if (changedRcFile) {
    await fs.ensureFile(targets.rcFile);
    await fs.writeFile(targets.rcFile, nextRc, "utf8");
  }

  return {
    shell,
    completionFile: targets.completionFile,
    rcFile: targets.rcFile,
    changedRcFile
  };
}

export function resolveShellTargets(shell: CompletionShell): {
  completionDirectory: string;
  completionFile: string;
  rcFile: string;
} {
  const home = process.env.HOME || os.homedir();
  const documentsRoot = process.env.USERPROFILE
    ? path.join(process.env.USERPROFILE, "Documents")
    : path.join(home, "Documents");
  switch (shell) {
    case "bash":
      return {
        completionDirectory: path.join(home, ".local", "share", "bash-completion", "completions"),
        completionFile: path.join(home, ".local", "share", "bash-completion", "completions", "looply"),
        rcFile: path.join(home, ".bashrc")
      };
    case "zsh":
      return {
        completionDirectory: path.join(home, ".zsh", "completions"),
        completionFile: path.join(home, ".zsh", "completions", "_looply"),
        rcFile: path.join(home, ".zshrc")
      };
    case "powershell":
      return {
        completionDirectory: path.join(documentsRoot, "PowerShell", "Completions"),
        completionFile: path.join(documentsRoot, "PowerShell", "Completions", "looply.ps1"),
        rcFile: path.join(documentsRoot, "PowerShell", "Microsoft.PowerShell_profile.ps1")
      };
  }
}

function renderCompletionScript(shell: CompletionShell): string {
  switch (shell) {
    case "bash":
      return renderBashCompletion();
    case "zsh":
      return renderZshCompletion();
    case "powershell":
      return renderPowerShellCompletion();
  }
}

function renderRcBlock(shell: CompletionShell): string {
  switch (shell) {
    case "bash":
      return [
        LOOPLY_COMPLETION_START,
        'if [[ -f "$HOME/.local/share/bash-completion/completions/looply" ]]; then',
        '  source "$HOME/.local/share/bash-completion/completions/looply"',
        "fi",
        LOOPLY_COMPLETION_END
      ].join("\n");
    case "zsh":
      return [
        LOOPLY_COMPLETION_START,
        'fpath=("$HOME/.zsh/completions" $fpath)',
        'autoload -Uz compinit',
        'if ! (( ${+_comps} )); then',
        "  compinit",
        "fi",
        LOOPLY_COMPLETION_END
      ].join("\n");
    case "powershell":
      return [
        LOOPLY_COMPLETION_START,
        'if (Test-Path "$HOME/Documents/PowerShell/Completions/looply.ps1") {',
        '  . "$HOME/Documents/PowerShell/Completions/looply.ps1"',
        "}",
        LOOPLY_COMPLETION_END
      ].join("\n");
  }
}

function upsertLooplyCompletionBlock(source: string, block: string): string {
  const trimmed = source.trimEnd();
  const pattern = new RegExp(`${escapeForRegex(LOOPLY_COMPLETION_START)}[\\s\\S]*?${escapeForRegex(LOOPLY_COMPLETION_END)}\\n?`, "m");
  if (pattern.test(source)) {
    return `${source.replace(pattern, `${block}\n`).trimEnd()}\n`;
  }
  if (trimmed === "") {
    return `${block}\n`;
  }
  return `${trimmed}\n\n${block}\n`;
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
