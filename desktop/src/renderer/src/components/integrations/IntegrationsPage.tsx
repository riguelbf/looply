import { useCallback } from 'react'
import { useLooplyData } from '../../hooks/useLooplyData'
import { useTerminalWriter } from '../../hooks/useTerminalWriter'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { EmptyState } from '../shared/EmptyState'
import { Plug, Plus, Settings } from 'lucide-react'
import type { IntegrationContext } from '../../../../preload/types'

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  active: 'success',
  draft: 'warning',
  deprecated: 'danger',
  planned: 'info'
}

const coverageColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  high: 'success',
  medium: 'warning',
  low: 'danger',
  none: 'default'
}

export function IntegrationsPage(): JSX.Element {
  const fetcher = useCallback(() => window.api.getIntegrations() as Promise<IntegrationContext[]>, [])
  const { data: integrations, loading } = useLooplyData(fetcher)
  const { writeCommand } = useTerminalWriter()

  if (loading) return <div className="text-slate-400 text-sm p-8">Loading integrations...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Integrations</h1>
        <button
          onClick={() => writeCommand('looply integrations add\n')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-semibold hover:opacity-90"
        >
          <Plus size={14} /> Add Integration
        </button>
      </div>

      {!integrations?.length ? (
        <EmptyState
          title="No integrations"
          description="Add integration contexts to track external systems your project interacts with"
          action={{ label: 'Add Integration', onClick: () => writeCommand('looply integrations add\n') }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {integrations.map((ig) => (
            <Card key={ig.name} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Plug size={18} className="text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{ig.name}</span>
                    <Badge variant={statusColors[ig.status] ?? 'default'}>{ig.status}</Badge>
                  </div>
                  {ig.category && <div className="text-[10px] text-slate-500 mt-0.5">Category: {ig.category}</div>}
                  {ig.owner && <div className="text-[10px] text-slate-500">Owner: {ig.owner}</div>}

                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] text-slate-400">Coverage:</span>
                    <Badge variant={coverageColors[ig.coverage] ?? 'default'}>{ig.coverage || 'none'}</Badge>
                  </div>

                  {ig.touchpoints.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ig.touchpoints.map((tp) => (
                        <span key={tp} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{tp}</span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => writeCommand(`looply integrations configure ${ig.name}\n`)}
                    className="flex items-center gap-1 mt-3 px-2 py-1 rounded text-[10px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
                  >
                    <Settings size={10} /> Configure
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
