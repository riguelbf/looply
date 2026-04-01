import { useState } from 'react'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { useTerminalWriter } from '../../hooks/useTerminalWriter'
import type { FeatureState } from '../../../../preload/types'

interface FeaturePipelineCardProps {
  features: FeatureState[]
}

type FilterTab = 'all' | 'in-progress' | 'blocked' | 'completed'

function getFeatureStatusBadge(f: FeatureState): JSX.Element {
  if (f.blockedBy?.length > 0 || f.gateStatus === 'failed') {
    return <Badge variant="danger">Gate Failed</Badge>
  }
  if (f.phase === 'discovery') return <Badge variant="warning">Discovery</Badge>
  if (f.phase === 'planning') return <Badge variant="info">Planning</Badge>
  if (f.gateStatus === 'approved' && !f.currentStage) return <Badge variant="success">Complete</Badge>
  return <Badge variant="info">Implementing</Badge>
}

function getInitialColor(feature: FeatureState): string {
  if (feature.blockedBy?.length > 0) return 'bg-red-500'
  if (feature.phase === 'discovery') return 'bg-amber-500'
  return 'bg-indigo-500'
}

export function FeaturePipelineCard({ features }: FeaturePipelineCardProps): JSX.Element {
  const [filter, setFilter] = useState<FilterTab>('all')
  const { activeFeature, setActiveFeature } = useTerminalWriter()

  const filtered = features.filter((f) => {
    if (filter === 'blocked') return f.blockedBy?.length > 0
    if (filter === 'completed') return f.gateStatus === 'approved' && !f.currentStage
    if (filter === 'in-progress') return f.currentStage && f.blockedBy?.length === 0
    return true
  })

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-base font-bold text-slate-900">Feature Pipeline</h2>
          <p className="text-[11px] text-slate-500">Track features from idea to production</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mt-4 mb-4">
        {([
          ['all', `All (${features.length})`],
          ['in-progress', 'In Progress'],
          ['blocked', 'Blocked'],
          ['completed', 'Completed']
        ] as [FilterTab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === key
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Phase headers */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 h-6 rounded bg-blue-100 flex items-center justify-center">
          <span className="text-[10px] font-semibold text-blue-600">DISCOVERY</span>
        </div>
        <div className="flex-1 h-6 rounded bg-indigo-100 flex items-center justify-center">
          <span className="text-[10px] font-semibold text-indigo-600">PLANNING</span>
        </div>
        <div className="flex-[2] h-6 rounded bg-purple-100 flex items-center justify-center">
          <span className="text-[10px] font-semibold text-purple-600">DELIVERY</span>
        </div>
        <div className="flex-1 h-6 rounded bg-emerald-100 flex items-center justify-center">
          <span className="text-[10px] font-semibold text-emerald-600">RELEASED</span>
        </div>
      </div>

      {/* Feature rows */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No features found</div>
        ) : (
          filtered.map((f) => (
            <div
              key={f.feature}
              onClick={() => setActiveFeature(f.feature)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors border ${
                activeFeature === f.feature
                  ? 'bg-indigo-50 border-indigo-300'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${getInitialColor(f)} flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">{f.feature[0]?.toUpperCase()}</span>
              </div>
              <div className="min-w-[160px]">
                <div className="text-xs font-semibold text-slate-900">{f.feature}</div>
                <div className="text-[10px] text-slate-500">{f.workflow}</div>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${Math.max(10, (f.completedOutputs?.length ?? 0) * 20)}%` }}
                  />
                </div>
              </div>
              {getFeatureStatusBadge(f)}
              {f.nextAgent && (
                <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center ml-2">
                  <span className="text-white text-[9px] font-bold">{f.nextAgent.substring(0, 2).toUpperCase()}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
