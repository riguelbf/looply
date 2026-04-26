import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { deriveAutonomyCycle, writeAutonomyCycle } from "../src/lib/autonomy.js";
import type { ProjectSnapshotDocument } from "../src/lib/project-snapshot.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) {
      await fs.remove(root);
    }
  }
});

describe("autonomy cycle", () => {
  it("reconciles a manually intervened feature before continuing", async () => {
    const snapshot = buildSnapshot({
      feature: {
        feature: "pix-webhook-retry",
        workflow: "story-to-production",
        phase: "delivery",
        currentStage: "implementation",
        currentGate: "release-ready",
        gateStatus: "pending",
        activeArtifact: "implementation-summary",
        selectedStory: "story-01-retry-automatico",
        readyForNextGate: "no",
        recommendedNextWorkflow: "workflow-status",
        host: "codex",
        nextAgent: "reviewer",
        nextTask: "review-code",
        nextCommand: "looply reconcile pix-webhook-retry",
        nextHandoff: "reviewer <- backend",
        projectMode: "existing-project",
        primaryContextRoot: "/tmp/looply",
        inferencePolicy: "codebase-first-with-artifact-acceleration",
        contextStatus: "active",
        contextCoverage: "high",
        blockedBy: ["manual-agent intervention recorded"],
        missingOutputs: ["review-report"],
        completedOutputs: ["tech-spec", "adr", "implementation-summary"],
        storyAcceptanceCriteria: [],
        relatedIntegrations: [],
        openQuestions: [],
        constraints: [],
        decisionRationale: "Manual intervention must be reconciled before continuing.",
        lastUpdated: "2026-04-07T12:00:00.000Z",
        executionMode: "manual-agent",
        replayedFrom: "",
        supersededOutputs: [],
        recommendedRecoveryCommand: "looply reconcile pix-webhook-retry",
        recommendedRecoveryWorkflow: "story-to-production",
        interventionCount: 1,
        lastInterventionAt: "2026-04-07T12:10:00.000Z",
        lastInterventionSummary: "Manual agent intervention",
        interventions: [],
        relevantFiles: [],
        relevantModules: [],
        relevantSymbols: [],
        relatedTests: [],
        file: "/tmp/looply/.looply/custom/features/pix-webhook-retry/workflow-status.md"
      }
    });

    const cycle = deriveAutonomyCycle({
      snapshot,
      featureName: "pix-webhook-retry",
      host: "codex"
    });

    assert.equal(cycle.actionType, "reconcile");
    assert.equal(cycle.approvalRequired, false);
    assert.equal(cycle.nextCommand, "looply reconcile pix-webhook-retry");
    assert.match(cycle.reason, /manual-agent mode/);
  });

  it("writes the autonomy decision file for the host to consume", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "looply-autonomy-"));
    temporaryRoots.push(root);

    const snapshot = buildSnapshot({
      targetRoot: root,
      feature: {
        feature: "cli-autocomplete",
        workflow: "story-to-production",
        phase: "delivery",
        currentStage: "technical-review",
        currentGate: "implementation-reviewed",
        gateStatus: "pending",
        activeArtifact: "implementation-summary",
        selectedStory: "story-02-bash-static-completion",
        readyForNextGate: "yes",
        recommendedNextWorkflow: "workflow-status",
        host: "claude",
        nextAgent: "reviewer",
        nextTask: "review-code",
        nextCommand: "looply run-task cli-autocomplete review-code",
        nextHandoff: "reviewer <- backend",
        projectMode: "existing-project",
        primaryContextRoot: root,
        inferencePolicy: "codebase-first-with-artifact-acceleration",
        contextStatus: "active",
        contextCoverage: "high",
        blockedBy: [],
        missingOutputs: ["review-report"],
        completedOutputs: ["tech-spec", "adr", "implementation-summary"],
        storyAcceptanceCriteria: [],
        relatedIntegrations: [],
        openQuestions: [],
        constraints: [],
        decisionRationale: "Implementation is ready for review.",
        lastUpdated: "2026-04-07T12:00:00.000Z",
        executionMode: "workflow",
        replayedFrom: "",
        supersededOutputs: [],
        recommendedRecoveryCommand: "",
        recommendedRecoveryWorkflow: "story-to-production",
        interventionCount: 0,
        lastInterventionAt: "",
        lastInterventionSummary: "",
        interventions: [],
        relevantFiles: [],
        relevantModules: [],
        relevantSymbols: [],
        relatedTests: [],
        file: path.join(root, ".looply", "custom", "features", "cli-autocomplete", "workflow-status.md")
      }
    });

    const cycle = deriveAutonomyCycle({
      snapshot,
      featureName: "cli-autocomplete",
      host: "claude"
    });
    const file = await writeAutonomyCycle(root, cycle);
    const saved = await fs.readJson(file);

    assert.equal(saved.feature, "cli-autocomplete");
    assert.equal(saved.actionType, "run-task");
    assert.equal(saved.approvalRequired, true);
    assert.equal(saved.nextCommand, "looply run-task cli-autocomplete review-code");
    assert.equal(file, path.join(root, ".looply", "state", "autonomy", "cli-autocomplete.json"));
  });
});

