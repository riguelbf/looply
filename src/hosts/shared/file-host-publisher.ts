import { spawnSync } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import fs from "fs-extra";
import { globby } from "globby";
import { loadArtifactCatalog } from "../../lib/artifact-catalog.js";
import { buildHostContractDocument } from "../../lib/host-contract.js";
import { writeExampleDocuments } from "../../lib/example-documents.js";
import { buildExecutionHintsDocument } from "../../lib/execution-hints.js";
import { buildWorkflowPlaybookDocument } from "../../lib/workflow-playbook.js";
import {
  listCodexSkills,
  listWorkflowCommands,
  relativePathForDisplay,
  renderCodexLauncherSkillDocument,
  renderCodexLauncherSkillMetadata,
  renderCodexSkillDocument,
  renderCodexSkillMetadata,
  renderHelpCommandDocument,
  renderCodexCommandIndex,
  renderClaudeWorkflowCommand,
  renderCodexWorkflowCommand,
  composeContextForWorkflows,
  type ComposedSection,
  type WorkflowCommandDefinition,
  type WorkflowCommandReference
} from "../../lib/workflow-commands.js";
import type {
  DoctorInput,
  DoctorReport,
  HostCheck,
  HostPublisher,
  InstallInput,
  InstallResult,
  PreflightInput,
  PreflightReport,
  SyncInput,
  SyncPlan,
  SyncResult,
  UninstallInput,
  SupportedHost
} from "../../lib/host-publisher.js";
import { normalizeInstallManifest, removeInstallManifestEntry, upsertInstallManifest } from "../../lib/manifest.js";
import type { InstallManifest, UninstallResult } from "../../lib/publishing-model.js";
import { readInteractionPolicyFile, resolveInteractionPolicyFile, writeInteractionPolicyFile } from "../../lib/interaction-policy.js";
import { readLocaleFile, resolveLocaleFile, writeLocaleFile } from "../../lib/locale.js";
import { readProjectContextFile, resolveProjectContextFile, writeProjectContextFile } from "../../lib/project-context.js";
import { resolveCodeContextFile, resolveKnowledgeGraphFile } from "../../lib/code-context/storage.js";
import { resolveContextSnapshotFile } from "../../lib/context-snapshot.js";
import { resolvePackClosure } from "../../lib/packs.js";
import { resolveGlobalCodexSkillsRoot, resolveTargetRoot } from "../../lib/runtime-paths.js";
import { ensureSessionLinksFile, resolveSessionLinksFile } from "../../lib/session-links.js";
import {
  resolveContextIndexFile,
  resolveProjectContextMarkdownFile,
  resolveSessionContextMarkdownFile,
  writeContextIndexMarkdown,
  writeProjectContextMarkdown,
  writeSessionContextMarkdown
} from "../../lib/context-documents.js";
import {
  resolveIntegrationsIndexFile,
  writeIntegrationDocuments
} from "../../lib/integration-documents.js";
import {
  resolveRulesIndexFile,
  writeRuleDocuments
} from "../../lib/rule-documents.js";

interface FileHostPublisherOptions {
  hostName: SupportedHost;
  commandName: string;
  entrypointFilename: string;
}

export class FileHostPublisher implements HostPublisher {
  readonly hostName: SupportedHost;
  readonly commandName: string;
  private readonly entrypointFilename: string;

  constructor(options: FileHostPublisherOptions) {
    this.hostName = options.hostName;
    this.commandName = options.commandName;
    this.entrypointFilename = options.entrypointFilename;
  }

  async preflight(input: PreflightInput): Promise<PreflightReport> {
    const targetRoot = resolveTargetRoot(input.scope, input.currentWorkingDirectory, input.host);
    const sourcePackRoot = path.join(input.sourceRoot, "packs", input.pack);
    const writableRoot = (await fs.pathExists(targetRoot)) ? targetRoot : path.dirname(targetRoot);
    const entrypointParent = path.dirname(path.join(targetRoot, this.entrypointFilename));
    const writableEntrypointParent = (await fs.pathExists(entrypointParent)) ? entrypointParent : path.dirname(entrypointParent);

    const checks: HostCheck[] = [
      this.createCommandCheck(),
      await this.createCheck("source-root", input.sourceRoot, input.sourceRoot),
      await this.createCheck("pack-source", sourcePackRoot, `packs/${input.pack}`),
      await this.createWritableCheck("target-root-writable", writableRoot, writableRoot),
      await this.createWritableCheck(
        "entrypoint-parent",
        writableEntrypointParent,
        path.dirname(this.entrypointFilename)
      )
    ];

    return {
      host: input.host,
      scope: input.scope,
      targetRoot,
      checks
    };
  }

