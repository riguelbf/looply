import { useParams, Link } from 'react-router-dom'
import { useCallback, useState } from 'react'
import { useLooplyData } from '../../hooks/useLooplyData'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { EmptyState } from '../shared/EmptyState'
import { MarkdownRenderer } from '../shared/MarkdownRenderer'
import { ArrowLeft, GitBranch, Users, ListChecks, BookOpen } from 'lucide-react'
import type { ArtifactDetail } from '../../../../preload/types'

const typeIcons: Record<string, JSX.Element> = {
  workflow: <GitBranch size={20} className="text-indigo-500" />,
  agent: <Users size={20} className="text-purple-500" />,
  task: <ListChecks size={20} className="text-amber-500" />,
  knowledge: <BookOpen size={20} className="text-blue-500" />,
  checklist: <BookOpen size={20} className="text-emerald-500" />,
  template: <BookOpen size={20} className="text-violet-500" />
}

const typeColors: Record<string, string> = {
  workflow: 'bg-indigo-100',
  agent: 'bg-purple-100',
  task: 'bg-amber-100',
  knowledge: 'bg-blue-100',
  checklist: 'bg-emerald-100',
  template: 'bg-violet-100'
}

function FrontmatterTable({ frontmatter }: { frontmatter: Record<string, unknown> }): JSX.Element {
  const entries = Object.entries(frontmatter).filter(([k]) => k !== 'name' && k !== 'schema')

  return (
    <div className="space-y-1.5">
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-3">
          <span className="text-[10px] font-semibold text-slate-500 w-32 flex-shrink-0 text-right">{key}</span>
          <div className="text-[11px] text-slate-800 flex-1">
            <FrontmatterValue value={value} artifactType={key} />
          </div>
        </div>
      ))}
    </div>
  )
}

function FrontmatterValue({ value, artifactType }: { value: unknown; artifactType: string }): JSX.Element {
  if (Array.isArray(value)) {
    const isLinkable = ['supported_tasks', 'knowledge_sources', 'stages'].includes(artifactType)
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((v, i) => {
          const str = typeof v === 'object' ? JSON.stringify(v) : String(v)
          // Link tasks to their artifact page
          if (artifactType === 'supported_tasks') {
            return <Link key={i} to={`/artifacts/task/${str}`} className="text-indigo-500 hover:underline text-[10px]">{str}</Link>
          }
          return <Badge key={i}>{str}</Badge>
        })}
      </div>
    )
  }
  if (typeof value === 'object' && value !== null) {
    return (
      <div className="space-y-0.5">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="text-[10px]">
            <span className="text-slate-500">{k}:</span> <span className="text-slate-700">{String(v)}</span>
          </div>
        ))}
      </div>
    )
  }
  return <span>{String(value)}</span>
}

function BodyViewer({ body }: { body: string }): JSX.Element {
  const [mode, setMode] = useState<'preview' | 'source' | 'split'>('preview')

  if (!body.trim()) {
    return (
      <Card className="p-5 col-span-2">
        <div className="text-xs text-slate-400 italic">No body content</div>
      </Card>
    )
  }

  return (
    <Card className="p-5 col-span-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-900">Content</h2>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {(['preview', 'source', 'split'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-2.5 py-1 text-[10px] font-medium ${mode === m ? 'bg-indigo-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
              {m === 'preview' ? 'Preview' : m === 'source' ? 'Source' : 'Split'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'preview' && <MarkdownRenderer content={body} />}

      {mode === 'source' && (
        <pre className="bg-slate-900 text-slate-200 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-[500px] overflow-y-auto whitespace-pre-wrap">
          {body}
        </pre>
      )}

      {mode === 'split' && (
        <div className="grid grid-cols-2 gap-3 max-h-[500px]">
          <pre className="bg-slate-900 text-slate-200 rounded-lg p-3 text-[10px] font-mono overflow-auto whitespace-pre-wrap">
            {body}
          </pre>
          <div className="overflow-auto border border-slate-200 rounded-lg p-3">
            <MarkdownRenderer content={body} />
          </div>
        </div>
      )}
    </Card>
  )
}

export function ArtifactDetailPage(): JSX.Element {
  const { type, name } = useParams<{ type: string; name: string }>()

  // First get catalog to find the file path
  const catalogFetcher = useCallback(async () => {
    const catalog = await window.api.getCatalog() as Array<{ type: string; name: string; file: string }>
    const match = catalog.find((a) => a.type === type && a.name === name)
    if (!match) return null
    return window.api.getArtifactDetail(match.file) as Promise<ArtifactDetail | null>
  }, [type, name])

  const { data: artifact, loading } = useLooplyData(catalogFetcher)

  if (loading) return <div className="text-slate-400 text-sm p-8">Loading artifact...</div>

  if (!artifact) {
    return (
      <div className="space-y-4">
        <Link to={`/${type}s`} className="flex items-center gap-1 text-xs text-indigo-500 hover:underline">
          <ArrowLeft size={12} /> Back
        </Link>
        <EmptyState title="Artifact not found" description={`Could not find ${type} "${name}"`} />
      </div>
    )
  }

  const backPath = type === 'knowledge' || type === 'checklist' ? '/knowledge' : `/${type}s`

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link to={backPath} className="flex items-center gap-1 text-xs text-indigo-500 hover:underline">
        <ArrowLeft size={12} /> Back to {type}s
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${typeColors[artifact.type ?? ''] ?? 'bg-slate-100'} flex items-center justify-center`}>
          {typeIcons[artifact.type ?? ''] ?? <BookOpen size={20} className="text-slate-500" />}
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{artifact.name}</h1>
          <div className="flex gap-2 mt-0.5">
            <Badge variant="purple">{artifact.type}</Badge>
            <span className="text-[10px] text-slate-400">{artifact.file}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Frontmatter */}
        <Card className="p-5 col-span-1">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Properties</h2>
          <FrontmatterTable frontmatter={artifact.frontmatter} />
        </Card>

        {/* Body — toggle between preview and source */}
        <BodyViewer body={artifact.body} />
      </div>
    </div>
  )
}
