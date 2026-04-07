import path from "node:path";
import fs from "fs-extra";
import { loadArtifactCatalog } from "./artifact-catalog.js";
import type { WorkflowFrontmatter } from "./artifact-schema.js";
import { readContextSnapshot } from "./context-snapshot.js";
import { resolveEffectiveExamplePolicy } from "./example-policy.js";
import { selectExamplesForWorkflow } from "./example-selection.js";
import { readExecutionHintsDocument } from "./execution-hints.js";
import type { SupportedHost } from "./host-publisher.js";
import { readInstallManifestFromTarget } from "./manifest.js";

export type HarnessCheckId = "greenfield-coverage" | "example-selection" | "token-budget";
export type HarnessSeverity = "error" | "warn" | "info";

export interface HarnessFinding {
  check: HarnessCheckId;
  severity: HarnessSeverity;
  message: string;
  detail?: string;
}

export interface HarnessMetrics {
  harnessBytes: number;
  harnessTokensEstimate: number;
  budgetHint: "small" | "medium" | "large";
  budgetTokensHint: number;
  inspectedFiles: string[];
}

export interface HarnessReport {
  ok: boolean;
  targetRoot: string;
  host: SupportedHost;
  pack: string;
  generatedAt: string;
  findings: HarnessFinding[];
  metrics: HarnessMetrics;
}

export interface RunHarnessValidationInput {
  targetRoot: string;
  sourceRoot: string;
  host: SupportedHost;
}

const BUDGET_TOKEN_MAP: Record<HarnessMetrics["budgetHint"], number> = {
  small: 2_000,
  medium: 5_000,
  large: 15_000
};

const BUDGET_RANK: Record<HarnessMetrics["budgetHint"], number> = {
  small: 0,
  medium: 1,
  large: 2
};

const CHARS_PER_TOKEN = 4;

export async function runHarnessValidation(input: RunHarnessValidationInput): Promise<HarnessReport> {
  const { targetRoot, sourceRoot, host } = input;
  const manifest = await readInstallManifestFromTarget(targetRoot);
  if (!manifest) {
    throw new Error(`No install manifest found at ${targetRoot}. Run 'looply install' first.`);
  }

  const installEntry = manifest.installs.find((entry) => entry.host === host);
  if (!installEntry) {
    throw new Error(`No install entry for host '${host}' at ${targetRoot}.`);
  }

  const findings: HarnessFinding[] = [];
  const snapshot = await readContextSnapshot(targetRoot);

  if (snapshot && snapshot.projectMode === "greenfield" && snapshot.contextCoverage === "low") {
    findings.push({
      check: "greenfield-coverage",
      severity: "warn",
      message: "Greenfield project running with low context coverage.",
      detail: "Discovery agents will rely 100% on explicit assumptions. Enrich .looply/custom/project-context.md or record the intended scope before starting a workflow."
    });
  }

  const catalog = await loadArtifactCatalog(sourceRoot);
  const examplePolicy = await resolveEffectiveExamplePolicy(targetRoot);
  if (snapshot && examplePolicy.mode !== "off") {
    const discoveryWorkflow = catalog.find((artifact) => {
      if (artifact.type !== "workflow" || artifact.pack !== installEntry.pack) {
        return false;
      }
      const phase = (artifact.frontmatter as WorkflowFrontmatter).phase;
      return phase === "discovery";
    });

    if (discoveryWorkflow) {
      const selection = selectExamplesForWorkflow({
        artifacts: catalog,
        pack: installEntry.pack,
        workflowName: discoveryWorkflow.name,
        host,
        outputLocale: snapshot.outputLocale,
        projectMode: snapshot.projectMode,
        interactionMode: snapshot.interactionMode,
        mode: examplePolicy.mode
      });

      if (selection.selected.length === 0) {
        findings.push({
          check: "example-selection",
          severity: "warn",
          message: `No ICL examples selected for '${discoveryWorkflow.name}' under ${snapshot.projectMode} + ${snapshot.interactionMode}.`,
          detail: `example-policy is '${examplePolicy.mode}' but ranked candidates returned 0. The agent will synthesize artifact structure without any reference. Add a matching example under packs/${installEntry.pack}/examples/ or adjust applies_to/project_modes/interaction_modes.`
        });
      }
    }
  }

  const inspectedFiles = listHarnessFiles(targetRoot, host);
  let harnessBytes = 0;
  for (const file of inspectedFiles) {
    if (await fs.pathExists(file)) {
      const stat = await fs.stat(file);
      harnessBytes += stat.size;
    }
  }
  const harnessTokens = Math.ceil(harnessBytes / CHARS_PER_TOKEN);
  const hints = await readExecutionHintsDocument(targetRoot, host);
  const budget = inferWorstBudget(hints);
  const budgetTokens = BUDGET_TOKEN_MAP[budget];

  if (harnessTokens > budgetTokens) {
    findings.push({
      check: "token-budget",
      severity: "error",
      message: `Harness (~${harnessTokens} tokens) exceeds smallest declared context_budget '${budget}' (~${budgetTokens} tokens).`,
      detail: "Trim project-context.md, reduce ICL examples with 'looply icl --mode reduced', or raise context_budget on the affected agents/tasks."
    });
  } else if (harnessTokens > Math.floor(budgetTokens * 0.7)) {
    findings.push({
      check: "token-budget",
      severity: "warn",
      message: `Harness (~${harnessTokens} tokens) uses over 70% of context_budget '${budget}' (~${budgetTokens} tokens).`,
      detail: "Consider trimming context files or reducing ICL before the agent loads task input."
    });
  }

  const ok = !findings.some((finding) => finding.severity === "error");

  return {
    ok,
    targetRoot,
    host,
    pack: installEntry.pack,
    generatedAt: new Date().toISOString(),
    findings,
    metrics: {
      harnessBytes,
      harnessTokensEstimate: harnessTokens,
      budgetHint: budget,
      budgetTokensHint: budgetTokens,
      inspectedFiles: inspectedFiles.map((file) => path.relative(targetRoot, file))
    }
  };
}

