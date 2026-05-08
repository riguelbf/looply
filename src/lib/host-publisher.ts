export type InstallScope = "project" | "global";
export type SupportedHost = "codex" | "claude" | "opencode";
export type OutputLocale = "en" | "pt-BR";
export type ProjectMode = "existing-project" | "greenfield";
export type InteractionMode = "guided" | "balanced" | "autonomous";
export const supportedHosts: SupportedHost[] = ["codex", "claude", "opencode"];
export const supportedLocales: OutputLocale[] = ["en", "pt-BR"];
export const supportedProjectModes: ProjectMode[] = ["existing-project", "greenfield"];
export const supportedInteractionModes: InteractionMode[] = ["guided", "balanced", "autonomous"];

export interface InstallInput {
  host: SupportedHost;
  scope: InstallScope;
  pack: string;
  locale: OutputLocale;
  projectMode: ProjectMode;
  interactionMode: InteractionMode;
  sourceRoot: string;
  currentWorkingDirectory: string;
  /** Project-specific rules collected during installation */
  rules?: { category: string; content: string }[];
}

export interface InstallResult {
  host: SupportedHost;
  scope: InstallScope;
  pack: string;
  targetRoot: string;
  entrypointFile: string;
  manifestFile: string;
  executionHintsFile: string;
  workflowPlaybookFile: string;
  localeFile: string;
  projectContextFile: string;
  interactionPolicyFile: string;
}

export interface SyncInput {
  host: SupportedHost;
  scope: InstallScope;
  sourceRoot: string;
  currentWorkingDirectory: string;
}

export interface SyncPlan {
  host: SupportedHost;
  scope: InstallScope;
  pack: string;
  targetRoot: string;
  hasUpdates: boolean;
  addedFiles: string[];
  changedFiles: string[];
  removedFiles: string[];
}

export interface SyncResult {
  host: SupportedHost;
  scope: InstallScope;
  pack: string;
  targetRoot: string;
  manifestFile: string;
  addedFiles: string[];
  changedFiles: string[];
  removedFiles: string[];
}

export interface UninstallInput {
  host: SupportedHost;
  scope: InstallScope;
  currentWorkingDirectory: string;
}

export interface DoctorInput {
  host: SupportedHost;
  scope: InstallScope;
  currentWorkingDirectory: string;
}

export interface HostCheck {
  label: string;
  ok: boolean;
  details: string;
  recommendation?: string;
}

export interface PreflightInput {
  host: SupportedHost;
  scope: InstallScope;
  pack: string;
  sourceRoot: string;
  currentWorkingDirectory: string;
}

export interface PreflightReport {
  host: SupportedHost;
  scope: InstallScope;
  targetRoot: string;
  checks: HostCheck[];
}

export interface DoctorReport {
  host: SupportedHost;
  scope: InstallScope;
  targetRoot: string;
  checks: HostCheck[];
}

export interface HostPublisher {
  readonly hostName: SupportedHost;
  readonly commandName: string;
  preflight(input: PreflightInput): Promise<PreflightReport>;
  install(input: InstallInput): Promise<InstallResult>;
  planSync(input: SyncInput): Promise<SyncPlan>;
  sync(input: SyncInput): Promise<SyncResult>;
  uninstall(input: UninstallInput): Promise<import("./publishing-model.js").UninstallResult>;
  doctor(input: DoctorInput): Promise<DoctorReport>;
}
