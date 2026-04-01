export interface LooplyDesktopAPI {
  getTargetRoot: () => Promise<string>
  getSnapshot: () => Promise<ProjectSnapshot | null>
  getFeatures: () => Promise<FeatureControl[]>
  getContext: () => Promise<ContextSnapshot | null>
  getSessions: () => Promise<SessionLinks | null>
  getHistory: () => Promise<UpgradeHistory | null>
  getManifest: () => Promise<InstallManifest | null>
  getLocale: () => Promise<LocaleDoc | null>
  getInteractionPolicy: () => Promise<InteractionPolicyDoc | null>
  getFeatureControl: (feature: string) => Promise<FeatureControl | null>
  getProjectContext: () => Promise<ProjectContextDoc | null>
  getCatalog: () => Promise<CatalogArtifact[]>
  getPackDefinitions: () => Promise<PackDefinition[]>
  checkHostAvailable: (cmd: string) => Promise<boolean>
  getArtifactDetail: (file: string) => Promise<ArtifactDetail | null>
  createFeature: (opts: { feature: string; workflow: string }) => Promise<{ feature: string; dir: string }>
  getIntegrations: () => Promise<IntegrationContext[]>
  validate: () => Promise<ValidationReport>
  getSyncPlan: () => Promise<SyncPlan>
  setLocale: (locale: string) => Promise<{ ok: boolean }>
  setInteractionMode: (mode: string) => Promise<{ ok: boolean }>
  onStateChanged: (callback: (data: { event: string; file: string }) => void) => () => void
  pty: {
    create: (opts: { id: string; shell?: string; cwd?: string }) => Promise<{ id: string; pid: number }>
    write: (id: string, data: string) => void
    resize: (id: string, cols: number, rows: number) => void
    kill: (id: string) => Promise<void>
    onData: (id: string, callback: (data: string) => void) => () => void
    onExit: (id: string, callback: (code: number) => void) => () => void
  }
}

export interface ProjectSnapshot {
  version: number
  generatedAt: string
  targetRoot: string
  summary: {
    installCount: number
    featureCount: number
    blockedFeatureCount: number
    readyFeatureCount: number
    interventionCount: number
    replayedFeatureCount: number
    sessionCount: number
    historyCount: number
  }
  project: {
    installed: boolean
    locale: string
    projectMode: string
    interactionMode: string
    primaryContextRoot: string
    inferencePolicy: string
  }
  installation: {
    installs: Array<{
      host: string
      scope: string
      pack: string
      managedFiles: number
      mergeableFiles: number
      customFiles: number
    }>
  }
  hosts: Array<{
    host: string
    scope: string
    pack: string
    workflowCount: number
    aliases: string[]
  }>
  context: {
    snapshot: ContextSnapshot | null
    snapshotFile: string
    indexFile: string
    projectContextFile: string
    architectureContextFile: string
    projectInventoryFile: string
  }
  sessions: SessionEntry[]
  features: FeatureState[]
  history: HistoryEntry[]
}

export interface ContextSnapshot {
  version: number
  generatedAt: string
  targetRoot: string
  primaryContextRoot: string
  projectMode: string
  outputLocale: string
  interactionMode: string
  inferencePolicy: string
  contextStatus: string
  contextCoverage: string
  lastValidatedAt: string
  repositorySummary: string[]
  languages: string[]
  frameworks: string[]
  keyDirectories: string[]
  moduleHints: string[]
  integrationHints: string[]
  apiSignals: string[]
  dataSignals: string[]
  authSignals: string[]
  messagingSignals: string[]
  observabilitySignals: string[]
  automationSignals: string[]
}

export interface FeatureState {
  feature: string
  workflow: string
  phase: string
  currentStage: string
  currentGate: string
  gateStatus: string
  activeArtifact: string
  nextAgent: string
  nextTask: string
  nextCommand: string
  executionMode: string
  blockedBy: string[]
  missingOutputs: string[]
  completedOutputs: string[]
  interventionCount: number
  lastUpdated: string
}

export interface FeatureControl {
  version: number
  feature: string
  workflow: string
  executionMode: string
  replayedFrom: string
  supersededOutputs: string[]
  recommendedRecoveryCommand: string
  recommendedRecoveryWorkflow: string
  updatedAt: string
  lastReconciledAt: string
  interventions: InterventionEntry[]
}

export interface InterventionEntry {
  id: string
  type: string
  createdAt: string
  summary: string
  reason: string
  agent: string
  task: string
  checkpoint: string
  command: string
  notes: string[]
  supersededOutputs: string[]
}

export interface SessionLinks {
  version: number
  sessions: SessionEntry[]
}

export interface SessionEntry {
  label: string
  feature: string
  workflow?: string
  lastCommand?: string
  lastUpdatedAt?: string
}

export interface UpgradeHistory {
  version: number
  entries: HistoryEntry[]
}

export interface HistoryEntry {
  timestamp: string
  action: string
  host: string
  scope: string
  pack: string
  impacts: string[]
  artifactChanges: { added: number; updated: number; removed: number }
}

export interface InstallManifest {
  version: number
  installs: Array<{
    host: string
    scope: string
    pack: string
    locale: string
    projectMode: string
    interactionMode: string
    installedAt: string
    updatedAt: string
    managedFiles: string[]
    mergeableFiles: string[]
    customFiles: string[]
  }>
}

export interface LocaleDoc {
  locale: string
}

export interface InteractionPolicyDoc {
  mode: string
}

export interface ProjectContextDoc {
  projectMode: string
  inferencePolicy: string
}

export interface CatalogArtifact {
  type: string
  name: string
  file: string
  pack: string
  summary?: string
  frontmatter: Record<string, unknown>
}

export interface PackDefinition {
  name: string
  file: string
  summary?: string
  domains?: string[]
  includes?: string[]
  frontmatter: Record<string, unknown>
}

export interface ArtifactDetail {
  type: string
  name: string
  file: string
  frontmatter: Record<string, unknown>
  body: string
}

export interface ValidationReport {
  ok: boolean
  issues: Array<{ severity: string; file: string; message: string }>
  total: number
}

export interface SyncPlan {
  installs: Array<{
    host: string; scope: string; pack: string
    managedFiles: number; mergeableFiles: number; customFiles: number
    locale: string; updatedAt: string
  }>
  available: number
}

export interface IntegrationContext {
  name: string
  file: string
  category: string
  status: string
  coverage: string
  owner: string
  touchpoints: string[]
  frontmatter: Record<string, unknown>
}

declare global {
  interface Window {
    api: LooplyDesktopAPI
  }
}
