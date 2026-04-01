import { useCallback, useMemo } from 'react'
import { useLooplyData } from '../../hooks/useLooplyData'
import { useTerminalWriter } from '../../hooks/useTerminalWriter'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { EmptyState } from '../shared/EmptyState'
import { Package, Download, Trash2, RefreshCw, ArrowUpCircle } from 'lucide-react'
import type { PackDefinition, CatalogArtifact, InstallManifest } from '../../../../preload/types'

export function PackListPage(): JSX.Element {
  const packsFetcher = useCallback(() => window.api.getPackDefinitions() as Promise<PackDefinition[]>, [])
  const catalogFetcher = useCallback(() => window.api.getCatalog() as Promise<CatalogArtifact[]>, [])
  const manifestFetcher = useCallback(() => window.api.getManifest() as Promise<InstallManifest | null>, [])
  const { data: packs, loading } = useLooplyData(packsFetcher)
  const { data: catalog } = useLooplyData(catalogFetcher)
  const { data: manifest } = useLooplyData(manifestFetcher)
  const { writeCommand } = useTerminalWriter()

  const installedPackNames = useMemo(() => {
    const names = new Set<string>()
    manifest?.installs?.forEach(i => names.add(i.pack))
    return names
  }, [manifest])

  const installedPacks = useMemo(() => packs?.filter(p => installedPackNames.has(p.name)) ?? [], [packs, installedPackNames])
  const availablePacks = useMemo(() => packs?.filter(p => !installedPackNames.has(p.name)) ?? [], [packs, installedPackNames])

  const countByPack = (packName: string, type: string): number =>
    catalog?.filter(a => a.pack === packName && a.type === type).length ?? 0

  if (loading) return <div className="text-slate-400 text-sm p-8">Loading packs...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Packs</h1>
        <div className="flex gap-2">
          <button
            onClick={() => writeCommand('looply check-updates\n')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium hover:bg-slate-100"
          >
            <ArrowUpCircle size={14} /> Check Updates
          </button>
          <button
            onClick={() => writeCommand('looply upgrade --yes\n')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-semibold hover:opacity-90"
          >
            <RefreshCw size={14} /> Upgrade All
          </button>
        </div>
      </div>

      {/* Installed Packs */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          Installed ({installedPacks.length})
        </h2>
        {installedPacks.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              title="No packs installed"
              description="Install a pack to start using workflows and agents"
              action={{ label: 'Install Pack', onClick: () => writeCommand('looply install\n') }}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {installedPacks.map(p => {
              const inst = manifest?.installs?.find(i => i.pack === p.name)
              return (
                <Card key={p.name} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Package size={18} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{p.name}</span>
                        <Badge variant="success">installed</Badge>
                      </div>
                      {p.summary && <div className="text-[10px] text-slate-500 mt-0.5">{p.summary}</div>}
                      {inst && (
                        <div className="text-[9px] text-slate-400 mt-1">
                          Host: {inst.host} | Scope: {inst.scope} | {inst.managedFiles?.length ?? 0} files
                        </div>
                      )}
                      <div className="flex gap-3 mt-1.5 text-[10px] text-slate-400">
                        <span>{countByPack(p.name, 'workflow')} workflows</span>
                        <span>{countByPack(p.name, 'agent')} agents</span>
                        <span>{countByPack(p.name, 'task')} tasks</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => writeCommand(`looply reinstall --pack ${p.name} --yes\n`)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
                        >
                          <RefreshCw size={10} /> Reinstall
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Uninstall pack "${p.name}"? This will remove all managed files.`)) {
                              writeCommand(`looply uninstall --pack ${p.name} --yes\n`)
                            }
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-red-600 bg-red-50 hover:bg-red-100"
                        >
                          <Trash2 size={10} /> Uninstall
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Available Packs */}
      {availablePacks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            Available ({availablePacks.length})
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {availablePacks.map(p => (
              <Card key={p.name} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Package size={18} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                    {p.summary && <div className="text-[10px] text-slate-500 mt-0.5">{p.summary}</div>}
                    {p.domains && p.domains.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {p.domains.map(d => <Badge key={d} variant="info">{d}</Badge>)}
                      </div>
                    )}
                    {p.includes && p.includes.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        <span className="text-[9px] text-slate-400">includes:</span>
                        {p.includes.map(i => <Badge key={i} variant="purple">{i}</Badge>)}
                      </div>
                    )}
                    <div className="flex gap-3 mt-1.5 text-[10px] text-slate-400">
                      <span>{countByPack(p.name, 'workflow')} workflows</span>
                      <span>{countByPack(p.name, 'agent')} agents</span>
                      <span>{countByPack(p.name, 'task')} tasks</span>
                    </div>
                    <button
                      onClick={() => writeCommand(`looply install --pack ${p.name} --yes\n`)}
                      className="flex items-center gap-1 mt-3 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-500 hover:opacity-90"
                    >
                      <Download size={10} /> Install
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
