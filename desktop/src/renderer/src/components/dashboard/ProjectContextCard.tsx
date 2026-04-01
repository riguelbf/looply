import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { TagPill } from '../shared/TagPill'
import type { ContextSnapshot } from '../../../../preload/types'

interface ProjectContextCardProps {
  context: ContextSnapshot | null
}

export function ProjectContextCard({ context }: ProjectContextCardProps): JSX.Element {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-900">Project Context</h2>
        {context?.contextStatus === 'active' && <Badge variant="success">Synced</Badge>}
        {context?.contextStatus === 'stale' && <Badge variant="warning">Stale</Badge>}
        {!context && <Badge>No Data</Badge>}
      </div>

      {context ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {/* Languages */}
          <div>
            <div className="text-[10px] font-semibold text-slate-500 mb-1">Languages</div>
            <div className="flex flex-wrap gap-1">
              {context.languages.map((l) => <TagPill key={l} color="blue">{l}</TagPill>)}
            </div>
          </div>

          {/* Frameworks */}
          <div>
            <div className="text-[10px] font-semibold text-slate-500 mb-1">Frameworks</div>
            <div className="flex flex-wrap gap-1">
              {context.frameworks.map((f) => <TagPill key={f} color="purple">{f}</TagPill>)}
            </div>
          </div>

          {/* APIs */}
          <div>
            <div className="text-[10px] font-semibold text-slate-500 mb-1">APIs</div>
            <div className="flex flex-wrap gap-1">
              {context.apiSignals.map((a) => <TagPill key={a} color="amber">{a}</TagPill>)}
            </div>
          </div>

          {/* Data */}
          <div>
            <div className="text-[10px] font-semibold text-slate-500 mb-1">Data</div>
            <div className="flex flex-wrap gap-1">
              {context.dataSignals.map((d) => <TagPill key={d} color="orange">{d}</TagPill>)}
            </div>
          </div>

          {/* Auth */}
          <div>
            <div className="text-[10px] font-semibold text-slate-500 mb-1">Auth</div>
            <div className="flex flex-wrap gap-1">
              {context.authSignals.map((a) => <TagPill key={a} color="pink">{a}</TagPill>)}
            </div>
          </div>

          {/* Messaging */}
          <div>
            <div className="text-[10px] font-semibold text-slate-500 mb-1">Messaging</div>
            <div className="flex flex-wrap gap-1">
              {context.messagingSignals.map((m) => <TagPill key={m} color="green">{m}</TagPill>)}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-slate-400 text-xs">
          Run <code className="bg-slate-100 px-1 rounded">looply refresh-context</code> to scan project
        </div>
      )}
    </Card>
  )
}
