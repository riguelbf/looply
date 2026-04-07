import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { buildProgram } from "../src/program.js";
import { writeExamplePolicyFile } from "../src/lib/example-policy.js";
import { buildProjectSnapshot } from "../src/lib/project-snapshot.js";
import { resolveHostPublisher } from "../src/hosts/index.js";

const temporaryRoots: string[] = [];
const originalCwd = process.cwd();

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
});

describe("icl example guidance", () => {
  it("sets and reports project-level icl policy through the CLI", async () => {
    const targetRoot = await createTargetRoot("looply-icl-policy-");
    process.chdir(targetRoot);

    await buildProgram().parseAsync(["node", "looply", "icl", "set", "off", "--dir", targetRoot]);

    const output = await captureConsole(async () => {
      await buildProgram().parseAsync(["node", "looply", "icl", "status", "--dir", targetRoot, "--json"]);
    });
    const parsed = JSON.parse(output);

    assert.equal(parsed.effectiveMode, "off");
    assert.equal(parsed.modeSource, "project");
    assert.equal(parsed.projectPolicy.mode, "off");
  });

  it("publishes selected examples according to on, reduced and off modes", async () => {
    const sourceRoot = path.resolve(".");

    const onRoot = await createTargetRoot("looply-icl-on-");
    const onFiles = await installForMode(sourceRoot, onRoot);
    assert.equal(onFiles.index.effectiveMode, "on");
    assert.ok(onFiles.workflowStatus.selectedExamples.length >= 1);
    assert.match(onFiles.commandSource, /ICL mode: `on`/);
    assert.match(onFiles.commandSource, /Selected examples:/);

    const reducedRoot = await createTargetRoot("looply-icl-reduced-");
    await writeExamplePolicyFile(reducedRoot, "reduced");
    const reducedFiles = await installForMode(sourceRoot, reducedRoot);
    assert.equal(reducedFiles.index.effectiveMode, "reduced");
    assert.ok(reducedFiles.workflowStatus.selectedExamples.length <= 1);
    assert.match(reducedFiles.commandSource, /ICL mode: `reduced`/);

    const offRoot = await createTargetRoot("looply-icl-off-");
    await writeExamplePolicyFile(offRoot, "off");
    const offFiles = await installForMode(sourceRoot, offRoot);
    assert.equal(offFiles.index.effectiveMode, "off");
    assert.equal(offFiles.workflowStatus.selectedExamples.length, 0);
    assert.match(offFiles.commandSource, /Example guidance is disabled for this project/);
  });

  it("surfaces icl mode and counts in the project snapshot", async () => {
    const sourceRoot = path.resolve(".");
    const targetRoot = await createTargetRoot("looply-icl-snapshot-");
    await writeExamplePolicyFile(targetRoot, "reduced");
    await installForMode(sourceRoot, targetRoot);

    const snapshot = await buildProjectSnapshot(targetRoot);

    assert.equal(snapshot.icl.effectiveMode, "reduced");
    assert.equal(snapshot.icl.modeSource, "project");
    assert.ok(snapshot.icl.availableExampleCount >= 5);
    assert.ok(snapshot.icl.selectedExampleCount >= 1);
  });
});

async function installForMode(sourceRoot: string, targetRoot: string) {
  const publisher = resolveHostPublisher("codex");
  await publisher.install({
    host: "codex",
    scope: "project",
    pack: "software-delivery-suite",
    locale: "en",
    projectMode: "existing-project",
    interactionMode: "balanced",
    sourceRoot,
    currentWorkingDirectory: targetRoot
  });

  const index = await fs.readJson(path.join(targetRoot, ".looply", "state", "example-index.json"));
  const hints = await fs.readJson(path.join(targetRoot, ".looply", "state", "example-hints.codex.json"));
  const commandSource = await fs.readFile(
    path.join(targetRoot, ".looply", "state", "commands", "codex", "looply:workflow-status.md"),
    "utf8"
  );

  return {
    index,
    hints,
    workflowStatus: hints.commands.find((command: { alias: string }) => command.alias === "looply:workflow-status"),
    commandSource
  };
}

async function createTargetRoot(prefix: string): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  temporaryRoots.push(root);
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