  async install(input: InstallInput): Promise<InstallResult> {
    const targetRoot = resolveTargetRoot(input.scope, input.currentWorkingDirectory, input.host);
    const managedBase = path.join(targetRoot, ".looply", "managed", "packs", input.pack);
    const customBase = path.join(targetRoot, ".looply", "custom");
    const stateBase = path.join(targetRoot, ".looply", "state");
    const manifestFile = path.join(stateBase, "install-manifest.json");
    const executionHintsFile = path.join(stateBase, `execution-hints.${input.host}.json`);
    const workflowPlaybookFile = path.join(stateBase, `workflow-playbook.${input.host}.md`);
    const localeFile = resolveLocaleFile(targetRoot);
    const projectContextFile = resolveProjectContextFile(targetRoot);
    const interactionPolicyFile = resolveInteractionPolicyFile(targetRoot);
    const sessionLinksFile = resolveSessionLinksFile(targetRoot);
    const contextIndexFile = resolveContextIndexFile(targetRoot);
    const projectContextMarkdownFile = resolveProjectContextMarkdownFile(targetRoot);
    const sessionContextMarkdownFile = resolveSessionContextMarkdownFile(targetRoot);
    const integrationsIndexFile = resolveIntegrationsIndexFile(targetRoot);
    const rulesIndexFile = resolveRulesIndexFile(targetRoot);
    const hostContractFile = path.join(targetRoot, "HOST_CONTRACT.md");
    const entrypointFile = path.join(targetRoot, this.entrypointFilename);
    const claudeHookFiles = await this.writeClaudePerfHookFiles(targetRoot, input.host);
    await fs.ensureDir(targetRoot);
    await fs.ensureDir(customBase);
    await fs.ensureDir(stateBase);
    const packClosure = await resolvePackClosure(input.sourceRoot, input.pack);
    await fs.remove(managedBase);
    for (const packName of packClosure) {
      await fs.copy(path.join(input.sourceRoot, "packs", packName), path.join(targetRoot, ".looply", "managed", "packs", packName), {
        overwrite: true,
        errorOnExist: false
      });
    }
    const workflowCommands = await this.writeWorkflowCommands({
      sourceRoot: input.sourceRoot,
      targetRoot,
      host: input.host,
      pack: input.pack,
      packClosure,
      workflowPlaybookFile,
      executionHintsFile,
      outputLocale: input.locale,
      projectMode: input.projectMode,
      interactionMode: input.interactionMode
    });
    const managedFiles = (
      await Promise.all(
        packClosure.map((packName) =>
          this.collectManagedFiles(path.join(targetRoot, ".looply", "managed", "packs", packName), targetRoot)
        )
      )
    ).flat();
    const mergeableFiles = [
      this.toRelativeTargetPath(targetRoot, entrypointFile),
      this.toRelativeTargetPath(targetRoot, executionHintsFile),
      this.toRelativeTargetPath(targetRoot, workflowPlaybookFile),
      this.toRelativeTargetPath(targetRoot, localeFile),
      this.toRelativeTargetPath(targetRoot, projectContextFile),
      this.toRelativeTargetPath(targetRoot, interactionPolicyFile),
      this.toRelativeTargetPath(targetRoot, sessionLinksFile),
      this.toRelativeTargetPath(targetRoot, contextIndexFile),
      this.toRelativeTargetPath(targetRoot, projectContextMarkdownFile),
      this.toRelativeTargetPath(targetRoot, sessionContextMarkdownFile),
      this.toRelativeTargetPath(targetRoot, integrationsIndexFile),
      this.toRelativeTargetPath(targetRoot, rulesIndexFile),
      this.toRelativeTargetPath(targetRoot, hostContractFile),
      ...workflowCommands.additionalFiles.map((file) => this.toRelativeTargetPath(targetRoot, file)),
      ...workflowCommands.files.map((file) => this.toRelativeTargetPath(targetRoot, file)),
      ...claudeHookFiles.map((file) => this.toRelativeTargetPath(targetRoot, file))
    ];

    const currentManifest = await this.readManifest(manifestFile);
    const manifest = upsertInstallManifest(currentManifest, {
      pack: input.pack,
      scope: input.scope,
      host: input.host,
      managedFiles,
      mergeableFiles
    });

    await this.writeExecutionHints(input.sourceRoot, executionHintsFile, input.host, input.pack, packClosure);
    await this.writeWorkflowPlaybook(input.sourceRoot, workflowPlaybookFile, input.host, input.pack, packClosure);
    await writeLocaleFile(targetRoot, input.locale);
    await writeProjectContextFile(targetRoot, {
      mode: input.projectMode,
      primaryContextRoot: targetRoot
    });
    await writeInteractionPolicyFile(targetRoot, input.interactionMode);
    await ensureSessionLinksFile(targetRoot);
    await writeContextIndexMarkdown({
      targetRoot,
      projectMode: input.projectMode,
      outputLocale: input.locale,
      interactionMode: input.interactionMode,
      inferencePolicy: input.projectMode === "existing-project"
        ? "codebase-first-with-artifact-acceleration"
        : "artifact-first-with-explicit-assumptions"
    });
    await writeProjectContextMarkdown({
      targetRoot,
      projectMode: input.projectMode,
      primaryContextRoot: targetRoot,
      outputLocale: input.locale,
      interactionMode: input.interactionMode,
      inferencePolicy: input.projectMode === "existing-project"
        ? "codebase-first-with-artifact-acceleration"
        : "artifact-first-with-explicit-assumptions"
    });
    await writeSessionContextMarkdown({
      targetRoot,
      projectMode: input.projectMode,
      outputLocale: input.locale,
      interactionMode: input.interactionMode,
      inferencePolicy: input.projectMode === "existing-project"
        ? "codebase-first-with-artifact-acceleration"
        : "artifact-first-with-explicit-assumptions"
    });
    await fs.writeFile(
      hostContractFile,
      buildHostContractDocument({
        host: input.host,
        outputLocale: input.locale,
        projectMode: input.projectMode,
        interactionMode: input.interactionMode,
        entrypointReference: relativePathForDisplay(path.dirname(hostContractFile), entrypointFile),
        workflowPlaybookReference: relativePathForDisplay(path.dirname(hostContractFile), workflowPlaybookFile),
        hostContractReference: relativePathForDisplay(path.dirname(hostContractFile), hostContractFile),
        contextIndexReference: relativePathForDisplay(path.dirname(hostContractFile), contextIndexFile),
        projectContextReference: relativePathForDisplay(path.dirname(hostContractFile), projectContextMarkdownFile),
        sessionContextReference: relativePathForDisplay(path.dirname(hostContractFile), sessionContextMarkdownFile),
        projectSnapshotReference: relativePathForDisplay(path.dirname(hostContractFile), path.join(targetRoot, ".looply", "state", "project-snapshot.json")),
        statusContractReference: relativePathForDisplay(path.dirname(hostContractFile), path.join(targetRoot, ".looply", "state", "host-status-contract.json")),
        contextSnapshotReference: relativePathForDisplay(path.dirname(hostContractFile), resolveContextSnapshotFile(targetRoot)),
        codeContextReference: relativePathForDisplay(path.dirname(hostContractFile), resolveCodeContextFile(targetRoot)),
        knowledgeGraphReference: relativePathForDisplay(path.dirname(hostContractFile), resolveKnowledgeGraphFile(targetRoot)),
        commandIndexReference: input.host === "codex"
          ? relativePathForDisplay(path.dirname(hostContractFile), path.join(targetRoot, "LOOPLY_COMMANDS.md"))
          : input.host === "opencode"
            ? relativePathForDisplay(path.dirname(hostContractFile), path.join(targetRoot, "OPENCODE_COMMANDS.md"))
            : relativePathForDisplay(path.dirname(hostContractFile), path.join(targetRoot, ".claude", "commands"))
      }),
      "utf8"
    );
    const integrationFiles = await writeIntegrationDocuments({
      targetRoot,
      projectMode: input.projectMode,
      outputLocale: input.locale,
      interactionMode: input.interactionMode,
      inferencePolicy: input.projectMode === "existing-project"
        ? "codebase-first-with-artifact-acceleration"
        : "artifact-first-with-explicit-assumptions"
    });
    mergeableFiles.push(...integrationFiles.map((file) => this.toRelativeTargetPath(targetRoot, file)));
    const ruleFiles = await writeRuleDocuments({
      targetRoot,
      projectMode: input.projectMode,
      outputLocale: input.locale,
      interactionMode: input.interactionMode,
      inferencePolicy: input.projectMode === "existing-project"
        ? "codebase-first-with-artifact-acceleration"
        : "artifact-first-with-explicit-assumptions",
      rules: (input.rules ?? []).map((r) => ({ category: r.category as import("../../lib/rule-documents.js").RuleCategory, content: r.content }))
    });
    mergeableFiles.push(...ruleFiles.map((file) => this.toRelativeTargetPath(targetRoot, file)));
    await fs.writeFile(
      entrypointFile,
      this.renderEntrypoint({
        host: input.host,
        pack: input.pack,
        outputLocale: input.locale,
        projectMode: input.projectMode,
        interactionMode: input.interactionMode,
        iclMode: workflowCommands.iclMode,
        commands: workflowCommands.commands
      }),
      "utf8"
    );
    await fs.writeJson(manifestFile, manifest, { spaces: 2 });

    return {
      host: input.host,
      scope: input.scope,
      pack: input.pack,
      targetRoot,
      entrypointFile,
      manifestFile,
      executionHintsFile,
      workflowPlaybookFile,
      localeFile,
      projectContextFile,
      interactionPolicyFile
    };
  }

