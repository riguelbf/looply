import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { buildProgram } from "../src/program.js";
import { writeCodeContext } from "../src/lib/code-context/storage.js";
import type { CodeContextDocument } from "../src/lib/code-context/schema.js";
import { writeContextSnapshot } from "../src/lib/context-snapshot.js";
import { writeExamplePolicyFile } from "../src/lib/example-policy.js";
import { resolveHostPublisher } from "../src/hosts/index.js";
import { upsertSessionLink } from "../src/lib/session-links.js";
import { appendUpgradeHistory } from "../src/lib/upgrade-history.js";
import { validateWorkspace } from "../src/validation/validate-packs.js";

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

describe("status and validation", () => {
  it("validates the real workspace and rejects invalid examples", async () => {
    const sourceRoot = path.resolve(".");
    const validReport = await validateWorkspace(sourceRoot);
    assert.equal(validReport.ok, true);

    const invalidRoot = await fs.mkdtemp(path.join(os.tmpdir(), "looply-invalid-pack-"));
    temporaryRoots.push(invalidRoot);

    await fs.ensureDir(path.join(invalidRoot, "packs", "test-pack", "examples", "templates", "story-template"));
    await fs.writeFile(
      path.join(invalidRoot, "packs", "test-pack", "pack.md"),
      [
        "---",
        "schema: looply/pack@v1",
        "name: test-pack",
        "pack_version: 0.1.0",
        "domains: []",
        "includes:",
        "  packs: []",
        "  agents: []",
        "  tasks: []",
        "  workflows: []",
        "---",
        "",
        "# test-pack"
      ].join("\n"),
      "utf8"
    );
    await fs.writeFile(
      path.join(invalidRoot, "packs", "test-pack", "examples", "templates", "story-template", "bad-example.md"),
      [
        "---",
        "schema: looply/example@v1",
        "name: bad-example",
        "kind: template-example",
        "quality: strong",
        "applies_to:",
        "  workflows: []",
        "  tasks: []",
        "  templates: []",
        "  agents: []",
        "  handoffs: []",
        "host_support:",
        "  - codex",
        "---",
        "",
        "# bad-example"
      ].join("\n"),
      "utf8"
    );

    const invalidReport = await validateWorkspace(invalidRoot);
    assert.equal(invalidReport.ok, false);
    assert.match(
      invalidReport.errors.map((entry) => entry.message).join("\n"),
      /applies_to must target at least one workflow, task, template, agent or handoff/
    );
  });

  it("renders the empty status state for a repository without looply installation", async () => {
    const targetRoot = await fs.mkdtemp(path.join(os.tmpdir(), "looply-status-empty-"));
    temporaryRoots.push(targetRoot);
    process.chdir(targetRoot);

    const output = await captureConsole(async () => {
      await buildProgram().parseAsync(["node", "looply", "status", "--dir", targetRoot]);
    });

    assert.match(output, /LOOPLY STATUS/);
    assert.match(output, /No install manifest found|Nenhum install manifest encontrado/);
    assert.match(output, /looply install --host codex,claude --scope project --pack software-delivery-suite --project-mode existing-project/);
    assert.match(output, /No context snapshot found|Nenhum context snapshot encontrado/);
  });

  it("renders populated status output for an installed project with active feature state", async () => {
    const sourceRoot = path.resolve(".");
    const targetRoot = await fs.mkdtemp(path.join(os.tmpdir(), "looply-status-populated-"));
    temporaryRoots.push(targetRoot);

    const publisher = resolveHostPublisher("codex");
    await publisher.install({
      host: "codex",
      scope: "project",
      pack: "software-delivery-suite",
      locale: "pt-BR",
      projectMode: "existing-project",
      interactionMode: "balanced",
      sourceRoot,
      currentWorkingDirectory: targetRoot
    });

    await writeExamplePolicyFile(targetRoot, "reduced");
    await publisher.sync({
      host: "codex",
      scope: "project",
      sourceRoot,
      currentWorkingDirectory: targetRoot
    });

    await writeContextSnapshot({
      targetRoot,
      primaryContextRoot: targetRoot,
      projectMode: "existing-project",
      outputLocale: "pt-BR",
      interactionMode: "balanced",
      inferencePolicy: "codebase-first-with-artifact-acceleration",
      data: {
        status: "active",
        coverage: "high",
        lastValidatedAt: "2026-04-07T12:00:00.000Z",
        repositorySummary: ["Repository uses TypeScript and workflow artifacts."],
        languages: ["typescript"],
        frameworks: ["vite"],
        keyDirectories: ["src", "packs"],
        moduleHints: ["workflow-status", "cli"],
        integrationHints: ["github"],
        apiSignals: ["cli"],
        dataSignals: ["json"],
        authSignals: [],
        messagingSignals: [],
        observabilitySignals: ["perf"],
        workspaceHints: ["single-package"],
        testingSignals: ["node:test"],
        infrastructureSignals: [],
        automationSignals: ["npm scripts"],
        architectureNotes: ["CLI plus host publishing."],
        domainNotes: ["Workflow state is persisted per feature."],
        riskNotes: ["Validate live codebase before structural changes."]
      }
    });

    const codeContext: CodeContextDocument = {
      version: 1,
      generatedAt: "2026-04-07T12:00:00.000Z",
      targetRoot,
      primaryContextRoot: targetRoot,
      projectMode: "existing-project",
      inferencePolicy: "codebase-first-with-artifact-acceleration",
      coverage: "semantic",
      providers: [
        {
          id: "typescript",
          language: "typescript",
          executable: "tsserver",
          executableAvailable: true,
          status: "detected",
          detectedRootCount: 1,
          notes: []
        }
      ],
      workspaceRoots: [
        {
          id: "root",
          providerId: "typescript",
          language: "typescript",
          root: targetRoot,
          kind: "project",
          markers: ["package.json"],
          confidence: "high"
        }
      ],
      modules: [
        {
          id: "workflow-status",
          providerId: "typescript",
          language: "typescript",
          label: "workflow-status",
          root: targetRoot,
          files: ["src/commands/status.ts"],
          publicSymbols: ["registerStatusCommand"],
          dependsOnModules: [],
          dependedOnByModules: [],
          entryFiles: ["src/main.ts"],
          testFiles: ["tests/status-and-validation.test.ts"],
          confidence: "high"
        }
      ],
      symbols: [
        {
          providerId: "typescript",
          language: "typescript",
          name: "registerStatusCommand",
          kind: "function",
          file: "src/commands/status.ts",
          exported: true,
          references: 2
        }
      ],
      relations: [],
      entrypoints: [
        {
          providerId: "typescript",
          language: "typescript",
          file: "src/main.ts",
          symbols: ["buildProgram"]
        }
      ],
      relatedTests: [
        {
          providerId: "typescript",
          language: "typescript",
          source: "src/commands/status.ts",
          test: "tests/status-and-validation.test.ts"
        }
      ],
      diagnostics: [],
      notes: []
    };
    await writeCodeContext(targetRoot, codeContext);

    await upsertSessionLink(targetRoot, {
      label: "codex-main",
      feature: "pix-webhook-retry",
      workflow: "story-to-production",
      lastCommand: "$looply-workflow-status pix-webhook-retry"
    });

    await appendUpgradeHistory({
      targetRoot,
      entry: {
        timestamp: "2026-04-07T12:10:00.000Z",
        action: "sync",
        host: "codex",
        scope: "project",
        pack: "software-delivery-suite",
        targetRoot,
        summary: {
          addedFiles: [],
          changedFiles: ["LOOPLY_COMMANDS.md"],
          removedFiles: [],
          impacts: ["updated commands"],
          artifactChanges: ["workflow command references refreshed"]
        }
      }
    });

    const featureDir = path.join(targetRoot, ".looply", "custom", "features", "pix-webhook-retry");
    await fs.ensureDir(featureDir);
    await fs.writeFile(
      path.join(featureDir, "workflow-status.md"),
      [
        "---",
        "feature: pix-webhook-retry",
        "workflow: story-to-production",
        "phase: delivery",
        "currentStage: implementation",
        "currentGate: release-ready",
        "gateStatus: pending",
        "activeArtifact: implementation-summary",
        "selectedStory: story-01-retry-automatico",
        "readyForNextGate: no",
        "recommendedNextWorkflow: workflow-status",
        "nextAgent: reviewer",
        "nextTask: review-code",
        "nextCommand: \"looply run-task pix-webhook-retry review-code\"",
        "nextHandoff: \"backend -> reviewer after implementation-summary\"",
        "host: codex",
        "projectMode: existing-project",
        `primaryContextRoot: ${targetRoot}`,
        "inferencePolicy: codebase-first-with-artifact-acceleration",
        "contextStatus: active",
        "contextCoverage: high",
        "executionMode: workflow",
        "lastUpdated: \"2026-04-07T12:12:00.000Z\"",
        "---",
        "",
        "# Workflow Status",
        "",
        "## Feature",
        "",
        "pix-webhook-retry",
        "",
        "## Workflow",
        "",
        "story-to-production",
        "",
        "## Current Stage",
        "",
        "implementation",
        "",
        "## Current Gate",
        "",
        "release-ready",
        "",
        "## Gate Status",
        "",
        "pending",
        "",
        "## Active Artifact",
        "",
        "implementation-summary",
        "",
        "## Selected Story",
        "",
        "story-01-retry-automatico",
        "",
        "## Completed Outputs",
        "",
        "- tech-spec",
        "- adr",
        "- implementation-summary",
        "",
        "## Missing Outputs",
        "",
        "- review-report",
        "- release-plan",
        "",
        "## Decision Rationale",
        "",
        "Implementation is ready for review but the release gate is not approved yet.",
        "",
        "## Last Updated",
        "",
        "2026-04-07T12:12:00.000Z",
        ""
      ].join("\n"),
      "utf8"
    );

    process.chdir(targetRoot);
    const output = await captureConsole(async () => {
      await buildProgram().parseAsync(["node", "looply", "status", "--dir", targetRoot, "--features", "1", "--limit", "1"]);
    });

    assert.match(output, /Projeto/);
    assert.match(output, /ICL Guidance/);
    assert.match(output, /icl-mode: reduced/);
    assert.match(output, /pix-webhook-retry/);
    assert.match(output, /Handoff técnico/);
    assert.match(output, /review-report/);
    assert.match(output, /codex-main/);
    assert.match(output, /Snapshot/);
    assert.match(output, /project-snapshot\.json/);
  });
});

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
