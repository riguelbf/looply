import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLooplyData } from '../../hooks/useLooplyData'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { EmptyState } from '../shared/EmptyState'
import { FileCode } from 'lucide-react'
import type { CatalogArtifact } from '../../../../preload/types'

export function TemplatePage(): JSX.Element {
  const fetcher = useCallback(async () => {
    const catalog = await window.api.getCatalog() as CatalogArtifact[]
    return catalog.filter((a) => a.type === 'template')
  }, [])
  const { data: templates, loading } = useLooplyData(fetcher)

  if (loading) return <div className="text-slate-400 text-sm p-8">Loading templates...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-900">Templates</h1>

      {!templates?.length ? (
        <EmptyState title="No templates found" description="Install a pack with template files" />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {templates.map((t) => (
            <Link key={t.file} to={`/artifacts/template/${t.name}`}>
            <Card className="p-4 flex items-start gap-3 hover:border-indigo-300 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <FileCode size={16} className="text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900">{t.name}</div>
                {t.summary && <div className="text-[10px] text-slate-500 mt-0.5">{t.summary}</div>}
                <div className="flex gap-1 mt-1.5">
                  <Badge variant="purple">{t.pack}</Badge>
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
