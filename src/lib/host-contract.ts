import type { SupportedHost } from "./host-publisher.js";

export function buildHostContractDocument(input: {
  host: SupportedHost;
  outputLocale: "en" | "pt-BR";
  projectMode: "existing-project" | "greenfield";
  interactionMode: "guided" | "balanced" | "autonomous";
  entrypointReference: string;
  workflowPlaybookReference: string;
  hostContractReference: string;
  contextIndexReference: string;
  projectContextReference: string;
  sessionContextReference: string;
  projectSnapshotReference: string;
  statusContractReference: string;
  contextSnapshotReference: string;
  codeContextReference: string;
  commandIndexReference?: string;
}): string {
  const hostName = input.host === "claude" ? "Claude Code" : "Codex";
  const commandIndexLine = input.commandIndexReference ? `- Command index: \`${input.commandIndexReference}\`` : null;

  return [
    `# looply Host Contract for ${hostName}`,
    "",
    "## Purpose",
    "",
    "This document is the host-facing operating contract for looply. The host reasons, the CLI executes, and the workflow state is the memory.",
    "",
    "## Primary References",
    "",
    `- Host entrypoint: \`${input.entrypointReference}\``,
    `- Workflow playbook: \`${input.workflowPlaybookReference}\``,
    `- Host contract: \`${input.hostContractReference}\``,
    `- Context index: \`${input.contextIndexReference}\``,
    `- Project context: \`${input.projectContextReference}\``,
    `- Session context: \`${input.sessionContextReference}\``,
    `- Project snapshot: \`${input.projectSnapshotReference}\``,
    `- Host status contract: \`${input.statusContractReference}\``,
    `- Context snapshot: \`${input.contextSnapshotReference}\``,
    `- Code-context snapshot: \`${input.codeContextReference}\``,
    commandIndexLine,
    "",
    "## Responsibilities",
    "",
    "- Read the persisted workflow state before asking for more context.",
    "- Prefer the host status contract when it exists, then fall back to the full snapshot only when the contract is stale or incomplete.",
    "- Choose a single next action per cycle.",
    "- Prefer the smallest possible command or edit that advances the current stage.",
    "- Persist the result before planning the next step.",
    "- Use the real codebase as the source of truth when context artifacts are stale or incomplete.",
    "",
    "## Autonomous Loop",
    "",
    "1. Read `workflow-status.md`, `host-status-contract.json` and the relevant snapshots.",
    "2. Decide whether the next step is discovery, planning, delivery, reconciliation, or recovery.",
    "3. Execute one action through the CLI or a direct file edit.",
    "4. Verify the result against the stage outputs and gate rules.",
    "5. Persist the updated state and repeat until the workflow is blocked or complete.",
    "",
    "For a single autonomous cycle, the host may use `looply autonomy <feature>` to derive the next action and record the decision state.",
    "",
    "## Execution Policy",
    "",
    input.interactionMode === "autonomous"
      ? "- Autonomous interaction mode can proceed without repeated confirmations for low-risk actions."
      : "- Balanced and guided modes must ask for confirmation before high-risk or destructive actions.",
    "- Never skip a blocking gate.",
    "- Never reprocess the full repository if the snapshots already contain enough state.",
    "- Never hide the next action from the persisted workflow state.",
    "- Never mutate feature state without leaving a written trace.",
    "",
    "## Token Discipline",
    "",
    "- Keep the context window small.",
    "- Prefer summaries over full-history replays.",
    "- Treat snapshots and persisted state as memory outside the prompt.",
    "- Re-read only the files that changed since the last cycle.",
    "",
    "## Stop Conditions",
    "",
    "- The current gate is blocked.",
    "- The next action requires human approval.",
    "- The workflow outputs are complete.",
    "- The required context is stale and the real codebase must be inspected first.",
    "",
    "## Mode Notes",
    "",
    `- Project mode: \`${input.projectMode}\``,
    `- Interaction mode: \`${input.interactionMode}\``,
    `- Output locale: \`${input.outputLocale}\``,
    `- Target host: \`${hostName}\``
  ]
    .filter((line) => line !== null)
    .join("\n");
}
