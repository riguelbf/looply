#!/usr/bin/env node
import process from "node:process";
import { spawnSync } from "node:child_process";

const eventName = process.argv[2] ?? "";
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

let payload = {};
try {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  payload = raw ? JSON.parse(raw) : {};
} catch {
  payload = {};
}

if (!String(process.env.LOOPLY_PERF || "").trim()) {
  process.exit(0);
}

const prompt = typeof payload.prompt === "string" ? payload.prompt.trim() : "";
const toolName = typeof payload.tool_name === "string" ? payload.tool_name.trim() : "";
const toolInput = payload.tool_input && typeof payload.tool_input === "object" ? payload.tool_input : {};

function summarizeToolInput(input) {
  if (!input || typeof input !== "object") {
    return "";
  }

  if (typeof input.file_path === "string" && input.file_path !== "") {
    return `file:${input.file_path}`;
  }
  if (typeof input.command === "string" && input.command !== "") {
    return `command:${String(input.command).slice(0, 120)}`;
  }
  if (typeof input.pattern === "string" && input.pattern !== "") {
    return `pattern:${String(input.pattern).slice(0, 120)}`;
  }
  if (typeof input.path === "string" && input.path !== "") {
    return `path:${input.path}`;
  }

  return "";
}

if (eventName === "user-prompt-submit") {
  const match = prompt.match(/^\/looply:([^\s]+)\s+([^\s]+)/);
  if (!match) {
    process.exit(0);
  }

  const [, aliasName, feature] = match;
  const command = [
    "looply",
    "perf",
    "trace",
    "start",
    "--dir",
    projectDir,
    "--source",
    "claude-hook",
    "--host",
    "claude",
    "--alias",
    `looply:${aliasName}`,
    "--workflow",
    aliasName,
    "--feature",
    feature,
    "--notes",
    "Started from Claude UserPromptSubmit hook"
  ];
  spawnSync(command[0], command.slice(1), { stdio: "ignore", cwd: projectDir });
  process.exit(0);
}

if (eventName === "pre-tool" && toolName) {
  const toolSummary = summarizeToolInput(toolInput);
  const command = [
    "looply",
    "perf",
    "trace",
    "checkpoint",
    "--dir",
    projectDir,
    "--source",
    "claude-hook",
    "--host",
    "claude",
    "--stage",
    `tool:${toolName}`,
    "--task",
    toolName,
    "--status",
    "starting",
    "--notes",
    toolSummary || `Starting tool ${toolName}`
  ];
  spawnSync(command[0], command.slice(1), { stdio: "ignore", cwd: projectDir });
  process.exit(0);
}

if (eventName === "post-tool" && toolName) {
  const toolSummary = summarizeToolInput(toolInput);
  const command = [
    "looply",
    "perf",
    "trace",
    "checkpoint",
    "--dir",
    projectDir,
    "--source",
    "claude-hook",
    "--host",
    "claude",
    "--stage",
    `tool:${toolName}`,
    "--task",
    toolName,
    "--status",
    "completed",
    "--notes",
    toolSummary || `Completed tool ${toolName}`
  ];
  spawnSync(command[0], command.slice(1), { stdio: "ignore", cwd: projectDir });
  process.exit(0);
}

if (eventName === "stop") {
  const command = [
    "looply",
    "perf",
    "trace",
    "finish",
    "--dir",
    projectDir,
    "--source",
    "claude-hook",
    "--host",
    "claude",
    "--status",
    "completed",
    "--notes",
    "Finished from Claude Stop hook"
  ];
  spawnSync(command[0], command.slice(1), { stdio: "ignore", cwd: projectDir });
  process.exit(0);
}

process.exit(0);
