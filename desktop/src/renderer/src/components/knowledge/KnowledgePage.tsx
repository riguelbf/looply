import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLooplyData } from '../../hooks/useLooplyData'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { EmptyState } from '../shared/EmptyState'
import { BookOpen } from 'lucide-react'
import type { CatalogArtifact } from '../../../../preload/types'

export function KnowledgePage(): JSX.Element {
  const fetcher = useCallback(async () => {
    const catalog = await window.api.getCatalog() as CatalogArtifact[]
    return catalog.filter((a) => a.type === 'knowledge' || a.type === 'checklist')
  }, [])
  const { data: items, loading } = useLooplyData(fetcher)

  if (loading) return <div className="text-slate-400 text-sm p-8">Loading knowledge base...</div>

  const knowledge = items?.filter((a) => a.type === 'knowledge') ?? []
  const checklists = items?.filter((a) => a.type === 'checklist') ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-900">Knowledge Base</h1>

      {!items?.length ? (
        <EmptyState title="No knowledge artifacts" description="Install a pack with knowledge or checklist files" />
      ) : (
        <>
          {knowledge.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-slate-700">Knowledge ({knowledge.length})</h2>
              <div className="grid grid-cols-2 gap-3">
                {knowledge.map((k) => (
                  <Link key={k.file} to={`/artifacts/knowledge/${k.name}`}>
                  <Card className="p-4 flex items-start gap-3 hover:border-indigo-300 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={16} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900">{k.name}</div>
                      {k.summary && <div className="text-[10px] text-slate-500 mt-0.5">{k.summary}</div>}
                      <Badge variant="purple">{k.pack}</Badge>
                    </div>
                  </Card>
                  </Link>
                ))}
              </div>
            </>
          )}

          {checklists.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-slate-700 mt-4">Checklists ({checklists.length})</h2>
              <div className="grid grid-cols-2 gap-3">
                {checklists.map((c) => (
                  <Link key={c.file} to={`/artifacts/checklist/${c.name}`}>
                  <Card className="p-4 flex items-start gap-3 hover:border-indigo-300 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={16} className="text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900">{c.name}</div>
                      {c.summary && <div className="text-[10px] text-slate-500 mt-0.5">{c.summary}</div>}
                      <Badge variant="purple">{c.pack}</Badge>
                    </div>
                  </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
