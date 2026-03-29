import type { Command } from "commander";
import chalk from "chalk";
import path from "node:path";
import { loadArtifactCatalog } from "../lib/artifact-catalog.js";
import { buildProjectSnapshot, writeProjectSnapshot } from "../lib/project-snapshot.js";
import { resolveLooplySourceRoot } from "../lib/source-root.js";
import { showOutro } from "../ui/feedback.js";

type StatusLocale = "en" | "pt-BR";

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .description("Show a consolidated operational status for the current project")
    .option("--dir <dir>", "Target directory for project status (defaults to current directory)")
    .option("--limit <count>", "Maximum number of recent history entries to show", "3")
    .option("--features <count>", "Maximum number of feature states to show", "5")
    .option("--json", "Print the normalized project snapshot as JSON")
    .action(async (options) => {
      const targetRoot = path.resolve(options.dir ?? process.cwd());
      const historyLimit = toPositiveNumber(options.limit, 3);
      const featureLimit = toPositiveNumber(options.features, 5);
      const [snapshot, catalog] = await Promise.all([
        buildProjectSnapshot(targetRoot),
        loadArtifactCatalog(resolveLooplySourceRoot())
      ]);
      const snapshotFile = await writeProjectSnapshot(targetRoot);

      if (options.json) {
        console.log(JSON.stringify(snapshot, null, 2));
        return;
      }

      console.log(chalk.black.bgWhite.bold(" LOOPLY STATUS "));
      console.log("");
      const locale = resolveStatusLocale(snapshot.project.locale);
      const text = getStatusText(locale);

      console.log(chalk.bold(text.project));
      console.log(`${text.root}: ${chalk.cyan(snapshot.targetRoot)}`);
      console.log(`${text.installed}: ${snapshot.project.installed ? chalk.green(text.yes) : chalk.red(text.no)}`);
      console.log(`${text.installs}: ${chalk.cyan(String(snapshot.summary.installCount))}`);
      console.log(`${text.features}: ${chalk.cyan(String(snapshot.summary.featureCount))}`);
      console.log(`${text.interventions}: ${chalk.cyan(String(snapshot.summary.interventionCount))}`);
      console.log(`${text.sessions}: ${chalk.cyan(String(snapshot.summary.sessionCount))}`);
      console.log("");

      console.log(chalk.bold(text.installation));
      if (snapshot.installation.installs.length === 0) {
        console.log(chalk.dim(text.noInstallManifest));
      } else {
        for (const entry of snapshot.installation.installs) {
          console.log(`- ${text.host}: ${chalk.cyan(entry.host)}  ${text.scope}: ${chalk.cyan(entry.scope)}  ${text.pack}: ${chalk.cyan(entry.pack)}`);
          console.log(
            chalk.dim(
              `  ${text.files}: ${text.managed} ${entry.managedFiles}  ${text.mergeable} ${entry.mergeableFiles}  ${text.custom} ${entry.customFiles}`
            )
          );
        }
      }
      console.log("");

      console.log(chalk.bold(text.operationalMode));
      console.log(`${text.locale}: ${chalk.cyan(snapshot.project.locale)}`);
      console.log(`${text.projectMode}: ${chalk.cyan(snapshot.project.projectMode)}`);
      console.log(`${text.interactionMode}: ${chalk.cyan(snapshot.project.interactionMode)}`);
      console.log(chalk.dim(`${text.contextRoot}: ${snapshot.project.primaryContextRoot}`));
      console.log(chalk.dim(`${text.inferencePolicy}: ${snapshot.project.inferencePolicy}`));
      console.log("");

      console.log(chalk.bold(text.publishedHosts));
      if (snapshot.hosts.length === 0) {
        console.log(chalk.dim(text.noPublishedHosts));
      } else {
        for (const host of snapshot.hosts) {
          console.log(`- ${text.host}: ${chalk.cyan(host.host)}  ${text.scope}: ${chalk.cyan(host.scope)}  ${text.pack}: ${chalk.cyan(host.pack)}`);
          console.log(chalk.dim(`  ${text.workflows}: ${host.workflowCount}  ${text.aliases}: ${host.aliases.slice(0, 4).join(", ") || text.none}`));
        }
      }
      console.log("");

      console.log(chalk.bold(text.context));
      if (snapshot.context.snapshot) {
        console.log(`${text.status}: ${chalk.cyan(snapshot.context.snapshot.contextStatus)}`);
        console.log(`${text.coverage}: ${chalk.cyan(snapshot.context.snapshot.contextCoverage)}`);
        console.log(`${text.lastValidated}: ${chalk.cyan(snapshot.context.snapshot.lastValidatedAt || text.unknown)}`);
        console.log(`${text.languages}: ${chalk.cyan(snapshot.context.snapshot.languages.join(", ") || text.none)}`);
        console.log(`${text.frameworks}: ${chalk.cyan(snapshot.context.snapshot.frameworks.join(", ") || text.none)}`);
        console.log(`${text.api}: ${chalk.cyan(snapshot.context.snapshot.apiSignals.join(", ") || text.none)}`);
        console.log(`${text.data}: ${chalk.cyan(snapshot.context.snapshot.dataSignals.join(", ") || text.none)}`);
        console.log(`${text.auth}: ${chalk.cyan(snapshot.context.snapshot.authSignals.join(", ") || text.none)}`);
        console.log(`${text.messaging}: ${chalk.cyan(snapshot.context.snapshot.messagingSignals.join(", ") || text.none)}`);
        console.log(`${text.observability}: ${chalk.cyan(snapshot.context.snapshot.observabilitySignals.join(", ") || text.none)}`);
        console.log(`${text.modules}: ${chalk.cyan(snapshot.context.snapshot.moduleHints.join(", ") || text.none)}`);
        console.log(`${text.integrations}: ${chalk.cyan(snapshot.context.snapshot.integrationHints.join(", ") || text.none)}`);
      } else {
        console.log(chalk.dim(text.noContextSnapshot));
      }
      console.log("");

      console.log(chalk.bold(text.sessions));
      if (snapshot.sessions.length === 0) {
        console.log(chalk.dim(text.noSessionLinks));
      } else {
        for (const session of snapshot.sessions.slice(0, 5)) {
          console.log(
            `- ${chalk.cyan(session.label)} -> ${chalk.cyan(session.feature)}${session.workflow ? ` ${chalk.dim(`(${session.workflow})`)}` : ""}`
          );
          if (session.lastCommand || session.lastUpdatedAt) {
            console.log(
              chalk.dim(
                `  ${session.lastCommand ?? text.noLastCommand}${session.lastUpdatedAt ? `  ${text.updated} ${session.lastUpdatedAt}` : ""}`
              )
            );
          }
        }
      }
      console.log("");

      console.log(chalk.bold(text.features));
      if (snapshot.features.length === 0) {
        console.log("");
        console.log(chalk.bold(text.workflow));
        console.log(`  ${chalk.dim(locale === "pt-BR"
          ? "1 ⏳ escolher-workflow -> 2 ⏳ iniciar-feature -> 3 ⏳ gerar-artefatos -> 4 ⏳ continuar-delivery"
          : "1 ⏳ choose-workflow -> 2 ⏳ start-feature -> 3 ⏳ generate-artifacts -> 4 ⏳ continue-delivery")}`);
        console.log("");
        console.log(`${text.projectLabel}: ${chalk.cyan(path.basename(snapshot.targetRoot))}`);
        console.log(`${text.featureLabel}: ${chalk.cyan(text.none)}`);
        console.log(`${text.workflowLabel}: ${chalk.cyan(text.notStarted)}`);
        console.log(`${text.hostLabel}: ${chalk.cyan(snapshot.hosts[0]?.host || text.unknown)}`);
        console.log(`${text.modeLabel}: ${chalk.cyan(snapshot.project.projectMode || text.unknown)}`);
        console.log("");
        console.log(chalk.bold(text.youAreHere));
        console.log(`  ${text.currentStage}: ${chalk.cyan(text.noWorkflowStarted)}`);
        console.log(`  ${text.currentGate}: ${chalk.cyan(text.na)}`);
        console.log(`  ${text.gateStatus}: ${chalk.cyan(text.awaitingStart)}`);
        console.log(`  ${text.currentAgent}: ${chalk.cyan(text.na)}`);
        console.log(`  ${text.currentTask}: ${chalk.cyan(text.na)}`);
        console.log("");
        console.log(chalk.bold(text.outputs));
        console.log(`  ${text.completed}`);
        console.log(`    - ${text.none}`);
        console.log("");
        console.log(`  ${text.missing}`);
        console.log("    - workflow-status");
        console.log(`    - ${text.firstWorkflowArtifact}`);
        console.log("");
        console.log(`  ${text.superseded}`);
        console.log(`    - ${text.none}`);
        console.log("");
        console.log(chalk.bold(text.blockers));
        if (!snapshot.project.installed) {
          console.log(`  - ${text.looplyNotInstalled}`);
        } else {
          console.log(`  - ${text.noActiveFeature}`);
        }
        console.log("");
        console.log(chalk.bold(text.nextStep));
        console.log(`  ${text.agent}: ${chalk.cyan("orchestrator")}`);
        console.log(`  ${text.task}: ${chalk.cyan(locale === "pt-BR" ? "escolher-workflow" : "choose-workflow")}`);
        console.log(`  ${text.command}:`);
        console.log(`    ${chalk.cyan(resolveEmptyStateCommand(snapshot))}`);
        console.log("");
        console.log(chalk.bold(text.afterApproval));
        console.log(`  - ${text.selectCorrectWorkflow}`);
        console.log(`  - ${text.startFeatureWithContext}`);
        console.log(`  - ${text.generateFirstArtifact}`);
        console.log("");
        console.log(chalk.bold(text.attention));
        console.log(`  - ${text.context}: ${snapshot.context.snapshot?.contextStatus || text.notGenerated}`);
        console.log(`  - ${text.contextCoverageLabel}: ${snapshot.context.snapshot?.contextCoverage || text.unknown}`);
        console.log(`  - ${text.publishedHostsLabel}: ${snapshot.hosts.length > 0 ? snapshot.hosts.map((host) => host.host).join(", ") : text.none}`);
        console.log(`  - ${text.linkedSessions}: ${snapshot.sessions.length > 0 ? snapshot.sessions.map((session) => session.label).join(", ") : text.none}`);
        console.log("");
      } else {
        for (const feature of snapshot.features.slice(0, featureLimit)) {
          const stageEntries = resolveWorkflowStages(catalog, feature.workflow);
          const workflowLine = renderWorkflowMiniMap(stageEntries, feature.currentStage);
          const activeStageIndex = Math.max(
            0,
            stageEntries.findIndex((entry) => normalizeKey(entry.name) === normalizeKey(feature.currentStage))
          );
          const pendingStages = stageEntries.slice(activeStageIndex + 1);
          const linkedSessions = snapshot.sessions.filter((session) => session.feature === feature.feature);
          console.log(chalk.cyan.bold(feature.feature));
          console.log("");
          console.log(chalk.bold(text.workflow));
          console.log(`  ${workflowLine || chalk.dim(text.noWorkflowStages)}`);
          console.log("");
          console.log(`${text.projectLabel}: ${chalk.cyan(path.basename(snapshot.targetRoot))}`);
          console.log(`${text.featureLabel}: ${chalk.cyan(feature.feature)}`);
          console.log(`${text.workflowLabel}: ${chalk.cyan(feature.workflow || text.unknown)}`);
          console.log(`${text.hostLabel}: ${chalk.cyan(feature.host || text.unknown)}`);
          console.log(`${text.modeLabel}: ${chalk.cyan(feature.executionMode || "workflow")}`);
          console.log("");
          console.log(chalk.bold(text.youAreHere));
          console.log(`  ${text.currentStage}: ${chalk.cyan(feature.currentStage || text.unknown)}`);
          console.log(`  ${text.currentGate}: ${chalk.cyan(feature.currentGate || text.unknown)}`);
          console.log(`  ${text.gateStatus}: ${chalk.cyan(formatGateStatus(feature.gateStatus, locale))}`);
          console.log(`  ${text.currentAgent}: ${chalk.cyan(feature.nextAgent || resolveCurrentAgent(stageEntries, feature.currentStage) || text.unknown)}`);
          console.log(`  ${text.currentTask}: ${chalk.cyan(feature.nextTask || resolveCurrentTask(stageEntries, feature.currentStage) || text.unknown)}`);
          console.log("");
          console.log(chalk.bold(text.outputs));
          console.log(`  ${text.completed}`);
          if (feature.completedOutputs.length === 0) {
            console.log(`    - ${text.none}`);
          } else {
            for (const output of feature.completedOutputs.slice(0, 8)) {
              console.log(`    - ${output}`);
            }
          }
          console.log("");
          console.log(`  ${text.missing}`);
          if (feature.missingOutputs.length === 0) {
            console.log(`    - ${text.none}`);
          } else {
            for (const output of feature.missingOutputs.slice(0, 8)) {
              console.log(`    - ${output}`);
            }
          }
          console.log("");
          console.log(`  ${text.superseded}`);
          if (feature.supersededOutputs.length === 0) {
            console.log(`    - ${text.none}`);
          } else {
            for (const output of feature.supersededOutputs.slice(0, 8)) {
              console.log(`    - ${output}`);
            }
          }
          console.log("");
          console.log(chalk.bold(text.blockers));
          if (feature.blockedBy.length === 0) {
            console.log(`  - ${text.noBlockers}`);
          } else {
            for (const blocker of feature.blockedBy.slice(0, 6)) {
              console.log(`  - ${blocker}`);
            }
          }
          console.log("");
          console.log(chalk.bold(text.nextStep));
          console.log(`  ${text.agent}: ${chalk.cyan(feature.nextAgent || resolveCurrentAgent(stageEntries, feature.currentStage) || text.unknown)}`);
          console.log(`  ${text.task}: ${chalk.cyan(feature.nextTask || resolveCurrentTask(stageEntries, feature.currentStage) || text.unknown)}`);
          console.log(`  ${text.command}:`);
          console.log(`    ${chalk.cyan(feature.recommendedRecoveryCommand || feature.nextCommand || text.unknown)}`);
          console.log("");
          console.log(chalk.bold(text.afterApproval));
          if (feature.missingOutputs.length > 0) {
            console.log(`  - ${text.generate} ${feature.missingOutputs[0]}`);
          } else {
            console.log(`  - ${text.consolidateStageOutputs}`);
          }
          if (pendingStages.length > 0) {
            console.log(`  - ${text.advanceTo} ${pendingStages[0]?.name}`);
            if (pendingStages[1]?.task) {
              console.log(`  - ${text.prepare} ${pendingStages[1].task}`);
            } else if (pendingStages[0]?.task) {
              console.log(`  - ${text.prepare} ${pendingStages[0].task}`);
            }
          } else {
            console.log(`  - ${text.workflowClosing}`);
          }
          console.log("");
          console.log(chalk.bold(text.attention));
          console.log(`  - ${text.context}: ${feature.contextStatus || text.unknown}`);
          console.log(`  - ${text.contextCoverageLabel}: ${feature.contextCoverage || text.unknown}`);
          console.log(`  - ${text.lastHandoff}: ${feature.nextHandoff || text.unknown}`);
          console.log(`  - ${text.linkedSessions}: ${linkedSessions.length > 0 ? linkedSessions.map((session) => session.label).join(", ") : text.none}`);
          if (feature.replayedFrom) {
            console.log(`  - ${text.replayedFrom}: ${feature.replayedFrom}`);
          }
          if (feature.interventions.length > 0) {
            const lastIntervention = feature.interventions.at(-1);
            console.log(`  - ${text.lastIntervention}: ${lastIntervention?.type || text.unknown} ${lastIntervention?.summary || ""}`.trimEnd());
          }
          if (feature.decisionRationale) {
            console.log(`  - ${text.currentDecision}: ${feature.decisionRationale}`);
          }
          if (feature.lastUpdated) {
            console.log(`  - ${text.updated} ${feature.lastUpdated}`);
          }
          console.log(`  - ${text.stateFile}: ${path.relative(targetRoot, feature.file)}`);
          console.log("");
        }
      }

      console.log(chalk.bold(text.recentHistory));
      if (snapshot.history.length === 0) {
        console.log(chalk.dim(text.noHistory));
      } else {
        for (const entry of snapshot.history.slice(0, historyLimit)) {
          console.log(`- ${entry.timestamp}  ${chalk.cyan(entry.action)}  ${chalk.cyan(entry.host)}  ${chalk.dim(`(${entry.pack})`)}`);
          if (entry.impacts.length > 0) {
            console.log(chalk.dim(`  ${text.impacts}: ${entry.impacts.slice(0, 3).join(" | ")}`));
          }
        }
      }

      console.log("");
      console.log(chalk.bold(text.recommendedActions));
      const recommendations = buildRecommendedActions(snapshot, locale);
      for (const recommendation of recommendations) {
        console.log(`- ${recommendation}`);
      }

      console.log("");
      console.log(chalk.bold(text.snapshot));
      console.log(chalk.dim(snapshotFile));

      showOutro(text.statusCompleted);
    });
}