  async sync(input: SyncInput): Promise<SyncResult> {
    const plan = await this.planSync(input);
    const targetRoot = plan.targetRoot;
    const manifestFile = path.join(targetRoot, ".looply", "state", "install-manifest.json");
    const manifest = await this.readManifest(manifestFile);

    if (!manifest) {
      throw new Error(`No install manifest found for ${input.host} in ${targetRoot}`);
    }

    const installEntry = manifest.installs.find((entry) => entry.host === input.host && entry.scope === input.scope);
    if (!installEntry) {
      throw new Error(`No install entry found for ${input.host} in ${input.scope} scope`);
    }

    const managedBase = path.join(targetRoot, ".looply", "managed", "packs", installEntry.pack);
    const stateBase = path.join(targetRoot, ".looply", "state");
    const executionHintsFile = path.join(stateBase, `execution-hints.${input.host}.json`);
    const workflowPlaybookFile = path.join(stateBase, `workflow-playbook.${input.host}.md`);
    const localeFile = resolveLocaleFile(targetRoot);
    const projectContextFile = resolveProjectContextFile(targetRoot);
    const interactionPolicyFile = resolveInteractionPolicyFile(targetRoot);
    const sessionLinksFile = resolveSessionLinksFile(targetRoot);
    const contextIndexFile = resolveContextIndexFile(targetRoot);
    const projectContextMarkdownFile = resolveProjectContextMarkdownFile(targetRoot);
    const sessionContextMarkdownFile = resolveSessionContextMarkdownFile(targetRoot);
    const integrationsIndexFile = resolveIntegrationsIndexFile(targetRoot);
    const rulesIndexFile = resolveRulesIndexFile(targetRoot);
    const hostContractFile = path.join(targetRoot, "HOST_CONTRACT.md");
    const entrypointFile = path.join(targetRoot, this.entrypointFilename);
    const claudeHookFiles = await this.writeClaudePerfHookFiles(targetRoot, input.host);
    const locale = (await readLocaleFile(targetRoot))?.outputLocale ?? "en";
    const projectMode = (await readProjectContextFile(targetRoot))?.mode ?? "existing-project";
    const interactionMode = (await readInteractionPolicyFile(targetRoot))?.mode ?? "balanced";
    const packClosure = await resolvePackClosure(input.sourceRoot, installEntry.pack);
    await fs.remove(managedBase);
    for (const packName of packClosure) {
      const targetPackRoot = path.join(targetRoot, ".looply", "managed", "packs", packName);
      await fs.remove(targetPackRoot);
      await fs.ensureDir(targetPackRoot);
      await fs.copy(path.join(input.sourceRoot, "packs", packName), targetPackRoot, { overwrite: true, errorOnExist: false });
    }
    const workflowCommands = await this.writeWorkflowCommands({
      sourceRoot: input.sourceRoot,
      targetRoot,
      host: input.host,
      pack: installEntry.pack,
      packClosure,
      workflowPlaybookFile,
      executionHintsFile,
      outputLocale: locale,
      projectMode,
      interactionMode
    });
    const managedFiles = (
      await Promise.all(
        packClosure.map((packName) =>
          this.collectManagedFiles(path.join(targetRoot, ".looply", "managed", "packs", packName), targetRoot)
        )
      )
    ).flat();
    const mergeableFiles = [
      this.toRelativeTargetPath(targetRoot, entrypointFile),
      this.toRelativeTargetPath(targetRoot, executionHintsFile),
      this.toRelativeTargetPath(targetRoot, workflowPlaybookFile),
      this.toRelativeTargetPath(targetRoot, localeFile),
      this.toRelativeTargetPath(targetRoot, projectContextFile),
      this.toRelativeTargetPath(targetRoot, interactionPolicyFile),
      this.toRelativeTargetPath(targetRoot, sessionLinksFile),
      this.toRelativeTargetPath(targetRoot, contextIndexFile),
      this.toRelativeTargetPath(targetRoot, projectContextMarkdownFile),
      this.toRelativeTargetPath(targetRoot, sessionContextMarkdownFile),
      this.toRelativeTargetPath(targetRoot, integrationsIndexFile),
      this.toRelativeTargetPath(targetRoot, rulesIndexFile),
      this.toRelativeTargetPath(targetRoot, hostContractFile),
      ...workflowCommands.additionalFiles.map((file) => this.toRelativeTargetPath(targetRoot, file)),
      ...workflowCommands.files.map((file) => this.toRelativeTargetPath(targetRoot, file)),
      ...claudeHookFiles.map((file) => this.toRelativeTargetPath(targetRoot, file))
    ];
    const updatedManifest = upsertInstallManifest(manifest, {
      pack: installEntry.pack,
      scope: input.scope,
      host: input.host,
      managedFiles,
      mergeableFiles
    });
    await this.writeExecutionHints(input.sourceRoot, executionHintsFile, input.host, installEntry.pack, packClosure);
    await this.writeWorkflowPlaybook(input.sourceRoot, workflowPlaybookFile, input.host, installEntry.pack, packClosure);
    await writeLocaleFile(targetRoot, locale);
    await writeProjectContextFile(targetRoot, {
      mode: projectMode,
      primaryContextRoot: targetRoot
    });
    await writeInteractionPolicyFile(targetRoot, interactionMode);
    await ensureSessionLinksFile(targetRoot);
    await writeContextIndexMarkdown({
      targetRoot,
      projectMode,
      outputLocale: locale,
      interactionMode,
      inferencePolicy: projectMode === "existing-project"
        ? "codebase-first-with-artifact-acceleration"
        : "artifact-first-with-explicit-assumptions"
    });
    await writeProjectContextMarkdown({
      targetRoot,
      projectMode,
      primaryContextRoot: targetRoot,
      outputLocale: locale,
      interactionMode,
      inferencePolicy: projectMode === "existing-project"
        ? "codebase-first-with-artifact-acceleration"
        : "artifact-first-with-explicit-assumptions"
    });
    await writeSessionContextMarkdown({
      targetRoot,
      projectMode,
      outputLocale: locale,
      interactionMode,
      inferencePolicy: projectMode === "existing-project"
        ? "codebase-first-with-artifact-acceleration"
        : "artifact-first-with-explicit-assumptions"
    });
    await fs.writeFile(
      hostContractFile,
      buildHostContractDocument({
        host: input.host,
        outputLocale: locale,
        projectMode,
        interactionMode,
        entrypointReference: relativePathForDisplay(path.dirname(hostContractFile), entrypointFile),
        workflowPlaybookReference: relativePathForDisplay(path.dirname(hostContractFile), workflowPlaybookFile),
        hostContractReference: relativePathForDisplay(path.dirname(hostContractFile), hostContractFile),
        contextIndexReference: relativePathForDisplay(path.dirname(hostContractFile), contextIndexFile),
        projectContextReference: relativePathForDisplay(path.dirname(hostContractFile), projectContextMarkdownFile),
        sessionContextReference: relativePathForDisplay(path.dirname(hostContractFile), sessionContextMarkdownFile),
        projectSnapshotReference: relativePathForDisplay(path.dirname(hostContractFile), path.join(targetRoot, ".looply", "state", "project-snapshot.json")),
        statusContractReference: relativePathForDisplay(path.dirname(hostContractFile), path.join(targetRoot, ".looply", "state", "host-status-contract.json")),
        contextSnapshotReference: relativePathForDisplay(path.dirname(hostContractFile), resolveContextSnapshotFile(targetRoot)),
        codeContextReference: relativePathForDisplay(path.dirname(hostContractFile), resolveCodeContextFile(targetRoot)),
        knowledgeGraphReference: relativePathForDisplay(path.dirname(hostContractFile), resolveKnowledgeGraphFile(targetRoot)),
        commandIndexReference: input.host === "codex"
          ? relativePathForDisplay(path.dirname(hostContractFile), path.join(targetRoot, "LOOPLY_COMMANDS.md"))
          : input.host === "opencode"
            ? relativePathForDisplay(path.dirname(hostContractFile), path.join(targetRoot, "OPENCODE_COMMANDS.md"))
            : relativePathForDisplay(path.dirname(hostContractFile), path.join(targetRoot, ".claude", "commands"))
      }),
      "utf8"
    );
    const integrationFiles = await writeIntegrationDocuments({
      targetRoot,
      projectMode,
      outputLocale: locale,
      interactionMode,
      inferencePolicy: projectMode === "existing-project"
        ? "codebase-first-with-artifact-acceleration"
        : "artifact-first-with-explicit-assumptions"
    });
    mergeableFiles.push(...integrationFiles.map((file) => this.toRelativeTargetPath(targetRoot, file)));
    const ruleFiles = await writeRuleDocuments({
      targetRoot,
      projectMode,
      outputLocale: locale,
      interactionMode,
      inferencePolicy: projectMode === "existing-project"
        ? "codebase-first-with-artifact-acceleration"
        : "artifact-first-with-explicit-assumptions"
    });
    mergeableFiles.push(...ruleFiles.map((file) => this.toRelativeTargetPath(targetRoot, file)));
    await fs.writeFile(
      entrypointFile,
      this.renderEntrypoint({
        host: input.host,
        pack: installEntry.pack,
        outputLocale: locale,
        projectMode,
        interactionMode,
        iclMode: workflowCommands.iclMode,
        commands: workflowCommands.commands
      }),
      "utf8"
    );
    await fs.writeJson(manifestFile, updatedManifest, { spaces: 2 });

    return {
      host: input.host,
      scope: input.scope,
      pack: installEntry.pack,
      targetRoot,
      manifestFile,
      addedFiles: plan.addedFiles,
      changedFiles: plan.changedFiles,
      removedFiles: plan.removedFiles
    };
  }