function buildSnapshot(input: {
  targetRoot?: string;
  feature: Record<string, unknown>;
}): ProjectSnapshotDocument {
  const targetRoot = input.targetRoot ?? "/tmp/looply";
  return {
    version: 4,
    generatedAt: "2026-04-07T12:00:00.000Z",
    targetRoot,
    summary: {
      installCount: 1,
      featureCount: 1,
      blockedFeatureCount: 0,
      readyFeatureCount: 0,
      interventionCount: 0,
      replayedFeatureCount: 0,
      sessionCount: 0,
      historyCount: 0
    },
    project: {
      installed: true,
      locale: "pt-BR",
      projectMode: "existing-project",
      interactionMode: "balanced",
      primaryContextRoot: targetRoot,
      inferencePolicy: "codebase-first-with-artifact-acceleration"
    },
    installation: {
      installs: [
        {
          host: "codex",
          scope: "project",
          pack: "engineering-base",
          managedFiles: 1,
          mergeableFiles: 1,
          customFiles: 0
        }
      ]
    },
    hosts: [
      {
        host: "codex",
        scope: "project",
        pack: "engineering-base",
        workflowCount: 1,
        aliases: ["looply:workflow-status"]
      }
    ],
    context: {
      snapshotFile: path.join(targetRoot, ".looply", "state", "context-snapshot.json"),
      indexFile: path.join(targetRoot, ".looply", "state", "context-index.md"),
      projectContextFile: path.join(targetRoot, ".looply", "custom", "project-context.md"),
      architectureContextFile: path.join(targetRoot, ".looply", "custom", "architecture-context.md"),
      projectInventoryFile: path.join(targetRoot, ".looply", "state", "project-inventory.md"),
      snapshot: {
        version: 1,
        generatedAt: "2026-04-07T12:00:00.000Z",
        targetRoot,
        primaryContextRoot: targetRoot,
        projectMode: "existing-project",
        outputLocale: "pt-BR",
        interactionMode: "balanced",
        inferencePolicy: "codebase-first-with-artifact-acceleration",
        contextStatus: "active",
        contextCoverage: "high",
        lastValidatedAt: "2026-04-07T12:00:00.000Z",
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
    },
    codeContext: {
      file: path.join(targetRoot, ".looply", "state", "code-context.json"),
      snapshot: {
        version: 1,
        generatedAt: "2026-04-07T12:00:00.000Z",
        targetRoot,
        primaryContextRoot: targetRoot,
        projectMode: "existing-project",
        inferencePolicy: "codebase-first-with-artifact-acceleration",
        coverage: "semantic",
        providers: [],
        workspaceRoots: [],
        modules: [],
        symbols: [],
        relations: [],
        entrypoints: [],
        relatedTests: [],
        diagnostics: [],
        notes: []
      }
    },
    icl: {
      effectiveMode: "on",
      modeSource: "default",
      policyFile: path.join(targetRoot, ".looply", "state", "example-policy.json"),
      globalPolicyFile: path.join(os.homedir(), ".looply", "state", "example-policy.json"),
      indexFile: path.join(targetRoot, ".looply", "state", "example-index.json"),
      availableExampleCount: 0,
      selectedExampleCount: 0
    },
    sessions: [],
    features: [input.feature as ProjectSnapshotDocument["features"][number]],
    history: []
  };
}
