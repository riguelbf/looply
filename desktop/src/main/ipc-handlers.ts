import { ipcMain } from 'electron'
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from 'fs'
import { join, relative, dirname, basename } from 'path'

function readJsonState(targetRoot: string, relativePath: string): unknown | null {
  const filePath = join(targetRoot, '.looply', relativePath)
  if (!existsSync(filePath)) return null
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { frontmatter: {}, body: content }

  const yamlBlock = match[1]
  const body = match[2]

  // Simple YAML parser for flat/shallow structures
  const frontmatter: Record<string, unknown> = {}
  let currentKey = ''
  let currentList: string[] | null = null

  for (const line of yamlBlock.split('\n')) {
    const trimmed = line.trimEnd()
    if (!trimmed || trimmed.startsWith('#')) continue

    if (trimmed.startsWith('  - ') && currentKey) {
      if (!currentList) currentList = []
      currentList.push(trimmed.replace(/^\s+-\s*/, ''))
      frontmatter[currentKey] = currentList
      continue
    }

    if (currentList) currentList = null

    const kvMatch = trimmed.match(/^(\w[\w_]*)\s*:\s*(.*)$/)
    if (kvMatch) {
      currentKey = kvMatch[1]
      const val = kvMatch[2].trim()
      if (val) {
        frontmatter[currentKey] = val
      }
      continue
    }

    // Nested key (indented) — parse as sub-object entry
    const nestedMatch = trimmed.match(/^\s+(\w[\w_]*)\s*:\s*(.*)$/)
    if (nestedMatch && currentKey) {
      const existing = frontmatter[currentKey]
      const obj = (typeof existing === 'object' && !Array.isArray(existing) && existing !== null) ? existing as Record<string, unknown> : {}
      obj[nestedMatch[1]] = nestedMatch[2].trim() || true
      frontmatter[currentKey] = obj
    }
  }

  return { frontmatter, body }
}

interface CatalogArtifact {
  type: string
  name: string
  file: string
  pack: string
  summary?: string
  frontmatter: Record<string, unknown>
}

function inferArtifactType(relativePath: string): string | null {
  const parts = relativePath.split('/')
  const dir = parts.length >= 2 ? parts[parts.length - 2] : ''
  const typeMap: Record<string, string> = {
    agents: 'agent', tasks: 'task', workflows: 'workflow',
    knowledge: 'knowledge', checklists: 'checklist', templates: 'template'
  }
  return typeMap[dir] ?? null
}

function scanPackArtifacts(packsRoot: string): CatalogArtifact[] {
  if (!existsSync(packsRoot)) return []
  const artifacts: CatalogArtifact[] = []

  try {
    const packs = readdirSync(packsRoot, { withFileTypes: true })
    for (const packDir of packs) {
      if (!packDir.isDirectory()) continue
      const packPath = join(packsRoot, packDir.name)
      const subdirs = ['agents', 'tasks', 'workflows', 'knowledge', 'checklists', 'templates']

      for (const subdir of subdirs) {
        const dirPath = join(packPath, subdir)
        if (!existsSync(dirPath)) continue
        try {
          const files = readdirSync(dirPath).filter((f) => f.endsWith('.md'))
          for (const file of files) {
            const filePath = join(dirPath, file)
            try {
              const content = readFileSync(filePath, 'utf-8')
              const { frontmatter } = parseFrontmatter(content)
              const type = inferArtifactType(`${subdir}/${file}`)
              if (!type) continue
              artifacts.push({
                type,
                name: (frontmatter.name as string) || file.replace('.md', ''),
                file: relative(packsRoot, filePath),
                pack: packDir.name,
                summary: (frontmatter.summary as string) || (frontmatter.role as string) || (frontmatter.mission as string) || '',
                frontmatter
              })
            } catch { /* skip unreadable */ }
          }
        } catch { /* skip unreadable dir */ }
      }
    }
  } catch { /* skip if packs root unreadable */ }

  return artifacts
}

interface PackDefinition {
  name: string
  file: string
  summary?: string
  domains?: string[]
  includes?: string[]
  frontmatter: Record<string, unknown>
}

