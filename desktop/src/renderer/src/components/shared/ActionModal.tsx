import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import type { CatalogArtifact, ProjectSnapshot } from '../../../../preload/types'

export type QuickActionType = 'run-agent' | 'run-task' | 'replay' | 'reconcile'

interface ActionModalProps {
  open: boolean
  action: QuickActionType
  onClose: () => void
  onExecute: (command: string) => void
}

export function ActionModal({ open, action, onClose, onExecute }: ActionModalProps): JSX.Element | null {
  const [features, setFeatures] = useState<string[]>([])
  const [agents, setAgents] = useState<CatalogArtifact[]>([])
  const [tasks, setTasks] = useState<CatalogArtifact[]>([])
  const [selectedFeature, setSelectedFeature] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('')
  const [selectedTask, setSelectedTask] = useState('')
  const [checkpoint, setCheckpoint] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open) return
    setSelectedFeature(''); setSelectedAgent(''); setSelectedTask(''); setCheckpoint(''); setReason('')

    window.api.getSnapshot().then((snap: unknown) => {
      const s = snap as ProjectSnapshot | null
      setFeatures(s?.features?.map(f => f.feature) ?? [])
    })
    window.api.getCatalog().then((catalog: unknown[]) => {
      const items = catalog as CatalogArtifact[]
      setAgents(items.filter(a => a.type === 'agent'))
      setTasks(items.filter(a => a.type === 'task'))
    })
  }, [open])

  const filteredTasks = selectedAgent
    ? tasks.filter(t => {
        const agent = agents.find(a => a.name === selectedAgent)
        const supported = agent?.frontmatter?.supported_tasks
        return Array.isArray(supported) ? supported.includes(t.name) : true
      })
    : tasks

  const handleSubmit = useCallback(() => {
    if (!selectedFeature) return
    let cmd = ''
    switch (action) {
      case 'run-task':
        if (!selectedTask) return
        cmd = `looply run-task ${selectedFeature} ${selectedTask}`
        if (reason) cmd += ` --reason "${reason}"`
        break
      case 'run-agent':
        if (!selectedAgent) return
        cmd = `looply run-agent ${selectedFeature} ${selectedAgent}`
        if (selectedTask) cmd += ` --task ${selectedTask}`
        if (reason) cmd += ` --reason "${reason}"`
        break
      case 'replay':
        if (!checkpoint) return
        cmd = `looply replay ${selectedFeature} --from ${checkpoint}`
        if (reason) cmd += ` --reason "${reason}"`
        break
      case 'reconcile':
        cmd = `looply reconcile ${selectedFeature}`
        break
    }
    onExecute(cmd + '\n')
    onClose()
  }, [action, selectedFeature, selectedAgent, selectedTask, checkpoint, reason, onExecute, onClose])

  if (!open) return null

  const titles: Record<QuickActionType, string> = {
    'run-task': 'Run Task', 'run-agent': 'Run Agent', 'replay': 'Replay', 'reconcile': 'Reconcile'
  }

  const canSubmit =
    selectedFeature && (
      action === 'reconcile' ||
      (action === 'run-task' && selectedTask) ||
      (action === 'run-agent' && selectedAgent) ||
      (action === 'replay' && checkpoint)
    )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 modal-backdrop" />
      <div className="relative bg-white rounded-xl shadow-2xl modal-content border border-slate-200 w-[440px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">{titles[action]}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-3">
          {/* Feature select */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Feature</label>
            <select value={selectedFeature} onChange={e => setSelectedFeature(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400">
              <option value="">Select feature...</option>
              {features.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            {features.length === 0 && (
              <div className="text-[9px] text-amber-600 mt-1">No features found. Create one first.</div>
            )}
          </div>

          {action === 'run-agent' && (
            <>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Agent</label>
                <select value={selectedAgent} onChange={e => { setSelectedAgent(e.target.value); setSelectedTask('') }}
                  className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400">
                  <option value="">Select agent...</option>
                  {agents.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Task (optional)</label>
                <select value={selectedTask} onChange={e => setSelectedTask(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400">
                  <option value="">Select task...</option>
                  {filteredTasks.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>
            </>
          )}

          {action === 'run-task' && (
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Task</label>
              <select value={selectedTask} onChange={e => setSelectedTask(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400">
                <option value="">Select task...</option>
                {tasks.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
            </div>
          )}

          {action === 'replay' && (
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Checkpoint</label>
              <input value={checkpoint} onChange={e => setCheckpoint(e.target.value)} placeholder="e.g. technical-design"
                className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400" />
            </div>
          )}

          {action === 'reconcile' && selectedFeature && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">Reconcile <strong>{selectedFeature}</strong>?</p>
            </div>
          )}

          {action !== 'reconcile' && (
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Reason (optional)</label>
              <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Why?"
                className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400"
                onKeyDown={e => { if (e.key === 'Enter' && canSubmit) handleSubmit() }} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200">Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-500 hover:opacity-90 disabled:opacity-40">
            Execute
          </button>
        </div>
      </div>
    </div>
  )
}