  async uninstall(input: UninstallInput): Promise<UninstallResult> {
    const targetRoot = resolveTargetRoot(input.scope, input.currentWorkingDirectory, input.host);
    const manifestFile = path.join(targetRoot, ".looply", "state", "install-manifest.json");
    const manifest = await this.readManifest(manifestFile);

    if (!manifest) {
      throw new Error(`No install manifest found for ${input.host} in ${targetRoot}`);
    }

    const installEntry = manifest.installs.find((entry) => entry.host === input.host && entry.scope === input.scope);
    if (!installEntry) {
      throw new Error(`No install entry found for ${input.host} in ${input.scope} scope`);
    }

    const nextManifest = removeInstallManifestEntry(manifest, {
      host: input.host,
      scope: input.scope
    });

    const referencedFiles = new Set(
      nextManifest.installs.flatMap((entry) => [...entry.managedFiles, ...entry.mergeableFiles])
    );
    const removedFiles: string[] = [];

    for (const file of [...installEntry.mergeableFiles, ...installEntry.managedFiles]) {
      if (referencedFiles.has(file)) {
        continue;
      }

      const absoluteFile = path.join(targetRoot, file);
      if (await fs.pathExists(absoluteFile)) {
        await fs.remove(absoluteFile);
        removedFiles.push(file);
        await this.removeEmptyParents(path.dirname(absoluteFile), targetRoot);
      }
    }

    if (nextManifest.installs.length === 0) {
      if (await fs.pathExists(manifestFile)) {
        await fs.remove(manifestFile);
      }
      await this.removeEmptyParents(path.dirname(manifestFile), targetRoot);
    } else {
      await fs.writeJson(manifestFile, nextManifest, { spaces: 2 });
    }

    return {
      host: input.host,
      scope: input.scope,
      targetRoot,
      removedFiles: removedFiles.sort(),
      remainingInstalls: nextManifest.installs.length
    };
  }

  async planSync(input: SyncInput): Promise<SyncPlan> {
    const targetRoot = resolveTargetRoot(input.scope, input.currentWorkingDirectory, input.host);
    const manifestFile = path.join(targetRoot, ".looply", "state", "install-manifest.json");
    const manifest = await this.readManifest(manifestFile);

    if (!manifest) {
      throw new Error(`No install manifest found for ${input.host} in ${targetRoot}`);
    }

    const installEntry = manifest.installs.find((entry) => entry.host === input.host && entry.scope === input.scope);
    if (!installEntry) {
      throw new Error(`No install entry found for ${input.host} in ${input.scope} scope`);
    }

    const packClosure = await resolvePackClosure(input.sourceRoot, installEntry.pack);
    const diffs = await Promise.all(
      packClosure.map(async (packName) => {
        const managedBase = path.join(targetRoot, ".looply", "managed", "packs", packName);
        const sourcePackRoot = path.join(input.sourceRoot, "packs", packName);
        return this.diffDirectories(sourcePackRoot, managedBase);
      })
    );
    const diff = {
      addedFiles: diffs.flatMap((entry) => entry.addedFiles),
      changedFiles: diffs.flatMap((entry) => entry.changedFiles),
      removedFiles: diffs.flatMap((entry) => entry.removedFiles)
    };

    return {
      host: input.host,
      scope: input.scope,
      pack: installEntry.pack,
      targetRoot,
      hasUpdates: diff.addedFiles.length > 0 || diff.changedFiles.length > 0 || diff.removedFiles.length > 0,
      addedFiles: diff.addedFiles,
      changedFiles: diff.changedFiles,
      removedFiles: diff.removedFiles
    };
  }

  async doctor(input: DoctorInput): Promise<DoctorReport> {
    const targetRoot = resolveTargetRoot(input.scope, input.currentWorkingDirectory, input.host);
    const manifestFile = path.join(targetRoot, ".looply", "state", "install-manifest.json");
    const executionHintsFile = path.join(targetRoot, ".looply", "state", `execution-hints.${input.host}.json`);
    const workflowPlaybookFile = path.join(targetRoot, ".looply", "state", `workflow-playbook.${input.host}.md`);
    const customRoot = path.join(targetRoot, ".looply", "custom");
    const entrypointFile = path.join(targetRoot, this.entrypointFilename);
    const manifest = await this.readManifest(manifestFile);

    const checks: HostCheck[] = [this.createCommandCheck()];
    checks.push(await this.createCheck("target-root", targetRoot, targetRoot, "Check the target directory and rerun init/install."));
    checks.push(
      await this.createCheck(
        "manifest",
        manifestFile,
        ".looply/state/install-manifest.json",
        `Run looply install --host ${input.host} --scope ${input.scope} to create the manifest.`
      )
    );

    if (!manifest) {
      checks.push({
        label: "install-entry",
        ok: false,
        details: `${input.host}/${input.scope}`,
        recommendation: `Run looply install --host ${input.host} --scope ${input.scope}.`
      });

      return {
        host: input.host,
        scope: input.scope,
        targetRoot,
        checks
      };
    }

    const installEntry = manifest.installs.find((entry) => entry.host === input.host && entry.scope === input.scope);
    checks.push({
      label: "install-entry",
      ok: Boolean(installEntry),
      details: `${input.host}/${input.scope}`,
      recommendation: installEntry ? undefined : `Run looply install --host ${input.host} --scope ${input.scope}.`
    });

    checks.push(
      await this.createCheck(
        "entrypoint",
        entrypointFile,
        this.entrypointFilename,
        `Run looply sync --host ${input.host} --scope ${input.scope}${input.scope === "project" ? ` --dir ${targetRoot}` : ""}.`
      )
    );
    checks.push(
      await this.createCheck(
        "execution-hints",
        executionHintsFile,
        `.looply/state/execution-hints.${input.host}.json`,
        `Run looply sync --host ${input.host} --scope ${input.scope}${input.scope === "project" ? ` --dir ${targetRoot}` : ""}.`
      )
    );
    checks.push(
      await this.createCheck(
        "workflow-playbook",
        workflowPlaybookFile,
        `.looply/state/workflow-playbook.${input.host}.md`,
        `Run looply sync --host ${input.host} --scope ${input.scope}${input.scope === "project" ? ` --dir ${targetRoot}` : ""}.`
      )
    );
    checks.push(
      await this.createCheck(
        "custom-root",
        customRoot,
        ".looply/custom",
        `Create .looply/custom or rerun looply install --host ${input.host}.`
      )
    );

    if (installEntry) {
      const executionHintsValid = await this.validateExecutionHintsFile(executionHintsFile, input.host, installEntry.pack);
      checks.push({
        label: "execution-hints-content",
        ok: executionHintsValid,
        details: `${input.host}/${installEntry.pack}`,
        recommendation: executionHintsValid
          ? undefined
          : `Run looply sync --host ${input.host} --scope ${input.scope}${input.scope === "project" ? ` --dir ${targetRoot}` : ""}.`
      });

      for (const managedFile of installEntry.managedFiles) {
        checks.push(
          await this.createCheck(
            "managed-file",
            path.join(targetRoot, managedFile),
            managedFile,
            `Run looply sync --host ${input.host} --scope ${input.scope}${input.scope === "project" ? ` --dir ${targetRoot}` : ""}.`
          )
        );
      }

      for (const mergeableFile of installEntry.mergeableFiles) {
        checks.push(
          await this.createCheck(
            "mergeable-file",
            path.join(targetRoot, mergeableFile),
            mergeableFile,
            `Run looply sync --host ${input.host} --scope ${input.scope}${input.scope === "project" ? ` --dir ${targetRoot}` : ""}.`
          )
        );
      }
    }

    return {
      host: input.host,
      scope: input.scope,
      targetRoot,
      checks
    };
  }

