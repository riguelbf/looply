import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { readFeatureWorkflowStates } from "../src/lib/feature-workflow-state.js";
import { buildProjectSnapshot } from "../src/lib/project-snapshot.js";
import {
  reconcileFeatureWorkflowControl,
  registerAgentIntervention,
  registerReplayIntervention,
  registerTaskIntervention
} from "../src/lib/workflow-interventions.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) {
      await fs.remove(root);
    }
  }
});

describe("workflow interventions", () => {
  it("registers replay from an artifact and supersedes downstream outputs", async () => {
    const targetRoot = await createTargetRoot();

    const result = await registerReplayIntervention({
      targetRoot,
      feature: "pix-webhook-retry",
      from: "tech-spec",
      reason: "Refine delivery design after queue decision",
      notes: []
    });

    assert.equal(result.document.executionMode, "replay");
    assert.equal(result.document.replayedFrom, "tech-spec");
    assert.deepEqual(result.document.supersededOutputs, [
      "adr",
      "implementation-summary",
      "review-report",
      "release-plan",
      "operability-report"
    ]);
    assert.match(result.document.recommendedRecoveryCommand, /workflow-status/);

    const states = await readFeatureWorkflowStates(targetRoot);
    assert.equal(states.length, 1);
    assert.equal(states[0]?.executionMode, "replay");
    assert.deepEqual(states[0]?.supersededOutputs, [
      "adr",
      "implementation-summary",
      "review-report",
      "release-plan",
      "operability-report"
    ]);
  });

  it("tracks manual task and agent interventions and exposes them in snapshot state", async () => {
    const targetRoot = await createTargetRoot();

    await registerTaskIntervention({
      targetRoot,
      feature: "pix-webhook-retry",
      task: "review-code",
      reason: "User wants an early technical review",
      notes: ["run before normal gate"]
    });

    await registerAgentIntervention({
      targetRoot,
      feature: "pix-webhook-retry",
      agent: "architect",
      task: "create-tech-spec",
      reason: "Adjust design to include async retry queue",
      notes: ["add queue notes"]
    });

    const states = await readFeatureWorkflowStates(targetRoot);
    assert.equal(states.length, 1);
    assert.equal(states[0]?.executionMode, "manual-agent");
    assert.equal(states[0]?.interventionCount, 2);
    assert.equal(states[0]?.lastInterventionSummary, "Manual agent architect -> create-tech-spec");

    const snapshot = await buildProjectSnapshot(targetRoot);
    assert.equal(snapshot.summary.interventionCount, 2);
    assert.equal(snapshot.features[0]?.interventionCount, 2);
    assert.equal(snapshot.features[0]?.executionMode, "manual-agent");
  });

  it("reconciles the feature back to workflow mode after interventions", async () => {
    const targetRoot = await createTargetRoot();

    await registerReplayIntervention({
      targetRoot,
      feature: "pix-webhook-retry",
      from: "technical-design",
      reason: "Need to revisit design stage",
      notes: []
    });

    const reconciled = await reconcileFeatureWorkflowControl(targetRoot, "pix-webhook-retry");
    assert.equal(reconciled.document.executionMode, "workflow");
    assert.ok(reconciled.document.lastReconciledAt);
    assert.equal(reconciled.document.interventions.at(-1)?.type, "reconcile");

    const states = await readFeatureWorkflowStates(targetRoot);
    assert.equal(states[0]?.executionMode, "workflow");
    assert.equal(states[0]?.replayedFrom, "technical-design");
    assert.equal(states[0]?.interventions.at(-1)?.type, "reconcile");
  });
});

async function createTargetRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "looply-workflow-intervention-"));
  temporaryRoots.push(root);

  const featureDirectory = path.join(root, ".looply", "custom", "features", "pix-webhook-retry");
  await fs.ensureDir(featureDirectory);
  await fs.writeFile(
    path.join(featureDirectory, "workflow-status.md"),
    [
      "# workflow-status",
      "",
      "## Feature",
      "",
      "pix-webhook-retry",
      "",
      "## Workflow",
      "",
      "story-to-production",
      "",
      "## Phase",
      "",
      "delivery",
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
      "## Ready For Next Gate",
      "",
      "no",
      "",
      "## Recommended Next Workflow",
      "",
      "workflow-status",
      "",
      "## Host",
      "",
      "codex",
      "",
      "## Next Agent",
      "",
      "reviewer",
      "",
      "## Next Task",
      "",
      "review-code",
      "",
      "## Next Command",
      "",
      "$looply-workflow-status pix-webhook-retry",
      "",
      "## Next Handoff",
      "",
      "reviewer <- backend",
      "",
      "## Project Mode",
      "",
      "existing-project",
      "",
      "## Primary Context Root",
      "",
      root,
      "",
      "## Inference Policy",
      "",
      "conservative",
      "",
      "## Context Status",
      "",
      "validated",
      "",
      "## Context Coverage",
      "",
      "high",
      "",
      "## Missing Outputs",
      "",
      "- review-report",
      "- release-plan",
      "",
      "## Completed Outputs",
      "",
      "- tech-spec",
      "- adr",
      "- implementation-summary",
      "",
      "## Decision Rationale",
      "",
      "Delivery paused until workflow status is reconciled.",
      "",
      "## Last Updated",
      "",
      "2026-03-27T12:00:00.000Z",
      ""
    ].join("\n"),
    "utf8"
  );

  await fs.ensureDir(path.join(root, ".looply", "custom"));
  await fs.writeJson(path.join(root, ".looply", "custom", "session-links.json"), {
    version: 1,
    sessions: []
  });

  await fs.ensureDir(path.join(root, ".looply", "state"));
  return root;
}
