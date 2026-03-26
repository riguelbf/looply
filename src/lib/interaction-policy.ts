import path from "node:path";
import fs from "fs-extra";
import type { InteractionMode } from "./host-publisher.js";

export interface InteractionPolicyDocument {
  mode: InteractionMode;
  askWhen: string[];
  avoidRepeatedClarifications: boolean;
}

export function resolveInteractionPolicyFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "interaction-policy.json");
}

export async function writeInteractionPolicyFile(targetRoot: string, mode: InteractionMode): Promise<string> {
  const file = resolveInteractionPolicyFile(targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.writeJson(file, buildInteractionPolicy(mode), { spaces: 2 });
  return file;
}

export async function readInteractionPolicyFile(targetRoot: string): Promise<InteractionPolicyDocument | null> {
  const file = resolveInteractionPolicyFile(targetRoot);
  if (!(await fs.pathExists(file))) {
    return null;
  }

  const raw = await fs.readJson(file);
  const mode = normalizeInteractionMode(raw?.mode);
  if (!mode) {
    return null;
  }

  return buildInteractionPolicy(mode);
}

function normalizeInteractionMode(value: unknown): InteractionMode | null {
  if (value === "guided" || value === "balanced" || value === "autonomous") {
    return value;
  }

  return null;
}

function buildInteractionPolicy(mode: InteractionMode): InteractionPolicyDocument {
  switch (mode) {
    case "guided":
      return {
        mode,
        askWhen: ["before-each-phase", "ambiguity", "destructive-change"],
        avoidRepeatedClarifications: false
      };
    case "autonomous":
      return {
        mode,
        askWhen: ["destructive-change", "critical-ambiguity"],
        avoidRepeatedClarifications: true
      };
    default:
      return {
        mode: "balanced",
        askWhen: ["phase-transition", "meaningful-ambiguity", "destructive-change"],
        avoidRepeatedClarifications: true
      };
  }
}