  private async createCheck(
    label: string,
    absolutePath: string,
    details: string,
    recommendation?: string
  ): Promise<HostCheck> {
    const ok = await fs.pathExists(absolutePath);
    return {
      label,
      ok,
      details,
      recommendation: ok ? undefined : recommendation
    };
  }

  private async createWritableCheck(label: string, absolutePath: string, details: string): Promise<HostCheck> {
    try {
      await fs.access(absolutePath, fsConstants.R_OK | fsConstants.W_OK);
      return {
        label,
        ok: true,
        details
      };
    } catch {
      return {
        label,
        ok: false,
        details,
        recommendation: `Ensure the directory is writable: ${details}`
      };
    }
  }

  private async readManifest(manifestFile: string): Promise<InstallManifest | null> {
    if (!(await fs.pathExists(manifestFile))) {
      return null;
    }

    const rawManifest = await fs.readJson(manifestFile);
    return normalizeInstallManifest(rawManifest);
  }

  private async writeExecutionHints(
    sourceRoot: string,
    executionHintsFile: string,
    host: string,
    pack: string,
    packClosure: string[]
  ): Promise<void> {
    const catalog = await loadArtifactCatalog(sourceRoot);
    const executionHints = buildExecutionHintsDocument({
      host,
      pack,
      artifacts: catalog,
      packClosure
    });

    await fs.writeJson(executionHintsFile, executionHints, { spaces: 2 });
  }

  private async writeWorkflowPlaybook(
    sourceRoot: string,
    workflowPlaybookFile: string,
    host: string,
    pack: string,
    packClosure: string[]
  ): Promise<void> {
    const catalog = await loadArtifactCatalog(sourceRoot);
    const workflowPlaybook = buildWorkflowPlaybookDocument({
      host,
      pack,
      artifacts: catalog,
      packClosure
    });

    await fs.writeFile(workflowPlaybookFile, workflowPlaybook, "utf8");
  }

  private async validateExecutionHintsFile(
    executionHintsFile: string,
    host: string,
    pack: string
  ): Promise<boolean> {
    if (!(await fs.pathExists(executionHintsFile))) {
      return false;
    }

    const content = await fs.readJson(executionHintsFile);
    return content?.host === host && content?.pack === pack && Array.isArray(content?.artifacts);
  }

  private async diffDirectories(
    sourceDirectory: string,
    targetDirectory: string
  ): Promise<{ addedFiles: string[]; changedFiles: string[]; removedFiles: string[] }> {
    const sourceFiles = await this.listFilesRelativeTo(sourceDirectory);
    const targetFiles = await this.listFilesRelativeTo(targetDirectory);
    const sourceSet = new Set(sourceFiles);
    const targetSet = new Set(targetFiles);

    const addedFiles = sourceFiles.filter((file) => !targetSet.has(file));
    const removedFiles = targetFiles.filter((file) => !sourceSet.has(file));
    const changedFiles: string[] = [];

    for (const file of sourceFiles) {
      if (!targetSet.has(file)) {
        continue;
      }

      const [sourceContent, targetContent] = await Promise.all([
        fs.readFile(path.join(sourceDirectory, file), "utf8"),
        fs.readFile(path.join(targetDirectory, file), "utf8")
      ]);

      if (sourceContent !== targetContent) {
        changedFiles.push(file);
      }
    }

    return {
      addedFiles: addedFiles.sort(),
      changedFiles: changedFiles.sort(),
      removedFiles: removedFiles.sort()
    };
  }

  private async listFilesRelativeTo(directory: string): Promise<string[]> {
    if (!(await fs.pathExists(directory))) {
      return [];
    }

    const files = await globby("**/*", {
      cwd: directory,
      onlyFiles: true
    });

    return files
      .map((file) => file.replaceAll("\\", "/"))
      .sort();
  }

  private createCommandCheck(): HostCheck {
    const resolver = process.platform === "win32" ? "where" : "which";
    const result = spawnSync(resolver, [this.commandName], {
      stdio: "ignore"
    });

    return {
      label: "host-command",
      ok: result.status === 0,
      details: this.commandName,
      recommendation: `Install or expose the '${this.commandName}' command in PATH.`
    };
  }

