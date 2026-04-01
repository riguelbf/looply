import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import type { ProjectSnapshot } from '../../../../preload/types'

interface MetricCardsRowProps {
  snapshot: ProjectSnapshot | null
}

export function MetricCardsRow({ snapshot }: MetricCardsRowProps): JSX.Element {
  const summary = snapshot?.summary

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Active Features */}
      <Card className="p-5">
        <div className="text-[11px] font-medium text-slate-500">Active Features</div>
        <div className="text-3xl font-bold text-slate-900 mt-1">{summary?.featureCount ?? 0}</div>
        <Badge variant="info">In Progress</Badge>
      </Card>

      {/* Workflow Progress */}
      <Card className="p-5">
        <div className="text-[11px] font-medium text-slate-500">Workflow Progress</div>
        <div className="text-3xl font-bold text-slate-900 mt-1">
          {summary?.featureCount
            ? `${Math.round(((summary.readyFeatureCount ?? 0) / summary.featureCount) * 100)}%`
            : '0%'}
        </div>
        <Badge variant="success">On Track</Badge>
      </Card>

      {/* Quality Gates */}
      <Card className="p-5">
        <div className="text-[11px] font-medium text-slate-500">Quality Gates</div>
        <div className="text-3xl font-bold text-slate-900 mt-1">
          {summary?.readyFeatureCount ?? 0}/{summary?.featureCount ?? 0}
        </div>
        <Badge variant="warning">{summary?.blockedFeatureCount ?? 0} Pending</Badge>
      </Card>

      {/* Interventions */}
      <Card className="p-5">
        <div className="text-[11px] font-medium text-slate-500">Interventions</div>
        <div className="text-3xl font-bold text-slate-900 mt-1">{summary?.interventionCount ?? 0}</div>
        <Badge variant="purple">{summary?.replayedFeatureCount ?? 0} Replayed</Badge>
      </Card>
    </div>
  )
}
