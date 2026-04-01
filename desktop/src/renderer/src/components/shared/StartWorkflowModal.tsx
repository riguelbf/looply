import { useState, useEffect, useCallback } from 'react'
import { X, Play } from 'lucide-react'
import type { CatalogArtifact } from '../../../../preload/types'

interface StartWorkflowModalProps {
  open: boolean
  feature: string
  onClose: () => void
  onExecute: (command: string) => void
}

export function StartWorkflowModal({ open, feature, onClose, onExecute }: StartWorkflowModalProps): JSX.Element | null {
  const [workflows, setWorkflows] = useState<CatalogArtifact[]>([])
  const [selected, setSelected] = useState('')
  const [claudeAvailable, setClaudeAvailable] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelected('')
    window.api.getCatalog().then((catalog: unknown[]) => {
      setWorkflows((catalog as CatalogArtifact[]).filter(a => a.type === 'workflow'))
    })
    window.api.checkHostAvailable('claude').then(setClaudeAvailable)
  }, [open])

  const handleStart = useCallback(() => {
    if (!selected) return
    const wf = workflows.find(w => w.name === selected)
    const orchestrator = (wf?.frontmatter?.orchestrator as string) || 'delivery-orchestrator'
    const stages = wf?.frontmatter?.stages as Array<{ task?: string }> | undefined
    const firstTask = stages?.[0]?.task || 'requirement-analysis'

    let cmd: string
    if (claudeAvailable) {
      // Use slash command in Claude Code tab
      cmd = `/looply:${selected} ${feature}`
    } else {
      // Fallback to CLI
      cmd = `looply run-agent ${feature} ${orchestrator} --task ${firstTask}`
    }

    onExecute(cmd + '\n')
    onClose()
  }, [selected, feature, workflows, claudeAvailable, onExecute, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 modal-backdrop" />
      <div className="relative bg-white rounded-xl shadow-2xl modal-content border border-slate-200 w-[440px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Play size={14} className="text-indigo-500" /> Start Workflow
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Feature</label>
            <div className="mt-1 px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-700 font-mono">{feature}</div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Workflow</label>
            <select value={selected} onChange={e => setSelected(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400">
              <option value="">Select workflow...</option>
              {workflows.map(w => (
                <option key={w.name} value={w.name}>
                  {w.name} — {w.summary || (w.frontmatter?.phase as string) || ''}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600">
              <div className="font-semibold text-slate-700 mb-1">Will execute:</div>
              <code className="text-indigo-600">
                {claudeAvailable ? `/looply:${selected} ${feature}` : `looply run-agent ${feature} ...`}
              </code>
              {claudeAvailable && (
                <div className="text-[9px] text-emerald-600 mt-1">via Claude Code slash command</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200">Cancel</button>
          <button onClick={handleStart} disabled={!selected}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-500 hover:opacity-90 disabled:opacity-40">
            Start Workflow
          </button>
        </div>
      </div>
    </div>
  )
}