  private renderEntrypoint(input: {
    host: SupportedHost;
    pack: string;
    outputLocale: "en" | "pt-BR";
    projectMode: "existing-project" | "greenfield";
    interactionMode: "guided" | "balanced" | "autonomous";
    iclMode: "on" | "reduced" | "off";
    commands: WorkflowCommandDefinition[];
  }): string {
    const commandLines = input.commands.length === 0
      ? ["- /looply:help [command-name]", "- No workflow aliases were published for this pack."]
      : ["- /looply:help [command-name]", ...input.commands.map((command) => `- /${command.alias} ${command.argumentHint}`.trimEnd())];

    return [
      `# Managed by looply for ${this.hostName}`,
      "",
      "Primary references:",
      `- ./.looply/managed/packs/${input.pack}/pack.md`,
      `- ./.looply/custom/`,
      `- ./.looply/state/workflow-playbook.${this.hostName}.md`,
      `- ./.looply/state/execution-hints.${this.hostName}.json`,
      `- ./.looply/state/example-index.json`,
      `- ./.looply/state/example-hints.${this.hostName}.json`,
      `- ./.looply/state/locale.json`,
      `- ./.looply/state/project-context.json`,
      `- ./.looply/state/context-index.md`,
      `- ./.looply/state/code-context.json`,
      `- ./.looply/state/knowledge-graph.json`,
      `- ./.looply/state/interaction-policy.json`,
      `- ./.looply/custom/project-context.md`,
      `- ./.looply/custom/integrations/integrations-index.md`,
      `- ./.looply/custom/rules/rules-index.md`,
      `- ./.looply/custom/session-context.md`,
      `- ./.looply/custom/session-links.json`,
      `- ./HOST_CONTRACT.md`,
      ...(input.host === "claude" ? ["- ./.claude/LOOPLY_HOOKS.md"] : []),
      ...(input.host === "codex" ? ["- ./LOOPLY_COMMANDS.md"] : []),
      ...(input.host === "opencode" ? ["- ./OPENCODE_COMMANDS.md"] : []),
      ...(input.host === "codex" || input.host === "opencode" ? ["- ./.agents/skills/"] : []),
      "",
      `Default output locale: \`${input.outputLocale}\``,
      `Project mode: \`${input.projectMode}\``,
      `Interaction mode: \`${input.interactionMode}\``,
      `ICL example guidance: \`${input.iclMode}\``,
      "",
      "Invocable workflow aliases:",
      ...commandLines,
      ...(input.host === "codex"
        ? [
            "",
            "Alias policy for Codex:",
            "1. Start with `/skills` and search for `looply` when the user does not know the available workflows.",
            "2. Use the root skill `$looply` as the main discovery and routing entrypoint.",
            "3. Treat `/looply:*` strings as looply workflow aliases even if the Codex slash-command picker does not list them.",
            "4. Open `LOOPLY_COMMANDS.md` when you need the command index and `./.looply/state/commands/codex/` for command-specific help.",
            "5. Prefer the generated Codex skills in `./.agents/skills/` for explicit skill invocation and native skill discovery.",
            "6. Before acting as a specialist, inspect the current agent `knowledge_sources`, especially specialist `best-practices` files.",
            "7. If the current task declares templates or checklists, use them as the default artifact contract and quality bar.",
            "8. When a workflow command references curated examples, use them only for style and quality calibration.",
            "9. If the user writes `/looply:... help`, explain the alias instead of executing it.",
            `10. Generate user-facing outputs in \`${input.outputLocale}\` unless the user explicitly asks for another language.`,
            `11. In \`${input.projectMode}\`, treat the local project root as the default context for feature work unless the user points to another folder.`,
            input.projectMode === "existing-project"
              ? "12. For existing projects, use the real local codebase as the primary source of truth. Use context markdown files only as accelerators when they are filled and current."
              : "12. For greenfield projects, use managed artifacts and explicit assumptions as the primary source until a codebase exists.",
            "13. If project or feature context files are empty, draft, stale or inconsistent, inspect the real codebase before making meaningful decisions.",
            "14. When a feature mentions a known external integration, inspect `.looply/custom/integrations/integrations-index.md` and the corresponding integration context file before making design decisions.",
            `15. Follow \`${input.interactionMode}\` interaction mode to avoid unnecessary repeated clarifications.`,
            "16. When multiple sessions are active, use `.looply/custom/session-links.json` together with `session-label` to bind each session to the correct feature."
          ]
        : []),
      ...(input.host === "opencode"
        ? [
            "",
            "Alias policy for OpenCode:",
            "1. Use the `looply` skill as the main discovery and routing entrypoint.",
            "2. Treat `$looply-*` strings as looply workflow aliases.",
            "3. Open `OPENCODE_COMMANDS.md` when you need the command index and `./.looply/state/commands/opencode/` for command-specific help.",
            "4. Prefer the generated skills in `./.agents/skills/` for explicit skill invocation.",
            "5. Before acting as a specialist, inspect the current agent `knowledge_sources`, especially specialist `best-practices` files.",
            "6. If the current task declares templates or checklists, use them as the default artifact contract and quality bar.",
            "7. When a workflow command references curated examples, use them only for style and quality calibration.",
            "8. If the user writes `$looply-... help`, explain the alias instead of executing it.",
            `9. Generate user-facing outputs in \`${input.outputLocale}\` unless the user explicitly asks for another language.`,
            `10. In \`${input.projectMode}\`, treat the local project root as the default context for feature work unless the user points to another folder.`,
            input.projectMode === "existing-project"
              ? "11. For existing projects, use the real local codebase as the primary source of truth. Use context markdown files only as accelerators when they are filled and current."
              : "11. For greenfield projects, use managed artifacts and explicit assumptions as the primary source until a codebase exists.",
            "12. If project or feature context files are empty, draft, stale or inconsistent, inspect the real codebase before making meaningful decisions.",
            "13. When a feature mentions a known external integration, inspect `.looply/custom/integrations/integrations-index.md` and the corresponding integration context file before making design decisions.",
            `14. Follow \`${input.interactionMode}\` interaction mode to avoid unnecessary repeated clarifications.`,
            "15. When multiple sessions are active, use `.looply/custom/session-links.json` together with `session-label` to bind each session to the correct feature."
          ]
        : []),
      "",
      "Knowledge graph policy:",
      "17. When assessing change impact, module dependencies or database schema, read `.looply/state/knowledge-graph.json` before inspecting individual files. Use `looply refresh-code-context` if the graph is missing or stale.",
      "",
      "Execution order for feature work:",
      "1. Open the workflow playbook first.",
      "2. Check `.looply/state/context-index.md` to understand context priority and validity rules.",
      "3. Follow stages in order and respect blocking gates.",
      "4. Use the managed pack as the canonical process base.",
      "5. Preserve local customizations from `.looply/custom`.",
      "6. Treat execution hints as advisory metadata for cost and context selection.",
      ...(input.host === "claude"
        ? [
            "7. If the user enables Claude hooks for looply tracing, use the generated `.claude/LOOPLY_HOOKS.md` guidance and `.claude/hooks/looply-perf-hook.mjs` helper to record workflow checkpoints locally."
          ]
        : [])
    ].join("\n");
  }

  private async collectManagedFiles(managedBase: string, targetRoot: string): Promise<string[]> {
    const managedFiles = await this.listFilesRelativeTo(managedBase);
    return managedFiles.map((file) => this.toRelativeTargetPath(targetRoot, path.join(managedBase, file)));
  }

