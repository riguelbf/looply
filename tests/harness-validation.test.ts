import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { resolveHostPublisher } from "../src/hosts/index.js";
import {
  resolveHarnessReportFile,
  runHarnessValidation,
  writeHarnessReport
} from "../src/lib/harness-validation.js";
import { writeContextSnapshot } from "../src/lib/context-snapshot.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) {
      await fs.remove(root);
    }
  }
});

async function installGreenfieldClaude(sourceRoot: string): Promise<string> {
  const targetRoot = await fs.mkdtemp(path.join(os.tmpdir(), "looply-harness-"));
  temporaryRoots.push(targetRoot);

  const publisher = resolveHostPublisher("claude");
  await publisher.install({
    host: "claude",
    scope: "project",
    pack: "software-delivery-suite",
    locale: "en",
    projectMode: "greenfield",
    interactionMode: "balanced",
    sourceRoot,
    currentWorkingDirectory: targetRoot
  });

  return targetRoot;
}

describe("harness validation", () => {
  it("flags greenfield low coverage and writes a report consumable by the host", async () => {
    const sourceRoot = path.resolve(".");
    const targetRoot = await installGreenfieldClaude(sourceRoot);

    await writeContextSnapshot({
      targetRoot,
      primaryContextRoot: targetRoot,
      projectMode: "greenfield",
      outputLocale: "en",
      interactionMode: "balanced",
      inferencePolicy: "artifact-first-with-explicit-assumptions",
      data: {
        status: "draft",
        coverage: "low",
        lastValidatedAt: new Date().toISOString(),
        repositorySummary: [],
        languages: [],
        frameworks: [],
        keyDirectories: [],
        moduleHints: [],
        integrationHints: [],
        apiSignals: [],
        dataSignals: [],
        authSignals: [],
        messagingSignals: [],
        observabilitySignals: [],
        workspaceHints: [],
        testingSignals: [],
        infrastructureSignals: [],
        automationSignals: [],
        architectureNotes: [],
        domainNotes: [],
        riskNotes: []
      }
    });

    const report = await runHarnessValidation({ targetRoot, sourceRoot, host: "claude" });

    const greenfieldFinding = report.findings.find((finding) => finding.check === "greenfield-coverage");
    assert.ok(greenfieldFinding, "expected greenfield-coverage finding");
    assert.equal(greenfieldFinding?.severity, "warn");

    const reportFile = await writeHarnessReport(report);
    assert.equal(reportFile, resolveHarnessReportFile(targetRoot));

    const reportContent = await fs.readFile(reportFile, "utf8");
    assert.match(reportContent, /schema: looply\/harness-report@v1/);
    assert.match(reportContent, /greenfield-coverage/);
    assert.match(reportContent, /How The Host Should Use This/);

    const contextIndex = await fs.readFile(
      path.join(targetRoot, ".looply", "state", "context-index.md"),
      "utf8"
    );
    assert.match(contextIndex, /harness-report\.md/);
  });

  it("flags token-budget as blocking when harness exceeds the smallest declared budget", async () => {
    const sourceRoot = path.resolve(".");
    const targetRoot = await installGreenfieldClaude(sourceRoot);

    const bloatedHints = {
      version: 1,
      host: "claude",
      pack: "software-delivery-suite",
      note: "test",
      artifacts: [
        {
          type: "task",
          name: "tiny-task",
          execution: { context_budget: "small" }
        }
      ]
    };

    await fs.writeJson(
      path.join(targetRoot, ".looply", "state", "execution-hints.claude.json"),
      bloatedHints,
      { spaces: 2 }
    );

    const projectContextFile = path.join(targetRoot, ".looply", "custom", "project-context.md");
    await fs.ensureDir(path.dirname(projectContextFile));
    await fs.writeFile(projectContextFile, "x".repeat(20_000), "utf8");

    const report = await runHarnessValidation({ targetRoot, sourceRoot, host: "claude" });

    const budgetFinding = report.findings.find((finding) => finding.check === "token-budget");
    assert.ok(budgetFinding, "expected token-budget finding");
    assert.equal(budgetFinding?.severity, "error");
    assert.equal(report.ok, false);
    assert.equal(report.metrics.budgetHint, "small");
  });

  it("fails when the target is not installed", async () => {
    const sourceRoot = path.resolve(".");
    const targetRoot = await fs.mkdtemp(path.join(os.tmpdir(), "looply-harness-no-install-"));
    temporaryRoots.push(targetRoot);

    await assert.rejects(
      () => runHarnessValidation({ targetRoot, sourceRoot, host: "claude" }),
      /No install manifest found/
    );
  });
});
