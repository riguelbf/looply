import { useContextSnapshot } from '../../hooks/useContextSnapshot'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { TagPill } from '../shared/TagPill'
import { EmptyState } from '../shared/EmptyState'

function SignalSection({ label, signals, color }: { label: string; signals: string[]; color: 'blue' | 'purple' | 'amber' | 'green' | 'red' | 'orange' | 'pink' | 'slate' }): JSX.Element | null {
  if (!signals?.length) return null
  return (
    <div>
      <div className="text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {signals.map((s) => <TagPill key={s} color={color}>{s}</TagPill>)}
      </div>
    </div>
  )
}

export function ContextPage(): JSX.Element {
  const { data: ctx, loading } = useContextSnapshot()

  if (loading) return <div className="text-slate-400 text-sm p-8">Loading context...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Project Context</h1>
        {ctx && (
          <div className="flex gap-2">
            <Badge variant={ctx.contextStatus === 'active' ? 'success' : 'warning'}>{ctx.contextStatus}</Badge>
            <Badge variant={ctx.contextCoverage === 'high' ? 'success' : ctx.contextCoverage === 'medium' ? 'info' : 'warning'}>
              coverage: {ctx.contextCoverage}
            </Badge>
          </div>
        )}
      </div>

      {!ctx ? (
        <EmptyState title="No context data" description="Run looply refresh-context to analyze the project" />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Technology</h2>
            <SignalSection label="Languages" signals={ctx.languages} color="blue" />
            <SignalSection label="Frameworks" signals={ctx.frameworks} color="purple" />
            <SignalSection label="Key Directories" signals={ctx.keyDirectories} color="slate" />
            <SignalSection label="Modules" signals={ctx.moduleHints} color="slate" />
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Signals</h2>
            <SignalSection label="APIs" signals={ctx.apiSignals} color="amber" />
            <SignalSection label="Data" signals={ctx.dataSignals} color="orange" />
            <SignalSection label="Auth" signals={ctx.authSignals} color="pink" />
            <SignalSection label="Messaging" signals={ctx.messagingSignals} color="green" />
            <SignalSection label="Observability" signals={ctx.observabilitySignals} color="green" />
            <SignalSection label="Integrations" signals={ctx.integrationHints} color="blue" />
          </Card>

          {ctx.repositorySummary?.length > 0 && (
            <Card className="p-5 col-span-2">
              <h2 className="text-sm font-bold text-slate-900 mb-2">Repository Summary</h2>
              <ul className="space-y-1">
                {ctx.repositorySummary.map((s, i) => (
                  <li key={i} className="text-xs text-slate-600">{s}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