  private async writeWorkflowCommands(input: {
    sourceRoot: string;
    targetRoot: string;
    host: SupportedHost;
    pack: string;
    packClosure: string[];
    workflowPlaybookFile: string;
    executionHintsFile: string;
    outputLocale: "en" | "pt-BR";
    projectMode: "existing-project" | "greenfield";
    interactionMode: "guided" | "balanced" | "autonomous";
  }): Promise<{ files: string[]; additionalFiles: string[]; commands: WorkflowCommandDefinition[]; iclMode: "on" | "reduced" | "off" }> {
    const catalog = await loadArtifactCatalog(input.sourceRoot);
    const commands = listWorkflowCommands({
      pack: input.pack,
      artifacts: catalog,
      packClosure: input.packClosure
    });
    const exampleDocuments = await writeExampleDocuments({
      targetRoot: input.targetRoot,
      host: input.host,
      pack: input.pack,
      packClosure: input.packClosure,
      artifacts: catalog,
      outputLocale: input.outputLocale,
      projectMode: input.projectMode,
      interactionMode: input.interactionMode
    });

    const composedContext = await composeContextForWorkflows(input.sourceRoot, catalog, commands);

    if (commands.length === 0) {
      return {
        files: [],
        additionalFiles: [exampleDocuments.indexFile, exampleDocuments.hintsFile],
        commands,
        iclMode: exampleDocuments.effectiveMode
      };
    }

    const commandsRoot = this.resolveWorkflowCommandsRoot(input.targetRoot, input.host);
    const stateTemplateFile = this.resolveManagedFileFromPackClosure(
      input.targetRoot,
      input.packClosure,
      path.join("templates", "workflow-status-template.md")
    );
    await fs.ensureDir(commandsRoot);
    const existingCommandEntries = await fs.readdir(commandsRoot, { withFileTypes: true });
    const staleCommandFiles = existingCommandEntries
      .filter((entry) => entry.isFile() && entry.name.startsWith("looply:") && entry.name.endsWith(".md"))
      .map((entry) => path.join(commandsRoot, entry.name));
    await Promise.all(staleCommandFiles.map((file) => fs.remove(file)));

    const writtenFiles: string[] = [];
    const helpFile = path.join(commandsRoot, "looply:help.md");
    const commandReferences: WorkflowCommandReference[] = [];

    for (const command of commands) {
      const commandFile = path.join(commandsRoot, `${command.alias}.md`);
      const playbookReference = relativePathForDisplay(path.dirname(commandFile), input.workflowPlaybookFile);
      const packReference = relativePathForDisplay(
        path.dirname(commandFile),
        path.join(input.targetRoot, ".looply", "managed", "packs", input.pack, "pack.md")
      );
      const customReference = relativePathForDisplay(
        path.dirname(commandFile),
        path.join(input.targetRoot, ".looply", "custom")
      );
      const hintsReference = relativePathForDisplay(path.dirname(commandFile), input.executionHintsFile);
      const stateTemplateReference = relativePathForDisplay(
        path.dirname(commandFile),
        stateTemplateFile
      );
      const exampleHintsReference = relativePathForDisplay(path.dirname(commandFile), exampleDocuments.hintsFile);
      const exampleReferences = (exampleDocuments.selectedByAlias.get(command.alias) ?? []).map((example) =>
        relativePathForDisplay(
          path.dirname(commandFile),
          path.join(input.targetRoot, ".looply", "managed", "packs", example.pack, example.file)
        )
      );
      const content = input.host === "claude"
        ? renderClaudeWorkflowCommand({
            command,
            outputLocale: input.outputLocale,
            projectMode: input.projectMode,
            interactionMode: input.interactionMode,
            iclMode: exampleDocuments.effectiveMode,
            playbookReference,
            packReference,
            customReference,
            hintsReference,
            stateTemplateReference,
            exampleHintsReference,
            exampleReferences
          })
        : renderCodexWorkflowCommand({
            command,
            outputLocale: input.outputLocale,
            projectMode: input.projectMode,
            interactionMode: input.interactionMode,
            iclMode: exampleDocuments.effectiveMode,
            playbookReference,
            packReference,
            customReference,
            hintsReference,
            stateTemplateReference,
            exampleHintsReference,
            exampleReferences
          });

      await fs.writeFile(commandFile, content, "utf8");
      writtenFiles.push(commandFile);
      commandReferences.push({
        alias: command.alias,
        description: command.description,
        argumentHint: command.argumentHint,
        reference: relativePathForDisplay(path.dirname(helpFile), commandFile)
      });
    }

    const helpContent = renderHelpCommandDocument({
      host: input.host,
      pack: input.pack,
      outputLocale: input.outputLocale,
      projectMode: input.projectMode,
      interactionMode: input.interactionMode,
      commands,
      commandReferences
    });
    await fs.writeFile(helpFile, helpContent, "utf8");
    writtenFiles.push(helpFile);

    const additionalFiles: string[] = [exampleDocuments.indexFile, exampleDocuments.hintsFile];
    if (input.host === "codex" || input.host === "opencode") {
      const indexFileName = input.host === "opencode" ? "OPENCODE_COMMANDS.md" : "LOOPLY_COMMANDS.md";
      const codexIndexFile = path.join(input.targetRoot, indexFileName);
      const codexIndexContent = renderCodexCommandIndex({
        pack: input.pack,
        outputLocale: input.outputLocale,
        projectMode: input.projectMode,
        interactionMode: input.interactionMode,
        commands,
        commandReferences: commandReferences.map((reference) => ({
          ...reference,
          reference: relativePathForDisplay(path.dirname(codexIndexFile), path.join(commandsRoot, `${reference.alias}.md`))
        }))
      });
      await fs.writeFile(codexIndexFile, codexIndexContent, "utf8");
      additionalFiles.push(codexIndexFile);

      const skillFiles = await this.writeCodexSkills({
        targetRoot: input.targetRoot,
        scope: path.basename(input.targetRoot) === ".codex" || path.basename(input.targetRoot) === ".opencode" ? "global" : "project",
        outputLocale: input.outputLocale,
        projectMode: input.projectMode,
        interactionMode: input.interactionMode,
        iclMode: exampleDocuments.effectiveMode,
        pack: input.pack,
        packClosure: input.packClosure,
        commands,
        workflowPlaybookFile: input.workflowPlaybookFile,
        executionHintsFile: input.executionHintsFile,
        exampleHintsFile: exampleDocuments.hintsFile,
        selectedByAlias: exampleDocuments.selectedByAlias,
        composedContext
      });
      additionalFiles.push(...skillFiles);

      const launcherSkillFiles = await this.writeCodexLauncherSkill({
        targetRoot: input.targetRoot,
        scope: path.basename(input.targetRoot) === ".codex" || path.basename(input.targetRoot) === ".opencode" ? "global" : "project",
        outputLocale: input.outputLocale,
        projectMode: input.projectMode,
        interactionMode: input.interactionMode,
        pack: input.pack,
        commands,
        workflowPlaybookFile: input.workflowPlaybookFile,
        hostContractFile: path.join(input.targetRoot, "HOST_CONTRACT.md")
      });
      additionalFiles.push(...launcherSkillFiles);
    }

    return {
      files: writtenFiles,
      additionalFiles,
      commands,
      iclMode: exampleDocuments.effectiveMode
    };
  }

  private resolveWorkflowCommandsRoot(targetRoot: string, host: SupportedHost): string {
    if (host === "claude") {
      const isGlobalRoot = path.basename(targetRoot) === ".claude";
      return isGlobalRoot
        ? path.join(targetRoot, "commands")
        : path.join(targetRoot, ".claude", "commands");
    }

    const isGlobalRoot = path.basename(targetRoot) === ".codex" || path.basename(targetRoot) === ".opencode";
    const commandHostDir = host === "opencode" ? "opencode" : "codex";
    return isGlobalRoot
      ? path.join(targetRoot, "looply", "commands")
      : path.join(targetRoot, ".looply", "state", "commands", commandHostDir);
  }

  private resolveCodexSkillsRoot(targetRoot: string, scope: "project" | "global"): string {
    if (scope === "global") {
      return resolveGlobalCodexSkillsRoot();
    }

    return path.join(targetRoot, ".agents", "skills");
  }

