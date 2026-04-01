import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { buildProgram } from "../src/program.js";
import { detectSupportedShell, installShellCompletion, resolveShellTargets } from "../src/lib/cli-completion/install.js";
import { introspectCompletionTree } from "../src/lib/cli-completion/introspect.js";
import { renderBashCompletion } from "../src/lib/cli-completion/render-bash.js";
import { renderPowerShellCompletion } from "../src/lib/cli-completion/render-powershell.js";
import { renderZshCompletion } from "../src/lib/cli-completion/render-zsh.js";
import {
  resolveCommandForTokens,
  resolveCompletionSuggestions,
  resolvePendingOption
} from "../src/lib/cli-completion/runtime.js";

const temporaryRoots: string[] = [];
const originalCwd = process.cwd();
const originalHome = process.env.HOME;
const originalUserProfile = process.env.USERPROFILE;

beforeEach(() => {
  process.chdir(originalCwd);
});

afterEach(async () => {
  process.chdir(originalCwd);
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) {
      await fs.remove(root);
    }
  }
  process.env.HOME = originalHome;
  process.env.USERPROFILE = originalUserProfile;
});

describe("cli completion", () => {
  it("introspects the Commander tree without exposing hidden internal commands", () => {
    const tree = introspectCompletionTree(buildProgram());

    assert.equal(tree.name, "looply");
    assert.ok(tree.subcommands.some((command) => command.name === "completion"));
    assert.ok(tree.subcommands.some((command) => command.name === "sessions"));
    assert.ok(tree.subcommands.some((command) => command.name === "integrations"));
    assert.ok(!tree.subcommands.some((command) => command.name === "__complete"));

    const completion = tree.subcommands.find((command) => command.name === "completion");
    assert.ok(completion);
    assert.ok(completion.subcommands.some((command) => command.name === "install"));
  });

  it("renders bash, zsh and powershell completion scripts that delegate to the runtime", () => {
    const tree = introspectCompletionTree(buildProgram());

    const bash = renderBashCompletion();
    const zsh = renderZshCompletion();
    const powershell = renderPowerShellCompletion();

    assert.match(bash, /complete -F _looply_completion looply/);
    assert.match(bash, /looply __complete --shell bash/);
    assert.match(zsh, /compdef _looply_completion looply/);
    assert.match(zsh, /looply __complete --shell zsh/);
    assert.match(powershell, /Register-ArgumentCompleter -Native -CommandName looply/);
    assert.match(powershell, /looply __complete --shell powershell/);
  });

  it("installs shell completion idempotently into shell rc files", async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), "looply-home-"));
    temporaryRoots.push(home);
    process.env.HOME = home;

    const first = await installShellCompletion("zsh");
    const second = await installShellCompletion("zsh");

    assert.equal(first.shell, "zsh");
    assert.equal(second.changedRcFile, false);

    const rcSource = await fs.readFile(first.rcFile, "utf8");
    assert.match(rcSource, /# looply completion start/);
    assert.match(rcSource, /fpath=\("\$HOME\/\.zsh\/completions" \$fpath\)/);

    const completionSource = await fs.readFile(first.completionFile, "utf8");
    assert.match(completionSource, /#compdef looply/);

    const targets = resolveShellTargets("zsh");
    assert.equal(first.completionFile, targets.completionFile);
  });

  it("detects and installs powershell completion", async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), "looply-home-powershell-"));
    temporaryRoots.push(home);
    process.env.HOME = home;
    process.env.USERPROFILE = home;

    assert.equal(detectSupportedShell("powershell.exe"), "powershell");
    assert.equal(detectSupportedShell("pwsh"), "powershell");

    const result = await installShellCompletion("powershell");
    const profileSource = await fs.readFile(result.rcFile, "utf8");
    const completionSource = await fs.readFile(result.completionFile, "utf8");

    assert.match(profileSource, /looply completion start/);
    assert.match(profileSource, /Documents\/PowerShell\/Completions\/looply\.ps1/);
    assert.match(completionSource, /Register-ArgumentCompleter -Native -CommandName looply/);
  });

  it("resolves dynamic suggestions for features and option values", async () => {
    const targetRoot = await createCompletionTargetRoot();
    const tree = introspectCompletionTree(buildProgram());

    const featureSuggestions = await resolveCompletionSuggestions({
      tree,
      tokens: ["run-task"],
      currentWord: "pix",
      targetRoot
    });

    assert.deepEqual(featureSuggestions.map((item) => item.value), ["pix-webhook-retry"]);

    const installCommand = resolveCommandForTokens(tree, ["install"]);
    const pendingHost = resolvePendingOption(installCommand, ["--host"]);
    assert.ok(pendingHost);

    const hostSuggestions = await resolveCompletionSuggestions({
      tree,
      tokens: ["install"],
      currentWord: "c",
      targetRoot,
      pendingOption: pendingHost
    });

    assert.deepEqual(hostSuggestions.map((item) => item.value), ["claude", "codex"]);

    const completionCommand = resolveCommandForTokens(tree, ["completion"]);
    const pendingShell = resolvePendingOption(completionCommand, ["--shell"]);
    assert.ok(pendingShell);

    const shellSuggestions = await resolveCompletionSuggestions({
      tree,
      tokens: ["completion"],
      currentWord: "z",
      targetRoot,
      pendingOption: pendingShell
    });

    assert.deepEqual(shellSuggestions.map((item) => item.value), ["zsh"]);
  });

  it("prints completion scripts, install guidance and runtime suggestions through the CLI", async () => {
    const targetRoot = await createCompletionTargetRoot();

    process.chdir(targetRoot);
    const bashOutput = await captureConsole(async () => {
      await buildProgram().parseAsync(["node", "looply", "completion", "bash"]);
    });
    assert.match(bashOutput, /bash completion for looply/);

    const installOutput = await captureConsole(async () => {
      await buildProgram().parseAsync(["node", "looply", "completion", "install", "zsh"]);
    });
    assert.match(installOutput, /Install zsh completion:/);
    assert.match(installOutput, /looply completion zsh >/);

    const home = await fs.mkdtemp(path.join(os.tmpdir(), "looply-home-enable-"));
    temporaryRoots.push(home);
    process.env.HOME = home;

    const enableOutput = await captureConsole(async () => {
      await buildProgram().parseAsync(["node", "looply", "completion", "install", "zsh", "--enable"]);
    });
    assert.match(enableOutput, /Enabled zsh completion\./);
    assert.match(enableOutput, /shell rc file:/);

    const runtimeOutput = await captureConsole(async () => {
      await buildProgram().parseAsync(["node", "looply", "__complete", "--shell", "bash", "--index", "2", "--", "run-task", "pix"]);
    });
    assert.match(runtimeOutput, /pix-webhook-retry/);

    const powershellOutput = await captureConsole(async () => {
      await buildProgram().parseAsync(["node", "looply", "completion", "powershell"]);
    });
    assert.match(powershellOutput, /Register-ArgumentCompleter -Native -CommandName looply/);
  });
});

async function createCompletionTargetRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "looply-cli-completion-"));
  temporaryRoots.push(root);

  await fs.ensureDir(path.join(root, ".looply", "custom", "features", "pix-webhook-retry"));
  await fs.writeFile(
    path.join(root, ".looply", "custom", "features", "pix-webhook-retry", "workflow-status.md"),
    "# workflow-status\n",
    "utf8"
  );

  await fs.ensureDir(path.join(root, ".looply", "custom", "integrations"));
  await fs.writeFile(
    path.join(root, ".looply", "custom", "integrations", "stripe.md"),
    "# stripe\n",
    "utf8"
  );

  return root;
}

async function captureConsole(callback: () => Promise<void>): Promise<string> {
  const originalLog = console.log;
  const lines: string[] = [];

  console.log = (...args: unknown[]) => {
    lines.push(args.map((value) => String(value)).join(" "));
  };

  try {
    await callback();
  } finally {
    console.log = originalLog;
  }

  return lines.join("\n");
}
