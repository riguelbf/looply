import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Looply data queries
  getTargetRoot: (): Promise<string> => ipcRenderer.invoke('looply:target-root'),
  getSnapshot: (): Promise<unknown> => ipcRenderer.invoke('looply:snapshot'),
  getFeatures: (): Promise<unknown[]> => ipcRenderer.invoke('looply:features'),
  getContext: (): Promise<unknown> => ipcRenderer.invoke('looply:context'),
  getSessions: (): Promise<unknown> => ipcRenderer.invoke('looply:sessions'),
  getHistory: (): Promise<unknown> => ipcRenderer.invoke('looply:history'),
  getManifest: (): Promise<unknown> => ipcRenderer.invoke('looply:manifest'),
  getLocale: (): Promise<unknown> => ipcRenderer.invoke('looply:locale'),
  getInteractionPolicy: (): Promise<unknown> => ipcRenderer.invoke('looply:interaction-policy'),
  getFeatureControl: (feature: string): Promise<unknown> =>
    ipcRenderer.invoke('looply:feature-control', feature),
  getProjectContext: (): Promise<unknown> => ipcRenderer.invoke('looply:project-context'),
  getCatalog: (): Promise<unknown[]> => ipcRenderer.invoke('looply:catalog'),
  getPackDefinitions: (): Promise<unknown[]> => ipcRenderer.invoke('looply:pack-definitions'),
  checkHostAvailable: (cmd: string): Promise<boolean> => ipcRenderer.invoke('host:check-available', cmd),
  getArtifactDetail: (file: string): Promise<unknown> => ipcRenderer.invoke('looply:artifact-detail', file),
  createFeature: (opts: { feature: string; workflow: string }): Promise<{ feature: string; dir: string }> =>
    ipcRenderer.invoke('looply:create-feature', opts),
  getIntegrations: (): Promise<unknown[]> => ipcRenderer.invoke('looply:integrations'),
  validate: (): Promise<unknown> => ipcRenderer.invoke('looply:validate'),
  getSyncPlan: (): Promise<unknown> => ipcRenderer.invoke('looply:sync-plan'),
  setLocale: (locale: string): Promise<{ ok: boolean }> => ipcRenderer.invoke('looply:set-locale', locale),
  setInteractionMode: (mode: string): Promise<{ ok: boolean }> => ipcRenderer.invoke('looply:set-interaction-mode', mode),

  // State change listener
  onStateChanged: (callback: (data: { event: string; file: string }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { event: string; file: string }): void =>
      callback(data)
    ipcRenderer.on('looply:state-changed', handler)
    return () => {
      ipcRenderer.removeListener('looply:state-changed', handler)
    }
  },

  // PTY management
  pty: {
    create: (opts: { id: string; shell?: string; cwd?: string }): Promise<{ id: string; pid: number }> =>
      ipcRenderer.invoke('pty:create', opts),
    write: (id: string, data: string): void => {
      ipcRenderer.send('pty:write', id, data)
    },
    resize: (id: string, cols: number, rows: number): void => {
      ipcRenderer.send('pty:resize', id, cols, rows)
    },
    kill: (id: string): Promise<void> => ipcRenderer.invoke('pty:kill', id),
    onData: (id: string, callback: (data: string) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: string): void => callback(data)
      ipcRenderer.on(`pty:data:${id}`, handler)
      return () => {
        ipcRenderer.removeListener(`pty:data:${id}`, handler)
      }
    },
    onExit: (id: string, callback: (code: number) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, code: number): void => callback(code)
      ipcRenderer.on(`pty:exit:${id}`, handler)
      return () => {
        ipcRenderer.removeListener(`pty:exit:${id}`, handler)
      }
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