  private resolveManagedFileFromPackClosure(targetRoot: string, packClosure: string[], relativeFile: string): string {
    for (const packName of packClosure) {
      const candidate = path.join(targetRoot, ".looply", "managed", "packs", packName, relativeFile);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return path.join(targetRoot, ".looply", "managed", "packs", packClosure[0] ?? "", relativeFile);
  }

  private async writeClaudePerfHookFiles(targetRoot: string, host: SupportedHost): Promise<string[]> {
    if (host !== "claude") {
      return [];
    }

    const hooksRoot = path.join(targetRoot, ".claude", "hooks");
    const hookScriptFile = path.join(hooksRoot, "looply-perf-hook.mjs");
    const hookGuideFile = path.join(targetRoot, ".claude", "LOOPLY_HOOKS.md");
    const hookSettingsExampleFile = path.join(targetRoot, ".claude", "settings.looply-perf.example.json");

    await fs.ensureDir(hooksRoot);
    await fs.writeFile(hookScriptFile, this.renderClaudePerfHookScript(), "utf8");
    await fs.writeFile(hookGuideFile, this.renderClaudePerfHookGuide(), "utf8");
    await fs.writeFile(hookSettingsExampleFile, this.renderClaudePerfHookSettingsExample(), "utf8");

    return [hookScriptFile, hookGuideFile, hookSettingsExampleFile];
  }

  private renderClaudePerfHookScript(): string {
    return `#!/usr/bin/env node
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
    return \`file:\${input.file_path}\`;
  }
  if (typeof input.command === "string" && input.command !== "") {
    return \`command:\${String(input.command).slice(0, 120)}\`;
  }
  if (typeof input.pattern === "string" && input.pattern !== "") {
    return \`pattern:\${String(input.pattern).slice(0, 120)}\`;
  }
  if (typeof input.path === "string" && input.path !== "") {
    return \`path:\${input.path}\`;
  }

  return "";
}

if (eventName === "user-prompt-submit") {
  const match = prompt.match(/^\\/looply:([^\\s]+)\\s+([^\\s]+)/);
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
    \`looply:\${aliasName}\`,
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
    \`tool:\${toolName}\`,
    "--task",
    toolName,
    "--status",
    "starting",
    "--notes",
    toolSummary || \`Starting tool \${toolName}\`
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
    \`tool:\${toolName}\`,
    "--task",
    toolName,
    "--status",
    "completed",
    "--notes",
    toolSummary || \`Completed tool \${toolName}\`
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
`;
  }

  private renderClaudePerfHookGuide(): string {
    return `# Looply Claude Hooks

Use these files only when you want local workflow tracing while running Claude Code commands such as \`/looply:story-to-production\`.

## What this does

- starts a local workflow trace when a prompt begins with \`/looply:\`
- records intermediate checkpoints for Claude tool execution
- finishes the active trace when Claude stops responding
- writes events to \`.looply/state/perf-workflow-events.jsonl\`

## Requirements

- the \`looply\` CLI must be available in PATH
- set \`LOOPLY_PERF=1\` or \`LOOPLY_PERF=context\` before starting Claude Code
- merge the example config from \`.claude/settings.looply-perf.example.json\` into your active Claude settings file

## Suggested events

- \`UserPromptSubmit\`: starts trace for \`/looply:...\`
- \`PreToolUse\`: records a checkpoint before a Claude tool runs
- \`PostToolUse\`: records a checkpoint after a Claude tool runs
- \`Stop\`: finishes the active trace

## Inspecting the trace

\`\`\`bash
looply perf trace summary --dir .
looply perf trace summary --dir . --json
\`\`\`

## Helper script

- \`.claude/hooks/looply-perf-hook.mjs\`
`;
  }

  private renderClaudePerfHookSettingsExample(): string {
    return `{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \\"$CLAUDE_PROJECT_DIR/.claude/hooks/looply-perf-hook.mjs\\" user-prompt-submit"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \\"$CLAUDE_PROJECT_DIR/.claude/hooks/looply-perf-hook.mjs\\" pre-tool"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \\"$CLAUDE_PROJECT_DIR/.claude/hooks/looply-perf-hook.mjs\\" post-tool"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \\"$CLAUDE_PROJECT_DIR/.claude/hooks/looply-perf-hook.mjs\\" stop"
          }
        ]
      }
    ]
  }
}
`;
  }

  private async writeCodexSkills(input: {
    targetRoot: string;
    scope: "project" | "global";
    outputLocale: "en" | "pt-BR";
    projectMode: "existing-project" | "greenfield";
    interactionMode: "guided" | "balanced" | "autonomous";
    iclMode: "on" | "reduced" | "off";
    pack: string;
    packClosure: string[];
    commands: WorkflowCommandDefinition[];
    workflowPlaybookFile: string;
    executionHintsFile: string;
    exampleHintsFile: string;
    selectedByAlias: Map<string, import("../../lib/example-selection.js").SelectedExample[]>;
    composedContext?: Map<string, ComposedSection[]>;
  }): Promise<string[]> {
    const skillsRoot = this.resolveCodexSkillsRoot(input.targetRoot, input.scope);
    const packRoot = path.join(input.targetRoot, ".looply", "managed", "packs", input.pack);
    const customRoot = path.join(input.targetRoot, ".looply", "custom");
    const stateTemplateFile = this.resolveManagedFileFromPackClosure(
      input.targetRoot,
      input.packClosure,
      path.join("templates", "workflow-status-template.md")
    );
    const skills = listCodexSkills({ commands: input.commands });
    const writtenFiles: string[] = [];

    await fs.ensureDir(skillsRoot);

    for (const skill of skills) {
      const skillRoot = path.join(skillsRoot, skill.name);
      const agentsRoot = path.join(skillRoot, "agents");
      await fs.ensureDir(agentsRoot);

      const skillFile = path.join(skillRoot, "SKILL.md");
      const metadataFile = path.join(agentsRoot, "openai.yaml");

      await fs.writeFile(
        skillFile,
        renderCodexSkillDocument({
          skill,
          outputLocale: input.outputLocale,
          projectMode: input.projectMode,
          interactionMode: input.interactionMode,
          iclMode: input.iclMode,
          playbookReference: relativePathForDisplay(skillRoot, input.workflowPlaybookFile),
          statusContractReference: relativePathForDisplay(skillRoot, path.join(input.targetRoot, ".looply", "state", "host-status-contract.json")),
          packReference: relativePathForDisplay(skillRoot, packRoot),
          customReference: relativePathForDisplay(skillRoot, customRoot),
          hintsReference: relativePathForDisplay(skillRoot, input.executionHintsFile),
          stateTemplateReference: relativePathForDisplay(skillRoot, stateTemplateFile),
          contextIndexReference: relativePathForDisplay(skillRoot, path.join(input.targetRoot, ".looply", "state", "context-index.md")),
          projectContextReference: relativePathForDisplay(skillRoot, path.join(input.targetRoot, ".looply", "custom", "project-context.md")),
          sessionContextReference: relativePathForDisplay(skillRoot, path.join(input.targetRoot, ".looply", "custom", "session-context.md")),
          knowledgeGraphReference: relativePathForDisplay(skillRoot, path.join(input.targetRoot, ".looply", "state", "knowledge-graph.json")),
          exampleHintsReference: relativePathForDisplay(skillRoot, input.exampleHintsFile),
          exampleReferences: (input.selectedByAlias.get(skill.alias) ?? []).map((example) =>
            relativePathForDisplay(
              skillRoot,
              path.join(input.targetRoot, ".looply", "managed", "packs", example.pack, example.file)
            )
          ),
          composedSections: input.composedContext?.get(skill.workflowName)
        }),
        "utf8"
      );
      await fs.writeFile(metadataFile, renderCodexSkillMetadata({ skill }), "utf8");
      writtenFiles.push(skillFile, metadataFile);
    }

    return writtenFiles;
  }

  private async writeCodexLauncherSkill(input: {
    targetRoot: string;
    scope: "project" | "global";
    outputLocale: "en" | "pt-BR";
    projectMode: "existing-project" | "greenfield";
    interactionMode: "guided" | "balanced" | "autonomous";
    pack: string;
    commands: WorkflowCommandDefinition[];
    workflowPlaybookFile: string;
    hostContractFile: string;
  }): Promise<string[]> {
    const skillsRoot = this.resolveCodexSkillsRoot(input.targetRoot, input.scope);
    const skillRoot = path.join(skillsRoot, "looply");
    const agentsRoot = path.join(skillRoot, "agents");
    const skillFile = path.join(skillRoot, "SKILL.md");
    const metadataFile = path.join(agentsRoot, "openai.yaml");
    const commandsIndexFile = path.join(input.targetRoot, "LOOPLY_COMMANDS.md");

    await fs.ensureDir(agentsRoot);
    await fs.writeFile(
      skillFile,
      renderCodexLauncherSkillDocument({
        pack: input.pack,
        outputLocale: input.outputLocale,
        projectMode: input.projectMode,
        interactionMode: input.interactionMode,
        playbookReference: relativePathForDisplay(skillRoot, input.workflowPlaybookFile),
        commandsIndexReference: relativePathForDisplay(skillRoot, commandsIndexFile),
        hostContractReference: relativePathForDisplay(skillRoot, input.hostContractFile),
        statusContractReference: relativePathForDisplay(skillRoot, path.join(input.targetRoot, ".looply", "state", "host-status-contract.json")),
        commands: input.commands
      }),
      "utf8"
    );
    await fs.writeFile(metadataFile, renderCodexLauncherSkillMetadata(), "utf8");

    return [skillFile, metadataFile];
  }

  private toRelativeTargetPath(targetRoot: string, absolutePath: string): string {
    return path.relative(targetRoot, absolutePath).replaceAll("\\", "/");
  }

  private async removeEmptyParents(directory: string, stopAt: string): Promise<void> {
    let current = directory;
    const boundary = path.resolve(stopAt);

    while (current.startsWith(boundary) && current !== boundary) {
      if (!(await fs.pathExists(current))) {
        current = path.dirname(current);
        continue;
      }

      const entries = await fs.readdir(current);
      if (entries.length > 0) {
        return;
      }

      await fs.remove(current);
      current = path.dirname(current);
    }
  }
}
