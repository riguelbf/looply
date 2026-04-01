import { useProjectSnapshot } from '../../hooks/useProjectSnapshot'
import { useCallback } from 'react'
import { useLooplyData } from '../../hooks/useLooplyData'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { EmptyState } from '../shared/EmptyState'
import { Server } from 'lucide-react'
import type { InstallManifest } from '../../../../preload/types'

export function HostsPage(): JSX.Element {
  const { data: snapshot, loading: snapLoading } = useProjectSnapshot()
  const manifestFetcher = useCallback(() => window.api.getManifest() as Promise<InstallManifest | null>, [])
  const { data: manifest } = useLooplyData(manifestFetcher)

  if (snapLoading) return <div className="text-slate-400 text-sm p-8">Loading hosts...</div>

  const hosts = snapshot?.hosts ?? []
  const installs = manifest?.installs ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-900">Hosts</h1>

      {hosts.length === 0 ? (
        <EmptyState title="No hosts configured" description="Run looply install to configure a host" />
      ) : (
        <div className="space-y-4">
          {hosts.map((h, i) => {
            const inst = installs.find((ins) => ins.host === h.host && ins.scope === h.scope)

            return (
              <Card key={i} className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Server size={20} className="text-indigo-500" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 capitalize">{h.host}</div>
                    <div className="text-[10px] text-slate-500">Scope: {h.scope}</div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-xs">
                    <Row label="Pack" value={h.pack} />
                    <Row label="Workflows" value={String(h.workflowCount)} />
                    {h.aliases?.length > 0 && (
                      <div>
                        <span className="text-slate-500">Aliases</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {h.aliases.map((a) => (
                            <code key={a} className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{a}</code>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {inst && (
                    <div className="space-y-2 text-xs">
                      <Row label="Locale" value={inst.locale} />
                      <Row label="Project Mode" value={inst.projectMode} />
                      <Row label="Interaction Mode" value={inst.interactionMode} />
                      <Row label="Installed At" value={inst.installedAt ? new Date(inst.installedAt).toLocaleString() : 'N/A'} />
                      <div className="flex gap-3 pt-1 text-[10px] text-slate-400">
                        <span>{inst.managedFiles?.length ?? 0} managed</span>
                        <span>{inst.mergeableFiles?.length ?? 0} mergeable</span>
                        <span>{inst.customFiles?.length ?? 0} custom</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-medium">{value || 'N/A'}</span>
    </div>
  )
}