export function resolveHarnessReportFile(targetRoot: string): string {
  return path.join(targetRoot, ".looply", "state", "harness-report.md");
}

export async function writeHarnessReport(report: HarnessReport): Promise<string> {
  const file = resolveHarnessReportFile(report.targetRoot);
  await fs.ensureDir(path.dirname(file));
  await fs.writeFile(file, renderHarnessReportMarkdown(report), "utf8");
  return file;
}

export function renderHarnessReportMarkdown(report: HarnessReport): string {
  const lines = [
    "---",
    "schema: looply/harness-report@v1",
    "name: harness-report",
    `status: ${report.ok ? "active" : "blocking"}`,
    `host: ${report.host}`,
    `pack: ${report.pack}`,
    `generated_at: ${report.generatedAt}`,
    "---",
    "",
    "# Harness Report",
    "",
    "Advisory report on harness health for the installed host. Read this before starting a workflow — the findings below directly affect agent assertiveness and token usage.",
    "",
    "## Metrics",
    "",
    `- harness bytes: ${report.metrics.harnessBytes}`,
    `- harness tokens (approx, 4 chars/token): ${report.metrics.harnessTokensEstimate}`,
    `- worst declared context_budget across agents/tasks: \`${report.metrics.budgetHint}\` (~${report.metrics.budgetTokensHint} tokens)`,
    "",
    "## Inspected Files",
    ""
  ];

  for (const file of report.metrics.inspectedFiles) {
    lines.push(`- ${file}`);
  }

  lines.push("", "## Findings", "");

  if (report.findings.length === 0) {
    lines.push("- no findings");
  } else {
    for (const finding of report.findings) {
      lines.push(`- [${finding.severity}] ${finding.check}: ${finding.message}`);
      if (finding.detail) {
        lines.push(`  - ${finding.detail}`);
      }
    }
  }

  lines.push("", "## How The Host Should Use This", "");
  lines.push("- Treat `error` findings as blocking: do not start the workflow until they are resolved.");
  lines.push("- Treat `warn` findings as signals to surface the risk explicitly to the user before producing artifacts.");
  lines.push("- Re-run `looply validate --harness` after adjusting context, ICL policy or execution hints to regenerate this report.");

  return lines.join("\n") + "\n";
}

function listHarnessFiles(targetRoot: string, host: SupportedHost): string[] {
  const entrypoint = host === "claude" ? "CLAUDE.md" : "AGENTS.md";
  return [
    path.join(targetRoot, entrypoint),
    path.join(targetRoot, ".looply", "state", "context-index.md"),
    path.join(targetRoot, ".looply", "state", `workflow-playbook.${host}.md`),
    path.join(targetRoot, ".looply", "state", `execution-hints.${host}.json`),
    path.join(targetRoot, ".looply", "custom", "project-context.md"),
    path.join(targetRoot, ".looply", "custom", "session-context.md"),
    path.join(targetRoot, ".looply", "custom", "architecture-context.md")
  ];
}

function inferWorstBudget(hints: Awaited<ReturnType<typeof readExecutionHintsDocument>>): HarnessMetrics["budgetHint"] {
  if (!hints || hints.artifacts.length === 0) {
    return "medium";
  }

  let worst: HarnessMetrics["budgetHint"] = "large";
  let found = false;

  for (const artifact of hints.artifacts) {
    const candidate = artifact.execution?.context_budget;
    if (candidate === "small" || candidate === "medium" || candidate === "large") {
      found = true;
      if (BUDGET_RANK[candidate] < BUDGET_RANK[worst]) {
        worst = candidate;
      }
    }
  }

  return found ? worst : "medium";
}
