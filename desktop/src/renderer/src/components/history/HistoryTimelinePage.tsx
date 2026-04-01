import { useCallback } from 'react'
import { useLooplyData } from '../../hooks/useLooplyData'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { EmptyState } from '../shared/EmptyState'
import { Clock } from 'lucide-react'
import type { UpgradeHistory } from '../../../../preload/types'

const actionColors: Record<string, string> = {
  install: 'success',
  sync: 'info',
  upgrade: 'purple',
  uninstall: 'danger'
}

export function HistoryTimelinePage(): JSX.Element {
  const fetcher = useCallback(() => window.api.getHistory() as Promise<UpgradeHistory | null>, [])
  const { data, loading } = useLooplyData(fetcher)
  const entries = data?.entries ?? []

  if (loading) return <div className="text-slate-400 text-sm p-8">Loading history...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-900">History</h1>

      {entries.length === 0 ? (
        <EmptyState title="No history" description="Install, sync, and upgrade events appear here" />
      ) : (
        <Card className="p-5">
          <div className="space-y-0">
            {entries.map((entry, i) => (
              <div key={i} className="flex gap-3">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <Clock size={14} className="text-slate-500" />
                  </div>
                  {i < entries.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
                </div>

                {/* Content */}
                <div className="pb-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={(actionColors[entry.action] ?? 'default') as any}>{entry.action}</Badge>
                    <span className="text-xs font-semibold text-slate-900">{entry.host} / {entry.scope}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Pack: {entry.pack}</div>
                  {entry.impacts?.length > 0 && (
                    <div className="text-[10px] text-slate-500">Impacts: {entry.impacts.join(', ')}</div>
                  )}
                  {entry.artifactChanges && (
                    <div className="flex gap-3 mt-1 text-[10px]">
                      <span className="text-emerald-600">+{entry.artifactChanges.added} added</span>
                      <span className="text-amber-600">{entry.artifactChanges.updated} updated</span>
                      <span className="text-red-600">-{entry.artifactChanges.removed} removed</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
