import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { buildProgram } from "../src/program.js";
import { resolvePerfMode } from "../src/lib/perf/config.js";
import { appendPerfEvent, resolvePerfEventsFile } from "../src/lib/perf/storage.js";
import {
  readPerfWorkflowTraceEvents,
  resolvePerfWorkflowActiveFile,
  resolvePerfWorkflowTraceFile
} from "../src/lib/perf/trace.js";

const temporaryRoots: string[] = [];
const originalPerf = process.env.LOOPLY_PERF;

afterEach(async () => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) {
      await fs.remove(root);
    }
  }
  process.env.LOOPLY_PERF = originalPerf;
});

describe("perf profiling", () => {
  it("resolves perf mode from flag and environment", () => {
    process.env.LOOPLY_PERF = "context";
    assert.equal(resolvePerfMode(undefined), "context");
    assert.equal(resolvePerfMode(true), "basic");
    assert.equal(resolvePerfMode("basic"), "basic");
    assert.equal(resolvePerfMode("off"), "off");
  });

  it("prints perf summary from recorded events", async () => {
    const targetRoot = await fs.mkdtemp(path.join(os.tmpdir(), "looply-perf-"));
    temporaryRoots.push(targetRoot);

    await appendPerfEvent(targetRoot, {
      version: 1,
      command: "status",
      mode: "basic",
      targetRoot,
      startedAt: "2026-04-01T10:00:00.000Z",
      endedAt: "2026-04-01T10:00:01.000Z",
      durationMs: 1000,
      success: true,
      metadata: {
        featureCount: 3
      },
      spans: [
        {
          name: "project-snapshot.read-state",
          startedAt: "2026-04-01T10:00:00.100Z",
          endedAt: "2026-04-01T10:00:00.600Z",
          durationMs: 500
        }
      ]
    });

    const output = await captureConsole(async () => {
      await buildProgram().parseAsync(["node", "looply", "perf", "summary", "--dir", targetRoot, "--json"]);
    });

    const parsed = JSON.parse(output);
    assert.equal(parsed.commandCount, 1);
    assert.equal(parsed.slowestCommands[0].command, "status");
    assert.equal(parsed.slowestSpans[0].name, "project-snapshot.read-state");
    assert.equal(resolvePerfEventsFile(targetRoot), path.join(targetRoot, ".looply", "state", "perf-events.jsonl"));
  });

  it("handles empty perf and trace summaries gracefully", async () => {
    const targetRoot = await fs.mkdtemp(path.join(os.tmpdir(), "looply-perf-empty-"));
    temporaryRoots.push(targetRoot);

    const perfOutput = await captureConsole(async () => {
      await buildProgram().parseAsync(["node", "looply", "perf", "summary", "--dir", targetRoot]);
    });
    assert.equal(perfOutput, "");

    const traceOutput = await captureConsole(async () => {
      await buildProgram().parseAsync(["node", "looply", "perf", "trace", "summary", "--dir", targetRoot]);
    });
    assert.equal(traceOutput, "");
  });

  it("records workflow trace events through the CLI", async () => {
    const targetRoot = await fs.mkdtemp(path.join(os.tmpdir(), "looply-perf-trace-"));
    temporaryRoots.push(targetRoot);

    await buildProgram().parseAsync([
      "node",
      "looply",
      "perf",
      "trace",
      "start",
      "--dir",
      targetRoot,
      "--source",
      "manual",
      "--host",
      "claude",
      "--workflow",
      "idea-to-prd",
      "--alias",
      "looply:idea-to-prd",
      "--feature",
      "pix-webhook-retry"
    ]);

    await buildProgram().parseAsync([
      "node",
      "looply",
      "perf",
      "trace",
      "finish",
      "--dir",
      targetRoot,
      "--source",
      "manual",
      "--status",
      "completed"
    ]);

    const events = await readPerfWorkflowTraceEvents(targetRoot);
    assert.equal(events.length, 2);
    assert.equal(events[0].event, "start");
    assert.equal(events[0].feature, "pix-webhook-retry");
    assert.equal(events[1].event, "finish");
    assert.equal(resolvePerfWorkflowTraceFile(targetRoot), path.join(targetRoot, ".looply", "state", "perf-workflow-events.jsonl"));
  });

  it("records checkpoints, prints text trace summaries and clears the active trace file on finish", async () => {
    const targetRoot = await fs.mkdtemp(path.join(os.tmpdir(), "looply-perf-checkpoint-"));
    temporaryRoots.push(targetRoot);

    await buildProgram().parseAsync([
      "node",
      "looply",
      "perf",
      "trace",
      "start",
      "--dir",
      targetRoot,
      "--source",
      "manual",
      "--host",
      "codex",
      "--workflow",
      "story-to-production",
      "--alias",
      "looply:story-to-production",
      "--feature",
      "pix-webhook-retry",
      "--notes",
      "start trace"
    ]);

    const checkpointOutput = await captureConsole(async () => {
      await buildProgram().parseAsync([
        "node",
        "looply",
        "perf",
        "trace",
        "checkpoint",
        "--dir",
        targetRoot,
        "--source",
        "manual",
        "--stage",
        "implementation",
        "--task",
        "implement-api",
        "--status",
        "running",
        "--notes",
        "checkpoint note"
      ]);
    });
    assert.match(checkpointOutput, /trace-file:/);
    assert.match(checkpointOutput, /active-file:/);

    const summaryOutput = await captureConsole(async () => {
      await buildProgram().parseAsync(["node", "looply", "perf", "trace", "summary", "--dir", targetRoot, "--limit", "2"]);
    });
    assert.match(summaryOutput, /LOOPLY TRACE/);
    assert.match(summaryOutput, /looply:story-to-production/);
    assert.match(summaryOutput, /checkpoint note/);

    await buildProgram().parseAsync([
      "node",
      "looply",
      "perf",
      "trace",
      "finish",
      "--dir",
      targetRoot,
      "--source",
      "manual",
      "--status",
      "completed",
      "--notes",
      "finish trace"
    ]);

    const events = await readPerfWorkflowTraceEvents(targetRoot);
    assert.equal(events.length, 3);
    assert.equal(events[1]?.event, "checkpoint");
    assert.equal(events[1]?.stage, "implementation");
    assert.equal(events[2]?.event, "finish");
    assert.equal(await fs.pathExists(resolvePerfWorkflowActiveFile(targetRoot)), false);
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
