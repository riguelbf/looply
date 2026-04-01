import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLooplyData } from '../../hooks/useLooplyData'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { EmptyState } from '../shared/EmptyState'
import type { ProjectSnapshot, FeatureState } from '../../../../preload/types'

function statusBadge(f: FeatureState): JSX.Element {
  if (f.blockedBy?.length > 0) return <Badge variant="danger">Blocked</Badge>
  if (f.executionMode === 'replay') return <Badge variant="warning">Replaying</Badge>
  if (f.currentStage) return <Badge variant="info">{f.currentStage}</Badge>
  return <Badge variant="success">Complete</Badge>
}

export function FeatureListPage(): JSX.Element {
  const fetcher = useCallback(() => window.api.getSnapshot() as Promise<ProjectSnapshot | null>, [])
  const { data: snapshot, loading } = useLooplyData(fetcher)
  const features = snapshot?.features ?? []

  if (loading) return <div className="text-slate-400 text-sm p-8">Loading features...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-900">Features</h1>

      {features.length === 0 ? (
        <EmptyState title="No features" description="Start a workflow to create your first feature" />
      ) : (
        <div className="space-y-2">
          {features.map((f) => (
            <Link key={f.feature} to={`/features/${f.feature}`}>
              <Card className="p-4 hover:border-indigo-300 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{f.feature}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {f.workflow} &middot; {f.phase} &middot; Agent: {f.nextAgent || 'none'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(f)}
                    {f.interventionCount > 0 && (
                      <Badge variant="purple">{f.interventionCount} interventions</Badge>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
