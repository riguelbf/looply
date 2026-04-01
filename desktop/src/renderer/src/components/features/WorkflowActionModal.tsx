import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import type { CatalogArtifact } from '../../../../preload/types'

export type ActionType = 'run-task' | 'run-agent' | 'replay' | 'reconcile'

interface WorkflowActionModalProps {
  open: boolean
  action: ActionType
  feature: string
  onClose: () => void
  onExecute: (command: string) => void
}

export function WorkflowActionModal({ open, action, feature, onClose, onExecute }: WorkflowActionModalProps): JSX.Element | null {
  const [agents, setAgents] = useState<CatalogArtifact[]>([])
  const [tasks, setTasks] = useState<CatalogArtifact[]>([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [selectedTask, setSelectedTask] = useState('')
  const [checkpoint, setCheckpoint] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open) return
    setSelectedAgent('')
    setSelectedTask('')
    setCheckpoint('')
    setReason('')

    window.api.getCatalog().then((catalog: unknown[]) => {
      const items = catalog as CatalogArtifact[]
      setAgents(items.filter(a => a.type === 'agent'))
      setTasks(items.filter(a => a.type === 'task'))
    })
  }, [open])

  // Filter tasks by selected agent's supported_tasks
  const filteredTasks = selectedAgent
    ? tasks.filter(t => {
        const agent = agents.find(a => a.name === selectedAgent)
        const supported = agent?.frontmatter?.supported_tasks
        if (Array.isArray(supported)) return supported.includes(t.name)
        return true
      })
    : tasks

  const handleSubmit = useCallback(() => {
    let cmd = ''
    switch (action) {
      case 'run-task':
        if (!selectedTask) return
        cmd = `looply run-task ${feature} ${selectedTask}`
        if (reason) cmd += ` --reason "${reason}"`
        break
      case 'run-agent':
        if (!selectedAgent) return
        cmd = `looply run-agent ${feature} ${selectedAgent}`
        if (selectedTask) cmd += ` --task ${selectedTask}`
        if (reason) cmd += ` --reason "${reason}"`
        break
      case 'replay':
        if (!checkpoint) return
        cmd = `looply replay ${feature} --from ${checkpoint}`
        if (reason) cmd += ` --reason "${reason}"`
        break
      case 'reconcile':
        cmd = `looply reconcile ${feature}`
        break
    }
    onExecute(cmd + '\n')
    onClose()
  }, [action, feature, selectedAgent, selectedTask, checkpoint, reason, onExecute, onClose])

  if (!open) return null

  const titles: Record<ActionType, string> = {
    'run-task': 'Run Task',
    'run-agent': 'Run Agent',
    'replay': 'Replay from Checkpoint',
    'reconcile': 'Reconcile Feature'
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 modal-backdrop" />
      <div className="relative bg-white rounded-xl shadow-2xl modal-content border border-slate-200 w-[440px] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">{titles[action]}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Feature (readonly) */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Feature</label>
            <div className="mt-1 px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-700 font-mono">{feature}</div>
          </div>

          {/* Run Task: select task */}
          {action === 'run-task' && (
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Task</label>
              <select
                value={selectedTask}
                onChange={e => setSelectedTask(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-indigo-400"
              >
                <option value="">Select a task...</option>
                {tasks.map(t => <option key={t.name} value={t.name}>{t.name} ({t.pack})</option>)}
              </select>
            </div>
          )}

          {/* Run Agent: select agent + optional task */}
          {action === 'run-agent' && (
            <>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Agent</label>
                <select
                  value={selectedAgent}
                  onChange={e => { setSelectedAgent(e.target.value); setSelectedTask('') }}
                  className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-indigo-400"
                >
                  <option value="">Select an agent...</option>
                  {agents.map(a => <option key={a.name} value={a.name}>{a.name} — {a.summary || (a.frontmatter?.role as string) || ''}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Task (optional)</label>
                <select
                  value={selectedTask}
                  onChange={e => setSelectedTask(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-indigo-400"
                >
                  <option value="">Select a task...</option>
                  {filteredTasks.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>
            </>
          )}

          {/* Replay: checkpoint */}
          {action === 'replay' && (
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Checkpoint (stage, agent, or task name)</label>
              <input
                value={checkpoint}
                onChange={e => setCheckpoint(e.target.value)}
                placeholder="e.g. technical-design, architect, create-tech-spec"
                className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-indigo-400"
              />
            </div>
          )}

          {/* Reason (for run-task, run-agent, replay) */}
          {action !== 'reconcile' && (
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Reason (optional)</label>
              <input
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Why are you performing this action?"
                className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-indigo-400"
              />
            </div>
          )}

          {/* Reconcile: confirmation */}
          {action === 'reconcile' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                This will recalculate the recommended recovery path for <strong>{feature}</strong> based on current intervention state.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              (action === 'run-task' && !selectedTask) ||
              (action === 'run-agent' && !selectedAgent) ||
              (action === 'replay' && !checkpoint)
            }
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-500 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Execute
          </button>
        </div>
      </div>
    </div>
  )
}
