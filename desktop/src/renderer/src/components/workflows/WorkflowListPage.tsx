import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLooplyData } from '../../hooks/useLooplyData'
import { useTerminalWriter } from '../../hooks/useTerminalWriter'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { EmptyState } from '../shared/EmptyState'
import { GitBranch } from 'lucide-react'
import type { CatalogArtifact } from '../../../../preload/types'

const phaseColors: Record<string, 'info' | 'purple' | 'success' | 'warning' | 'default'> = {
  discovery: 'info',
  planning: 'purple',
  delivery: 'success',
  operations: 'warning'
}

export function WorkflowListPage(): JSX.Element {
  const fetcher = useCallback(async () => {
    const catalog = await window.api.getCatalog() as CatalogArtifact[]
    return catalog.filter((a) => a.type === 'workflow')
  }, [])
  const { data: workflows, loading } = useLooplyData(fetcher)
  const { writeCommand } = useTerminalWriter()

  if (loading) return <div className="text-slate-400 text-sm p-8">Loading workflows...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-900">Workflows</h1>
      {!workflows?.length ? (
        <EmptyState title="No workflows found" description="Install a pack to add workflows" />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {workflows.map((w) => {
            const fm = w.frontmatter
            const phase = (fm.phase as string) || 'delivery'
            const stages = Array.isArray(fm.stages) ? fm.stages.length : 0
            const orchestrator = (fm.orchestrator as string) || ''

            return (
              <Link key={w.file} to={`/artifacts/workflow/${w.name}`}>
              <Card className="p-4 hover:border-indigo-300 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <GitBranch size={18} className="text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{w.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{w.summary}</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant={phaseColors[phase] ?? 'default'}>{phase}</Badge>
                      {stages > 0 && <Badge>{stages} stages</Badge>}
                      <Badge variant="purple">{w.pack}</Badge>
                      {orchestrator && <Badge variant="default">{orchestrator}</Badge>}
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); writeCommand(`/looply:${w.name} `) }}
                      className="mt-2 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                    >
                      Run
                    </button>
                  </div>
                </div>
              </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
