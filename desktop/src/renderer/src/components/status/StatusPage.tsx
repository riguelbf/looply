import { useProjectSnapshot } from '../../hooks/useProjectSnapshot'
import { useContextSnapshot } from '../../hooks/useContextSnapshot'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { EmptyState } from '../shared/EmptyState'
import { CheckCircle2, XCircle, AlertTriangle, Server, Package, Globe, Users, Clock } from 'lucide-react'

export function StatusPage(): JSX.Element {
  const { data: snapshot, loading } = useProjectSnapshot()
  const { data: context } = useContextSnapshot()

  if (loading) return <div className="text-slate-400 text-sm p-8">Loading status...</div>

  if (!snapshot) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-slate-900">Status</h1>
        <EmptyState title="Not installed" description="Run looply install to set up the project" />
      </div>
    )
  }

  const s = snapshot.summary
  const p = snapshot.project

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Project Status</h1>
        <Badge variant={p.installed ? 'success' : 'danger'}>
          {p.installed ? 'Installed' : 'Not Installed'}
        </Badge>
      </div>

      {/* Project overview */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Package size={18} className="text-indigo-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{s.installCount}</div>
            <div className="text-[10px] text-slate-500">Installations</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <Users size={18} className="text-blue-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{s.featureCount}</div>
            <div className="text-[10px] text-slate-500">Features</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{s.blockedFeatureCount}</div>
            <div className="text-[10px] text-slate-500">Blocked</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Clock size={18} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{s.sessionCount}</div>
            <div className="text-[10px] text-slate-500">Sessions</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Configuration */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Configuration</h2>
          <div className="space-y-2 text-xs">
            <Row label="Locale" value={p.locale} />
            <Row label="Project Mode" value={p.projectMode} />
            <Row label="Interaction Mode" value={p.interactionMode} />
            <Row label="Inference Policy" value={p.inferencePolicy} />
            <Row label="Context Root" value={p.primaryContextRoot} />
          </div>
        </Card>

        {/* Context health */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Context Health</h2>
          {context ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <Badge variant={context.contextStatus === 'active' ? 'success' : 'warning'}>{context.contextStatus}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Coverage</span>
                <Badge variant={context.contextCoverage === 'high' ? 'success' : context.contextCoverage === 'medium' ? 'info' : 'warning'}>{context.contextCoverage}</Badge>
              </div>
              <Row label="Languages" value={context.languages?.join(', ') || 'none'} />
              <Row label="Frameworks" value={context.frameworks?.join(', ') || 'none'} />
              <Row label="Last Validated" value={context.lastValidatedAt ? new Date(context.lastValidatedAt).toLocaleString() : 'never'} />
            </div>
          ) : (
            <div className="text-xs text-slate-400">No context data. Run <code className="bg-slate-100 px-1 rounded">looply refresh-context</code></div>
          )}
        </Card>

        {/* Hosts */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Hosts</h2>
          {snapshot.hosts?.length ? (
            <div className="space-y-2">
              {snapshot.hosts.map((h, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <Server size={14} className="text-slate-400" />
                  <span className="text-xs font-medium text-slate-900">{h.host}</span>
                  <Badge>{h.scope}</Badge>
                  <span className="text-[10px] text-slate-500">{h.pack}</span>
                  <span className="text-[10px] text-slate-400 ml-auto">{h.workflowCount} workflows</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400">No hosts configured</div>
          )}
        </Card>

        {/* Features in flight */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Features In Flight</h2>
          {snapshot.features?.length ? (
            <div className="space-y-2">
              {snapshot.features.map((f) => (
                <div key={f.feature} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div>
                    <span className="text-xs font-medium text-slate-900">{f.feature}</span>
                    <span className="text-[10px] text-slate-500 ml-2">{f.workflow}</span>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant={f.blockedBy?.length ? 'danger' : 'info'}>{f.currentStage || f.phase}</Badge>
                    {f.interventionCount > 0 && <Badge variant="warning">{f.interventionCount} iv</Badge>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400">No active features</div>
          )}
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-medium truncate ml-4 max-w-[200px]">{value || 'N/A'}</span>
    </div>
  )
}