function scanPackDefinitions(packsRoot: string): PackDefinition[] {
  if (!existsSync(packsRoot)) return []
  const defs: PackDefinition[] = []

  try {
    const packs = readdirSync(packsRoot, { withFileTypes: true })
    for (const packDir of packs) {
      if (!packDir.isDirectory()) continue
      const packFile = join(packsRoot, packDir.name, 'pack.md')
      if (!existsSync(packFile)) {
        defs.push({ name: packDir.name, file: `${packDir.name}/pack.md`, frontmatter: {} })
        continue
      }
      try {
        const content = readFileSync(packFile, 'utf-8')
        const { frontmatter } = parseFrontmatter(content)
        const includes = frontmatter.includes
        let packIncludes: string[] = []
        if (typeof includes === 'object' && includes !== null) {
          const packs = (includes as Record<string, unknown>).packs
          if (Array.isArray(packs)) packIncludes = packs as string[]
        }
        defs.push({
          name: (frontmatter.name as string) || packDir.name,
          file: `${packDir.name}/pack.md`,
          summary: (frontmatter.summary as string) || '',
          domains: Array.isArray(frontmatter.domains) ? frontmatter.domains as string[] : [],
          includes: packIncludes,
          frontmatter
        })
      } catch {
        defs.push({ name: packDir.name, file: `${packDir.name}/pack.md`, frontmatter: {} })
      }
    }
  } catch { /* skip */ }

  return defs
}

function readAllFeatureStates(targetRoot: string): unknown[] {
  const featuresDir = join(targetRoot, '.looply', 'custom', 'features')
  if (!existsSync(featuresDir)) return []

  const { readdirSync } = require('fs')
  const features: unknown[] = []

  try {
    const dirs = readdirSync(featuresDir, { withFileTypes: true })
    for (const dir of dirs) {
      if (!dir.isDirectory()) continue
      const controlFile = join(featuresDir, dir.name, 'workflow-control.json')
      if (existsSync(controlFile)) {
        try {
          const data = JSON.parse(readFileSync(controlFile, 'utf-8'))
          features.push({ ...data, feature: dir.name })
        } catch {
          // skip malformed
        }
      }
    }
  } catch {
    // skip if dir unreadable
  }

  return features
}

