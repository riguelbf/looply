import type { Command } from "commander";
import type { PerfMode } from "./schema.js";

export function addProfileOption(command: Command): Command {
  return command.option("--profile [mode]", "Enable performance profiling (basic or context)");
}

export function resolvePerfMode(value?: unknown): PerfMode {
  const candidate = normalizePerfValue(value);
  if (!candidate) {
    return "off";
  }

  switch (candidate) {
    case "1":
    case "true":
    case "on":
    case "basic":
      return "basic";
    case "context":
      return "context";
    case "0":
    case "false":
    case "off":
      return "off";
    default:
      return "basic";
  }
}

function normalizePerfValue(value?: unknown): string | null {
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim().toLowerCase();
  }

  if (value === true) {
    return "basic";
  }

  if (value === false) {
    return "off";
  }

  const envValue = process.env.LOOPLY_PERF;
  if (typeof envValue === "string" && envValue.trim() !== "") {
    return envValue.trim().toLowerCase();
  }

  return null;
}

