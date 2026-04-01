import { useCallback, useState } from 'react'
import { useLooplyData } from '../../hooks/useLooplyData'
import { useTerminalWriter } from '../../hooks/useTerminalWriter'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { EmptyState } from '../shared/EmptyState'
import { Radio, Plus, Unlink, X } from 'lucide-react'
import type { SessionLinks } from '../../../../preload/types'

function LinkSessionModal({ open, onClose, onLink }: { open: boolean; onClose: () => void; onLink: (cmd: string) => void }): JSX.Element | null {
  const [label, setLabel] = useState('')
  const [feature, setFeature] = useState('')
  const [workflow, setWorkflow] = useState('')

  if (!open) return null

  const handleSubmit = () => {
    const l = label.trim()
    const f = feature.trim()
    if (!l || !f) return
    let cmd = `looply sessions link ${l} ${f}`
    if (workflow.trim()) cmd += ` --workflow ${workflow.trim()}`
    onLink(cmd + '\n')
    onClose()
    setLabel(''); setFeature(''); setWorkflow('')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 modal-backdrop" />
      <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-[400px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Link Session</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Session Label</label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. session-01"
              className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400" autoFocus />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Feature</label>
            <input value={feature} onChange={e => setFeature(e.target.value)} placeholder="e.g. pix-webhook-retry"
              className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Workflow (optional)</label>
            <input value={workflow} onChange={e => setWorkflow(e.target.value)} placeholder="e.g. story-to-production"
              className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400"
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200">Cancel</button>
          <button onClick={handleSubmit} disabled={!label.trim() || !feature.trim()}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-500 hover:opacity-90 disabled:opacity-40">
            Link
          </button>
        </div>
      </div>
    </div>
  )
}

export function SessionListPage(): JSX.Element {
  const fetcher = useCallback(() => window.api.getSessions() as Promise<SessionLinks | null>, [])
  const { data, loading } = useLooplyData(fetcher)
  const { writeCommand } = useTerminalWriter()
  const [linkOpen, setLinkOpen] = useState(false)
  const sessions = data?.sessions ?? []

  if (loading) return <div className="text-slate-400 text-sm p-8">Loading sessions...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Sessions</h1>
        <button
          onClick={() => setLinkOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-semibold hover:opacity-90"
        >
          <Plus size={14} /> Link Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="No sessions"
          description="Link a session to track workflow progress across multiple conversations"
          action={{ label: 'Link Session', onClick: () => setLinkOpen(true) }}
        />
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <Card key={s.label} className="p-4 flex items-center gap-3">
              <Radio size={16} className="text-indigo-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900">{s.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Feature: {s.feature} {s.workflow && `/ ${s.workflow}`}
                </div>
              </div>
              {s.lastCommand && <Badge>{s.lastCommand}</Badge>}
              {s.lastUpdatedAt && (
                <span className="text-[10px] text-slate-400">{new Date(s.lastUpdatedAt).toLocaleString()}</span>
              )}
              <button
                onClick={() => {
                  if (confirm(`Unlink session "${s.label}"?`)) {
                    writeCommand(`looply sessions unlink ${s.label}\n`)
                  }
                }}
                className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                title="Unlink session"
              >
                <Unlink size={14} />
              </button>
            </Card>
          ))}
        </div>
      )}

      <LinkSessionModal open={linkOpen} onClose={() => setLinkOpen(false)} onLink={writeCommand} />
    </div>
  )
}
