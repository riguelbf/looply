import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import type { CatalogArtifact } from '../../../../preload/types'

interface NewFeatureModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (feature: string) => void
}

export function NewFeatureModal({ open, onClose, onCreated }: NewFeatureModalProps): JSX.Element | null {
  const [name, setName] = useState('')
  const [workflow, setWorkflow] = useState('idea-to-prd')
  const [workflows, setWorkflows] = useState<CatalogArtifact[]>([])
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    setName('')
    setWorkflow('idea-to-prd')
    setCreating(false)
    window.api.getCatalog().then((catalog: unknown[]) => {
      setWorkflows((catalog as CatalogArtifact[]).filter(a => a.type === 'workflow'))
    })
  }, [open])

  const handleCreate = useCallback(async () => {
    const featureName = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (!featureName) return

    setCreating(true)
    try {
      const result = await window.api.createFeature({ feature: featureName, workflow })
      console.log('[NewFeature] Created:', result)
      onCreated?.(featureName)
      onClose()
      navigate(`/features/${featureName}`)
    } catch (err) {
      console.error('[NewFeature] Failed:', err)
      setCreating(false)
    }
  }, [name, workflow, onClose, onCreated, navigate])

  if (!open) return null

  const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 modal-backdrop" />
      <div className="relative bg-white rounded-xl shadow-2xl modal-content border border-slate-200 w-[440px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">New Feature</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Feature Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. pix-webhook-retry"
              className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-indigo-400"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
            />
            {slug && slug !== name.trim() && (
              <div className="text-[9px] text-slate-400 mt-1">Slug: <code className="bg-slate-100 px-1 rounded">{slug}</code></div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Workflow</label>
            <select
              value={workflow}
              onChange={e => setWorkflow(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-indigo-400"
            >
              {workflows.map(w => (
                <option key={w.name} value={w.name}>{w.name} — {w.summary || (w.frontmatter?.phase as string) || ''}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={!slug || creating}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-500 hover:opacity-90 disabled:opacity-40"
          >
            {creating ? 'Creating...' : 'Create Feature'}
          </button>
        </div>
      </div>
    </div>
  )
}
