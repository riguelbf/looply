import { useProjectSnapshot } from '../../hooks/useProjectSnapshot'
import { useContextSnapshot } from '../../hooks/useContextSnapshot'
import { MetricCardsRow } from './MetricCardsRow'
import { FeaturePipelineCard } from './FeaturePipelineCard'
import { WorkflowDetailCard } from './WorkflowDetailCard'
import { ProjectContextCard } from './ProjectContextCard'
import { QuickActionsCard } from './QuickActionsCard'
import { SkeletonDashboard } from '../shared/Skeleton'

export function DashboardPage(): JSX.Element {
  const { data: snapshot, loading } = useProjectSnapshot()
  const { data: context } = useContextSnapshot()

  if (loading) {
    return <SkeletonDashboard />
  }

  return (
    <div className="space-y-6">
      <MetricCardsRow snapshot={snapshot} />
      <FeaturePipelineCard features={snapshot?.features ?? []} />
      <div className="grid grid-cols-2 gap-6">
        <WorkflowDetailCard features={snapshot?.features ?? []} />
        <div className="space-y-6">
          <ProjectContextCard context={context} />
          <QuickActionsCard />
        </div>
      </div>
    </div>
  )
}
