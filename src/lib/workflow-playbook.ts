import type { CatalogArtifact } from "./artifact-catalog.js";

interface WorkflowPlaybookWorkflow {
  name: string;
  summary?: string;
  phase: string;
  orchestrator?: string;
  inputs: string[];
  outputs: string[];
  stages: WorkflowStageEntry[];
  handoffs: WorkflowHandoffEntry[];
  gates: WorkflowGateEntry[];
}

interface WorkflowStageEntry {
  name: string;
  agent: string;
  task: string;
  dependsOn: string[];
  inputs: string[];
  outputs: string[];
}

interface WorkflowHandoffEntry {
  from: string;
  to: string;
  artifact: string;
}

interface WorkflowGateEntry {
  name: string;
  owner: string;
  afterStage: string;
  requiresOutputs: string[];
  checklist?: string;
  blocksOnFailure: boolean;
}

interface WorkflowFrontmatterShape {
  phase?: unknown;
  orchestrator?: unknown;
  inputs?: unknown;
  outputs?: unknown;
  stages?: unknown;
  handoffs?: unknown;
  gates?: unknown;
}

export function buildWorkflowPlaybookDocument(input: {
  host: string;
  pack: string;
  artifacts: CatalogArtifact[];
  packClosure?: string[];
}): string {
  const allowedPacks = new Set(input.packClosure ?? [input.pack]);
  const workflows = input.artifacts
    .filter((artifact) => allowedPacks.has(artifact.pack) && artifact.type === "workflow")
    .map((artifact) => toWorkflowEntry(artifact))
    .sort((left, right) => left.name.localeCompare(right.name));

  const lines: string[] = [
    `# looply Workflow Playbook for ${input.host}`,
    "",
    `Pack: \`${input.pack}\``,
    input.packClosure && input.packClosure.length > 1 ? `Includes packs: ${input.packClosure.map((pack) => `\`${pack}\``).join(", ")}` : "",
    "",
    "Use this playbook as the shortest path to execute a feature workflow with explicit ownership, handoffs and quality gates.",
    ""
  ];

  if (workflows.length === 0) {
    lines.push("No workflows were found for this pack.");
    return lines.join("\n");
  }

  lines.push("## Available Workflows", "");
  for (const workflow of workflows) {
    lines.push(`- \`${workflow.name}\`${workflow.summary ? `: ${workflow.summary}` : ""}`);
  }

  for (const workflow of workflows) {
    lines.push("", `## Workflow: ${workflow.name}`, "");

    if (workflow.summary) {
      lines.push(workflow.summary, "");
    }

    lines.push(`Phase: \`${workflow.phase}\``);

    if (workflow.orchestrator) {
      lines.push(`Orchestrator: \`${workflow.orchestrator}\``, "");
    }

    if (workflow.inputs.length > 0) {
      lines.push(`Inputs: ${workflow.inputs.map((value) => `\`${value}\``).join(", ")}`);
    }

    if (workflow.outputs.length > 0) {
      lines.push(`Outputs: ${workflow.outputs.map((value) => `\`${value}\``).join(", ")}`);
    }

    lines.push("", "### Stages", "");
    for (const [index, stage] of workflow.stages.entries()) {
      lines.push(`${index + 1}. \`${stage.name}\``);
      lines.push(`   owner: \`${stage.agent}\``);
      lines.push(`   task: \`${stage.task}\``);

      if (stage.dependsOn.length > 0) {
        lines.push(`   depends_on: ${stage.dependsOn.map((value) => `\`${value}\``).join(", ")}`);
      }

      if (stage.inputs.length > 0) {
        lines.push(`   inputs: ${stage.inputs.map((value) => `\`${value}\``).join(", ")}`);
      }

      if (stage.outputs.length > 0) {
        lines.push(`   outputs: ${stage.outputs.map((value) => `\`${value}\``).join(", ")}`);
      }
    }

    if (workflow.handoffs.length > 0) {
      lines.push("", "### Handoffs", "");
      for (const handoff of workflow.handoffs) {
        lines.push(`- \`${handoff.from}\` -> \`${handoff.to}\` via \`${handoff.artifact}\``);
      }
    }

    if (workflow.gates.length > 0) {
      lines.push("", "### Gates", "");
      for (const gate of workflow.gates) {
        const fragments = [
          `owner \`${gate.owner}\``,
          `after \`${gate.afterStage}\``,
          gate.blocksOnFailure ? "blocks on failure" : "non-blocking"
        ];

        if (gate.requiresOutputs.length > 0) {
          fragments.push(`requires ${gate.requiresOutputs.map((value) => `\`${value}\``).join(", ")}`);
        }

        if (gate.checklist) {
          fragments.push(`checklist \`${gate.checklist}\``);
        }

        lines.push(`- \`${gate.name}\`: ${fragments.join("; ")}`);
      }
    }
  }

  lines.push(
    "",
    "## Operating Rules",
    "",
    "- Follow stages in order unless a stage explicitly allows parallel work.",
    "- Complete each blocking gate before advancing to the next stage.",
    "- Persist feature progress in `.looply/custom/features/<feature-name>/workflow-status.md`.",
    "- Preserve managed pack files as canonical and place local overrides in `.looply/custom`."
  );

  return lines.join("\n");
}

function toWorkflowEntry(artifact: CatalogArtifact): WorkflowPlaybookWorkflow {
  const frontmatter = artifact.frontmatter as WorkflowFrontmatterShape;

  return {
    name: artifact.name,
    summary: artifact.summary,
    phase: typeof frontmatter.phase === "string" ? frontmatter.phase : "delivery",
    orchestrator: typeof frontmatter.orchestrator === "string" ? frontmatter.orchestrator : undefined,
    inputs: toStringArray(frontmatter.inputs),
    outputs: toStringArray(frontmatter.outputs),
    stages: toStageEntries(frontmatter.stages),
    handoffs: toHandoffEntries(frontmatter.handoffs),
    gates: toGateEntries(frontmatter.gates)
  };
}

function toStageEntries(value: unknown): WorkflowStageEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      name: String(item.name ?? ""),
      agent: String(item.agent ?? ""),
      task: String(item.task ?? ""),
      dependsOn: toStringArray(item.depends_on),
      inputs: toStringArray(item.inputs),
      outputs: toStringArray(item.outputs)
    }))
    .filter((item) => item.name !== "" && item.agent !== "" && item.task !== "");
}

function toHandoffEntries(value: unknown): WorkflowHandoffEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      from: String(item.from ?? ""),
      to: String(item.to ?? ""),
      artifact: String(item.artifact ?? "")
    }))
    .filter((item) => item.from !== "" && item.to !== "" && item.artifact !== "");
}

function toGateEntries(value: unknown): WorkflowGateEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      name: String(item.name ?? ""),
      owner: String(item.owner ?? ""),
      afterStage: String(item.after_stage ?? ""),
      requiresOutputs: toStringArray(item.requires_outputs),
      checklist: typeof item.checklist === "string" ? item.checklist : undefined,
      blocksOnFailure: item.blocks_on_failure !== false
    }))
    .filter((item) => item.name !== "" && item.owner !== "" && item.afterStage !== "");
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item))
    .filter((item) => item.trim() !== "");
}
