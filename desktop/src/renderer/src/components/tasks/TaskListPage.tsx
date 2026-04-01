import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLooplyData } from '../../hooks/useLooplyData'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { EmptyState } from '../shared/EmptyState'
import { ListChecks } from 'lucide-react'
import type { CatalogArtifact } from '../../../../preload/types'

export function TaskListPage(): JSX.Element {
  const fetcher = useCallback(async () => {
    const catalog = await window.api.getCatalog() as CatalogArtifact[]
    return catalog.filter((a) => a.type === 'task')
  }, [])
  const { data: tasks, loading } = useLooplyData(fetcher)

  if (loading) return <div className="text-slate-400 text-sm p-8">Loading tasks...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-900">Tasks</h1>
      {!tasks?.length ? (
        <EmptyState title="No tasks found" description="Install a pack to add tasks" />
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => {
            const fm = t.frontmatter
            const agent = (fm.agent as string) || ''

            return (
              <Link key={t.file} to={`/artifacts/task/${t.name}`}>
                <Card className="p-3 flex items-center gap-3 hover:border-indigo-300 transition-colors cursor-pointer">
                  <ListChecks size={16} className="text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-slate-900">{t.name}</span>
                    {t.summary && <span className="text-[10px] text-slate-500 ml-2">{t.summary}</span>}
                  </div>
                  <Badge variant="purple">{t.pack}</Badge>
                  {agent && <Badge>{agent}</Badge>}
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
