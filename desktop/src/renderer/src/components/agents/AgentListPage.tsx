import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLooplyData } from '../../hooks/useLooplyData'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { EmptyState } from '../shared/EmptyState'
import type { CatalogArtifact } from '../../../../preload/types'

const agentColors = ['bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-violet-500']

export function AgentListPage(): JSX.Element {
  const fetcher = useCallback(async () => {
    const catalog = await window.api.getCatalog() as CatalogArtifact[]
    return catalog.filter((a) => a.type === 'agent')
  }, [])
  const { data: agents, loading } = useLooplyData(fetcher)

  if (loading) return <div className="text-slate-400 text-sm p-8">Loading agents...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-900">Agents</h1>
      {!agents?.length ? (
        <EmptyState title="No agents found" description="Install a pack to add agents" />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {agents.map((a, i) => {
            const fm = a.frontmatter
            const tasks = Array.isArray(fm.supported_tasks) ? fm.supported_tasks as string[] : []
            const role = (fm.role as string) || ''

            return (
              <Link key={a.file} to={`/artifacts/agent/${a.name}`}>
              <Card className="p-4 hover:border-indigo-300 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full ${agentColors[i % agentColors.length]} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-bold">{a.name.substring(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{a.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{role || a.summary}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="purple">{a.pack}</Badge>
                      {tasks.map((t) => <Badge key={t}>{t}</Badge>)}
                    </div>
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
