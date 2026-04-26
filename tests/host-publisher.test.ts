import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { resolveHostPublisher } from "../src/hosts/index.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) {
      await fs.remove(root);
    }
  }
});

describe("host publisher", () => {
  it("publishes claude project files with workflow commands, icl hints and perf hooks", async () => {
    const sourceRoot = path.resolve(".");
    const targetRoot = await fs.mkdtemp(path.join(os.tmpdir(), "looply-claude-publisher-"));
    temporaryRoots.push(targetRoot);

    const publisher = resolveHostPublisher("claude");
    const result = await publisher.install({
      host: "claude",
      scope: "project",
      pack: "software-delivery-suite",
      locale: "en",
      projectMode: "existing-project",
      interactionMode: "balanced",
      sourceRoot,
      currentWorkingDirectory: targetRoot
    });

    const entrypoint = await fs.readFile(result.entrypointFile, "utf8");
    const ideaCommand = await fs.readFile(path.join(targetRoot, ".claude", "commands", "looply:idea-to-prd.md"), "utf8");
    const helpCommand = await fs.readFile(path.join(targetRoot, ".claude", "commands", "looply:help.md"), "utf8");
    const hookGuide = await fs.readFile(path.join(targetRoot, ".claude", "LOOPLY_HOOKS.md"), "utf8");
    const hookScript = await fs.readFile(path.join(targetRoot, ".claude", "hooks", "looply-perf-hook.mjs"), "utf8");
    const hostContract = await fs.readFile(path.join(targetRoot, "HOST_CONTRACT.md"), "utf8");
    const exampleIndex = await fs.readJson(path.join(targetRoot, ".looply", "state", "example-index.json"));
    const exampleHints = await fs.readJson(path.join(targetRoot, ".looply", "state", "example-hints.claude.json"));

    assert.match(entrypoint, /ICL example guidance: `on`/);
    assert.match(entrypoint, /HOST_CONTRACT\.md/);
    assert.match(entrypoint, /\.looply\/state\/example-index\.json/);
    assert.match(entrypoint, /\.claude\/LOOPLY_HOOKS\.md/);
    assert.match(ideaCommand, /Example hints:/);
    assert.match(ideaCommand, /Curated example guidance:/);
    assert.match(helpCommand, /Available commands:/);
    assert.match(hookGuide, /looply-perf-hook\.mjs/);
    assert.match(hookScript, /user-prompt-submit/);
    assert.match(hostContract, /looply autonomy <feature>/);
    assert.match(hostContract, /host-status-contract\.json/);
    assert.equal(exampleIndex.effectiveMode, "on");
    assert.ok(Array.isArray(exampleHints.commands));
    assert.ok(exampleHints.commands.some((command: { alias: string }) => command.alias === "looply:idea-to-prd"));
  });
});