function resolveWorkflowStages(
  catalog: Awaited<ReturnType<typeof loadArtifactCatalog>>,
  workflowName: string
): Array<{ name: string; agent: string; task: string }> {
  const workflow = catalog.find((artifact) => artifact.type === "workflow" && artifact.name === workflowName);
  const rawStages = Array.isArray(workflow?.frontmatter.stages) ? workflow.frontmatter.stages : [];
  return rawStages
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      name: String(entry.name ?? ""),
      agent: String(entry.agent ?? ""),
      task: String(entry.task ?? "")
    }))
    .filter((entry) => entry.name !== "");
}

function renderWorkflowMiniMap(
  stages: Array<{ name: string; agent: string; task: string }>,
  currentStage: string
): string {
  if (stages.length === 0) {
    return "";
  }

  const activeIndex = Math.max(0, stages.findIndex((stage) => normalizeKey(stage.name) === normalizeKey(currentStage)));
  return stages
    .map((stage, index) => {
      const marker = index < activeIndex ? "✅" : index === activeIndex ? "🔄" : "⏳";
      return `${index + 1} ${marker} ${stage.name}`;
    })
    .join(chalk.dim(" -> "));
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function formatGateStatus(value: string, locale: StatusLocale): string {
  switch (value.trim().toLowerCase()) {
    case "pending":
      return locale === "pt-BR" ? "aguardando aprovação" : "awaiting approval";
    case "approved":
    case "passed":
      return locale === "pt-BR" ? "aprovado" : "approved";
    case "blocked":
      return locale === "pt-BR" ? "bloqueado" : "blocked";
    case "rejected":
      return locale === "pt-BR" ? "rejeitado" : "rejected";
    default:
      return value || "unknown";
  }
}

function resolveCurrentAgent(
  stages: Array<{ name: string; agent: string; task: string }>,
  currentStage: string
): string {
  return stages.find((stage) => normalizeKey(stage.name) === normalizeKey(currentStage))?.agent ?? "";
}

function resolveCurrentTask(
  stages: Array<{ name: string; agent: string; task: string }>,
  currentStage: string
): string {
  return stages.find((stage) => normalizeKey(stage.name) === normalizeKey(currentStage))?.task ?? "";
}

function toPositiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function buildRecommendedActions(
  snapshot: Awaited<ReturnType<typeof buildProjectSnapshot>>,
  locale: StatusLocale
): string[] {
  const actions: string[] = [];
  const isPt = locale === "pt-BR";

  if (!snapshot.project.installed) {
    actions.push(
      isPt
        ? "Inicialize o estado do looply neste projeto com `looply install --host codex,claude --scope project --pack software-delivery-suite --project-mode existing-project`."
        : "Initialize project-scoped looply state with `looply install --host codex,claude --scope project --pack software-delivery-suite --project-mode existing-project`."
    );
  }

  if (snapshot.project.installed && snapshot.hosts.length === 0) {
    actions.push(
      isPt
        ? "Regenere as superfícies de host com `looply sync --host codex,claude --scope project` para manter aliases, skills e execution hints atualizados."
        : "Regenerate host surfaces with `looply sync --host codex,claude --scope project` so command aliases, skills and execution hints stay current."
    );
  }

  if (!snapshot.context.snapshot) {
    actions.push(
      isPt
        ? "Gere o contexto do projeto com `looply refresh-context`."
        : "Generate project context with `looply refresh-context`."
    );
  }

  if (snapshot.features.length === 0) {
    actions.push(
      isPt
        ? "Inspecione os workflows disponíveis com `looply list workflow`."
        : "Inspect the available workflows with `looply list workflow`."
    );
    actions.push(
      isPt
        ? "Inspecione um workflow antes de iniciar o delivery com `looply inspect workflow story-to-production`."
        : "Inspect a workflow before starting delivery with `looply inspect workflow story-to-production`."
    );
    actions.push(
      isPt
        ? "Se o problema principal for topologia cloud ou design async-first, inspecione `looply inspect workflow cloud-workload-design`."
        : "If the main problem is cloud topology or async-first design, inspect `looply inspect workflow cloud-workload-design`."
    );
    actions.push(
      isPt
        ? "Se o problema principal for baseline de plataforma compartilhada ou guardrails, inspecione `looply inspect workflow platform-foundation-evolution`."
        : "If the main problem is shared platform baseline or guardrails, inspect `looply inspect workflow platform-foundation-evolution`."
    );
  } else {
    const nextFeature = snapshot.features.find((feature) => feature.nextCommand !== "") ?? snapshot.features[0];
    const interventionFeature = snapshot.features.find((feature) => feature.executionMode !== "workflow");
    if (interventionFeature) {
      actions.push(
        isPt
          ? `A feature \`${interventionFeature.feature}\` está em modo \`${interventionFeature.executionMode}\`. Reconcilie com \`looply reconcile ${interventionFeature.feature}\` ou continue com \`${interventionFeature.recommendedRecoveryCommand || interventionFeature.nextCommand || "looply status"}\`.`
          : `Feature \`${interventionFeature.feature}\` is in \`${interventionFeature.executionMode}\` mode. Reconcile with \`looply reconcile ${interventionFeature.feature}\` or continue with \`${interventionFeature.recommendedRecoveryCommand || interventionFeature.nextCommand || "looply status"}\`.`
      );
    }
    if (nextFeature?.nextCommand) {
      actions.push(
        isPt
          ? `Continue a feature \`${nextFeature.feature}\` com \`${nextFeature.nextCommand}\`.`
          : `Continue feature \`${nextFeature.feature}\` with \`${nextFeature.nextCommand}\`.`
      );
    } else {
      actions.push(
        isPt
          ? `Retome a feature \`${nextFeature?.feature ?? "current-feature"}\` com \`looply status\` e inspecione o estado persistido do workflow.`
          : `Resume feature \`${nextFeature?.feature ?? "current-feature"}\` with \`looply status\` and inspect the persisted workflow state.`
      );
    }
  }

  if (snapshot.context.snapshot && snapshot.context.snapshot.contextCoverage !== "high") {
    actions.push(
      isPt
        ? "Atualize e valide o contexto novamente após inspecionar o codebase real para aumentar a confiança antes de decisões de design ou implementação."
        : "Refresh and validate context again after inspecting the real codebase to increase confidence before design or implementation."
    );
  }

  return actions.length > 0
    ? actions
    : [isPt ? "Nenhuma ação imediata necessária. Use `looply status --json` para o estado operacional completo." : "No immediate action required. Use `looply status --json` for full operational state."];
}

function resolveEmptyStateCommand(snapshot: Awaited<ReturnType<typeof buildProjectSnapshot>>): string {
  if (!snapshot.project.installed) {
    return "looply install --host codex,claude --scope project --pack software-delivery-suite --project-mode existing-project";
  }

  if (!snapshot.context.snapshot) {
    return "looply refresh-context";
  }

  return "looply inspect workflow story-to-production";
}

function resolveStatusLocale(value: string): StatusLocale {
  return value === "pt-BR" ? "pt-BR" : "en";
}

function getStatusText(locale: StatusLocale) {
  if (locale === "pt-BR") {
    return {
      project: "Projeto",
      root: "root",
      installed: "instalado",
      yes: "sim",
      no: "não",
      installs: "instalações",
      features: "Features",
      interventions: "intervenções",
      sessions: "Sessões",
      installation: "Instalação",
      noInstallManifest: "Nenhum install manifest encontrado.",
      host: "host",
      scope: "escopo",
      pack: "pack",
      files: "arquivos",
      managed: "managed",
      mergeable: "mergeable",
      custom: "custom",
      operationalMode: "Modo Operacional",
      locale: "locale",
      projectMode: "project-mode",
      interactionMode: "interaction-mode",
      contextRoot: "context-root",
      inferencePolicy: "inference-policy",
      publishedHosts: "Hosts Publicados",
      noPublishedHosts: "Nenhuma superfície de host publicada encontrada.",
      workflows: "workflows",
      aliases: "aliases",
      context: "Contexto",
      status: "status",
      coverage: "coverage",
      lastValidated: "last-validated",
      languages: "languages",
      frameworks: "frameworks",
      api: "api",
      data: "data",
      auth: "auth",
      messaging: "messaging",
      observability: "observability",
      modules: "modules",
      integrations: "integrations",
      noContextSnapshot: "Nenhum context snapshot encontrado. Rode `looply refresh-context` para gerar um.",
      noSessionLinks: "Nenhum vínculo de sessão registrado.",
      noLastCommand: "sem-último-comando",
      workflow: "Workflow",
      projectLabel: "Projeto",
      featureLabel: "Feature",
      workflowLabel: "Workflow",
      hostLabel: "Host",
      modeLabel: "Modo",
      youAreHere: "Você está aqui",
      currentStage: "Etapa atual",
      currentGate: "Gate atual",
      gateStatus: "Status do gate",
      currentAgent: "Agente atual",
      currentTask: "Task atual",
      outputs: "Outputs",
      completed: "Concluídos",
      missing: "Faltando",
      superseded: "Superseded",
      blockers: "Bloqueios",
      noBlockers: "nenhum bloqueio registrado",
      nextStep: "Próximo passo",
      agent: "Agente",
      task: "Task",
      command: "Comando",
      afterApproval: "Se aprovado depois desta etapa",
      generate: "gerar",
      consolidateStageOutputs: "consolidar outputs desta etapa",
      advanceTo: "avançar para",
      prepare: "preparar",
      workflowClosing: "workflow entra em fechamento",
      attention: "Atenção",
      contextCoverageLabel: "cobertura de contexto",
      lastHandoff: "último handoff",
      linkedSessions: "sessões vinculadas",
      publishedHostsLabel: "hosts publicados",
      replayedFrom: "replayed from",
      lastIntervention: "última intervenção",
      currentDecision: "decisão atual",
      updated: "updated",
      stateFile: "state file",
      recentHistory: "Histórico Recente",
      noHistory: "Nenhum histórico de upgrade ou sync registrado.",
      impacts: "impacts",
      recommendedActions: "Ações Recomendadas",
      snapshot: "Snapshot",
      statusCompleted: "Snapshot de status concluído",
      none: "none",
      unknown: "unknown",
      notStarted: "não iniciado",
      noWorkflowStarted: "nenhum workflow iniciado",
      na: "n/a",
      awaitingStart: "aguardando início",
      firstWorkflowArtifact: "primeiro artefato do fluxo selecionado",
      looplyNotInstalled: "looply ainda não foi instalado neste projeto",
      noActiveFeature: "nenhuma feature ativa registrada",
      selectCorrectWorkflow: "selecionar o workflow correto",
      startFeatureWithContext: "iniciar uma feature com contexto válido",
      generateFirstArtifact: "gerar o primeiro artefato do fluxo",
      notGenerated: "não gerado",
      noWorkflowStages: "Nenhuma etapa de workflow disponível."
    } as const;
  }

  return {
    project: "Project",
    root: "root",
    installed: "installed",
    yes: "yes",
    no: "no",
    installs: "installs",
    features: "Features",
    interventions: "interventions",
      sessions: "Sessions",
    installation: "Installation",
    noInstallManifest: "No install manifest found.",
    host: "host",
    scope: "scope",
    pack: "pack",
    files: "files",
    managed: "managed",
    mergeable: "mergeable",
    custom: "custom",
    operationalMode: "Operational Mode",
    locale: "locale",
    projectMode: "project-mode",
    interactionMode: "interaction-mode",
    contextRoot: "context-root",
    inferencePolicy: "inference-policy",
    publishedHosts: "Published Hosts",
    noPublishedHosts: "No published host surfaces found.",
    workflows: "workflows",
    aliases: "aliases",
    context: "Context",
    status: "status",
    coverage: "coverage",
    lastValidated: "last-validated",
    languages: "languages",
    frameworks: "frameworks",
    api: "api",
    data: "data",
    auth: "auth",
    messaging: "messaging",
    observability: "observability",
    modules: "modules",
    integrations: "integrations",
    noContextSnapshot: "No context snapshot found. Run `looply refresh-context` to generate one.",
    noSessionLinks: "No session links recorded.",
    noLastCommand: "no-last-command",
    workflow: "Workflow",
    projectLabel: "Project",
    featureLabel: "Feature",
    workflowLabel: "Workflow",
    hostLabel: "Host",
    modeLabel: "Mode",
    youAreHere: "You are here",
    currentStage: "Current stage",
    currentGate: "Current gate",
    gateStatus: "Gate status",
    currentAgent: "Current agent",
    currentTask: "Current task",
    outputs: "Outputs",
    completed: "Completed",
    missing: "Missing",
    superseded: "Superseded",
    blockers: "Blockers",
    noBlockers: "no blockers recorded",
    nextStep: "Next step",
    agent: "Agent",
    task: "Task",
    command: "Command",
    afterApproval: "If approved after this stage",
    generate: "generate",
    consolidateStageOutputs: "consolidate outputs from this stage",
    advanceTo: "advance to",
    prepare: "prepare",
    workflowClosing: "workflow moves to closure",
    attention: "Attention",
    contextCoverageLabel: "context coverage",
    lastHandoff: "last handoff",
      linkedSessions: "linked sessions",
      publishedHostsLabel: "published hosts",
    replayedFrom: "replayed from",
    lastIntervention: "last intervention",
    currentDecision: "current decision",
    updated: "updated",
    stateFile: "state file",
    recentHistory: "Recent History",
    noHistory: "No upgrade or sync history recorded.",
    impacts: "impacts",
    recommendedActions: "Recommended Actions",
    snapshot: "Snapshot",
    statusCompleted: "Status snapshot completed",
    none: "none",
    unknown: "unknown",
    notStarted: "not started",
    noWorkflowStarted: "no workflow started",
    na: "n/a",
    awaitingStart: "awaiting start",
    firstWorkflowArtifact: "first artifact for the selected workflow",
    looplyNotInstalled: "looply is not installed in this project yet",
    noActiveFeature: "no active feature recorded",
    selectCorrectWorkflow: "select the correct workflow",
    startFeatureWithContext: "start a feature with valid context",
    generateFirstArtifact: "generate the first workflow artifact",
    notGenerated: "not generated",
    noWorkflowStages: "No workflow stages available."
  } as const;
}