function resolvePacksRoot(targetRoot: string): string {
  // Look for packs/ relative to the project, then up the tree
  let dir = targetRoot
  for (let i = 0; i < 5; i++) {
    const candidate = join(dir, 'packs')
    if (existsSync(candidate)) return candidate
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return join(targetRoot, 'packs')
}

export function registerIpcHandlers(targetRoot: string): void {
  const packsRoot = resolvePacksRoot(targetRoot)

  ipcMain.handle('looply:target-root', () => targetRoot)

  ipcMain.handle('looply:snapshot', () => {
    // Read static snapshot as base
    const snapshot = readJsonState(targetRoot, 'state/project-snapshot.json') as any ?? {
      version: 2, generatedAt: new Date().toISOString(), targetRoot,
      summary: { installCount: 0, featureCount: 0, blockedFeatureCount: 0, readyFeatureCount: 0, interventionCount: 0, replayedFeatureCount: 0, sessionCount: 0, historyCount: 0 },
      project: { installed: false, locale: 'en', projectMode: '', interactionMode: '', primaryContextRoot: '', inferencePolicy: '' },
      installation: { installs: [] }, hosts: [], context: { snapshot: null }, sessions: [], features: [], history: []
    }

    // Enrich with live data from filesystem
    const liveFeatures = readAllFeatureStates(targetRoot)
    if (liveFeatures.length > 0) {
      snapshot.features = liveFeatures
      snapshot.summary.featureCount = liveFeatures.length
      snapshot.summary.interventionCount = liveFeatures.reduce((sum: number, f: any) => sum + (f.interventions?.length ?? 0), 0)
    }

    // Live sessions
    const sessions = readJsonState(targetRoot, 'custom/session-links.json') as any
    if (sessions?.sessions) {
      snapshot.sessions = sessions.sessions
      snapshot.summary.sessionCount = sessions.sessions.length
    }

    // Live manifest
    const manifest = readJsonState(targetRoot, 'state/install-manifest.json') as any
    if (manifest?.installs) {
      snapshot.installation = { installs: manifest.installs }
      snapshot.summary.installCount = manifest.installs.length
      snapshot.project.installed = manifest.installs.length > 0
      snapshot.hosts = manifest.installs.map((i: any) => ({
        host: i.host, scope: i.scope, pack: i.pack,
        workflowCount: 0, aliases: []
      }))
    }

    // Live locale/policy
    const locale = readJsonState(targetRoot, 'state/locale.json') as any
    if (locale?.locale) snapshot.project.locale = locale.locale

    const policy = readJsonState(targetRoot, 'state/interaction-policy.json') as any
    if (policy?.mode) snapshot.project.interactionMode = policy.mode

    const ctx = readJsonState(targetRoot, 'state/project-context.json') as any
    if (ctx?.projectMode) snapshot.project.projectMode = ctx.projectMode
    if (ctx?.inferencePolicy) snapshot.project.inferencePolicy = ctx.inferencePolicy

    return snapshot
  })

  ipcMain.handle('looply:context', () => {
    return readJsonState(targetRoot, 'state/context-snapshot.json')
  })

  ipcMain.handle('looply:sessions', () => {
    return readJsonState(targetRoot, 'custom/session-links.json')
  })

  ipcMain.handle('looply:history', () => {
    return readJsonState(targetRoot, 'state/upgrade-history.json')
  })

  ipcMain.handle('looply:manifest', () => {
    return readJsonState(targetRoot, 'state/install-manifest.json')
  })

  ipcMain.handle('looply:locale', () => {
    return readJsonState(targetRoot, 'state/locale.json')
  })

  ipcMain.handle('looply:interaction-policy', () => {
    return readJsonState(targetRoot, 'state/interaction-policy.json')
  })

  ipcMain.handle('looply:features', () => {
    return readAllFeatureStates(targetRoot)
  })

  ipcMain.handle('looply:feature-control', (_event, feature: string) => {
    return readJsonState(targetRoot, `custom/features/${feature}/workflow-control.json`)
  })

  ipcMain.handle('looply:project-context', () => {
    return readJsonState(targetRoot, 'state/project-context.json')
  })

  ipcMain.handle('looply:catalog', () => {
    return scanPackArtifacts(packsRoot)
  })

  ipcMain.handle('looply:pack-definitions', () => {
    return scanPackDefinitions(packsRoot)
  })

  ipcMain.handle('looply:artifact-detail', (_event, artifactFile: string) => {
    const filePath = join(packsRoot, artifactFile)
    if (!existsSync(filePath)) return null
    try {
      const content = readFileSync(filePath, 'utf-8')
      const { frontmatter, body } = parseFrontmatter(content)
      const type = inferArtifactType(artifactFile)
      return {
        type,
        name: (frontmatter.name as string) || basename(filePath, '.md'),
        file: artifactFile,
        frontmatter,
        body
      }
    } catch {
      return null
    }
  })

  ipcMain.handle('looply:create-feature', (_event, opts: { feature: string; workflow: string }) => {
    console.log('[create-feature] opts:', JSON.stringify(opts))
    if (!opts?.feature) {
      console.error('[create-feature] ERROR: no feature name provided')
      return { feature: '', dir: '' }
    }
    const featureDir = join(targetRoot, '.looply', 'custom', 'features', opts.feature)
    mkdirSync(featureDir, { recursive: true })

    // Create workflow-status.md
    const statusFile = join(featureDir, 'workflow-status.md')
    if (!existsSync(statusFile)) {
      const now = new Date().toISOString()
      writeFileSync(statusFile, `---
feature: ${opts.feature}
workflow: ${opts.workflow}
phase: discovery
currentStage: ""
currentGate: ""
gateStatus: pending
activeArtifact: ""
nextAgent: pm-analyst
nextTask: requirement-analysis
nextCommand: "looply run-agent ${opts.feature} pm-analyst --task requirement-analysis"
host: ""
projectMode: ""
contextStatus: ""
contextCoverage: ""
executionMode: workflow
lastUpdated: "${now}"
---

# Feature: ${opts.feature}

Workflow: ${opts.workflow}
Created: ${now}
`)
    }

    // Create workflow-control.json
    const controlFile = join(featureDir, 'workflow-control.json')
    if (!existsSync(controlFile)) {
      writeFileSync(controlFile, JSON.stringify({
        version: 1,
        feature: opts.feature,
        workflow: opts.workflow,
        executionMode: 'workflow',
        replayedFrom: '',
        supersededOutputs: [],
        recommendedRecoveryCommand: '',
        recommendedRecoveryWorkflow: '',
        updatedAt: new Date().toISOString(),
        lastReconciledAt: '',
        interventions: []
      }, null, 2))
    }

    return { feature: opts.feature, dir: featureDir }
  })

  ipcMain.handle('looply:integrations', () => {
    // Scan for integration markdown files in .looply/custom/integrations/
    const intDir = join(targetRoot, '.looply', 'custom', 'integrations')
    if (!existsSync(intDir)) return []

    const results: unknown[] = []
    try {
      const files = readdirSync(intDir).filter(f => f.endsWith('.md') && f !== 'integrations-index.md' && f !== 'README.md')
      for (const file of files) {
        try {
          const content = readFileSync(join(intDir, file), 'utf-8')
          const { frontmatter } = parseFrontmatter(content)
          results.push({
            name: (frontmatter.name as string) || file.replace('.md', ''),
            file,
            category: (frontmatter.category as string) || '',
            status: (frontmatter.status as string) || 'draft',
            coverage: (frontmatter.coverage as string) || 'none',
            owner: (frontmatter.owner as string) || '',
            touchpoints: Array.isArray(frontmatter.touchpoints) ? frontmatter.touchpoints : [],
            frontmatter
          })
        } catch { /* skip */ }
      }
    } catch { /* skip */ }

    return results
  })

  ipcMain.handle('looply:validate', () => {
    // Lightweight validation: check each artifact has required frontmatter fields
    const requiredFields: Record<string, string[]> = {
      agent: ['schema', 'name', 'role'],
      task: ['schema', 'name'],
      workflow: ['schema', 'name', 'phase'],
      knowledge: ['schema', 'name'],
      pack: ['schema', 'name']
    }

    const issues: Array<{ severity: string; file: string; message: string }> = []
    const artifacts = scanPackArtifacts(packsRoot)

    for (const art of artifacts) {
      const required = requiredFields[art.type] ?? ['schema', 'name']
      for (const field of required) {
        if (!art.frontmatter[field]) {
          issues.push({ severity: 'error', file: art.file, message: `Missing required field: ${field}` })
        }
      }
      // Check schema format
      const schema = art.frontmatter.schema as string
      if (schema && !schema.startsWith('looply/')) {
        issues.push({ severity: 'warning', file: art.file, message: `Schema should start with "looply/": got "${schema}"` })
      }
    }

    return { ok: issues.filter(i => i.severity === 'error').length === 0, issues, total: artifacts.length }
  })

  ipcMain.handle('looply:sync-plan', () => {
    // Read manifest to show what's installed and sync state
    const manifest = readJsonState(targetRoot, 'state/install-manifest.json') as any
    if (!manifest?.installs?.length) return { installs: [], available: 0 }

    const plan = manifest.installs.map((inst: any) => ({
      host: inst.host,
      scope: inst.scope,
      pack: inst.pack,
      managedFiles: inst.managedFiles?.length ?? 0,
      mergeableFiles: inst.mergeableFiles?.length ?? 0,
      customFiles: inst.customFiles?.length ?? 0,
      locale: inst.locale,
      updatedAt: inst.updatedAt
    }))

    return { installs: plan, available: scanPackDefinitions(packsRoot).length }
  })

  ipcMain.handle('looply:set-locale', (_event, locale: string) => {
    const stateDir = join(targetRoot, '.looply', 'state')
    mkdirSync(stateDir, { recursive: true })
    const file = join(stateDir, 'locale.json')
    writeFileSync(file, JSON.stringify({ locale }, null, 2))
    return { ok: true, locale }
  })

  ipcMain.handle('looply:set-interaction-mode', (_event, mode: string) => {
    const stateDir = join(targetRoot, '.looply', 'state')
    mkdirSync(stateDir, { recursive: true })
    const file = join(stateDir, 'interaction-policy.json')
    writeFileSync(file, JSON.stringify({ mode }, null, 2))
    return { ok: true, mode }
  })
}
