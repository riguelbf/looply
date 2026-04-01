import { useState, useCallback } from 'react'
import { useProjectSnapshot } from '../../hooks/useProjectSnapshot'
import { useTerminalWriter } from '../../hooks/useTerminalWriter'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { ArrowUpCircle, RefreshCw, Check } from 'lucide-react'

export function SettingsPage(): JSX.Element {
  const { data: snapshot, refresh } = useProjectSnapshot()
  const { writeCommand } = useTerminalWriter()
  const project = snapshot?.project
  const installs = snapshot?.installation?.installs ?? []

  const [saving, setSaving] = useState<string | null>(null)

  const handleLocaleChange = useCallback(async (locale: string) => {
    setSaving('locale')
    await window.api.setLocale(locale)
    setSaving(null)
    refresh()
  }, [refresh])

  const handleModeChange = useCallback(async (mode: string) => {
    setSaving('mode')
    await window.api.setInteractionMode(mode)
    setSaving(null)
    refresh()
  }, [refresh])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Settings</h1>
        <div className="flex gap-2">
          <button
            onClick={() => writeCommand('looply check-updates\n')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium hover:bg-slate-100"
          >
            <ArrowUpCircle size={14} /> Check Updates
          </button>
          <button
            onClick={() => writeCommand('looply upgrade --yes\n')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-semibold hover:opacity-90"
          >
            <RefreshCw size={14} /> Upgrade
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Editable Configuration */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Locale</label>
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={project?.locale ?? 'en'}
                  onChange={e => handleLocaleChange(e.target.value)}
                  disabled={saving === 'locale'}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-indigo-400 disabled:opacity-50"
                >
                  <option value="en">English (en)</option>
                  <option value="pt-BR">Portugues Brasil (pt-BR)</option>
                </select>
                {saving === 'locale' && <RefreshCw size={12} className="text-indigo-500 animate-spin" />}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Interaction Mode</label>
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={project?.interactionMode ?? 'balanced'}
                  onChange={e => handleModeChange(e.target.value)}
                  disabled={saving === 'mode'}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-indigo-400 disabled:opacity-50"
                >
                  <option value="guided">Guided — more prompts and confirmations</option>
                  <option value="balanced">Balanced — mix of autonomy and verification</option>
                  <option value="autonomous">Autonomous — fewer clarifications</option>
                </select>
                {saving === 'mode' && <RefreshCw size={12} className="text-indigo-500 animate-spin" />}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Project Mode</label>
              <div className="mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                {project?.projectMode ?? 'N/A'}
              </div>
              <div className="text-[9px] text-slate-400 mt-1">Project mode is set during installation</div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Inference Policy</label>
              <div className="mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                {project?.inferencePolicy ?? 'N/A'}
              </div>
            </div>
          </div>
        </Card>

        {/* Installations */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Installations</h2>
          {installs.length === 0 ? (
            <div className="text-xs text-slate-400">No installations found</div>
          ) : (
            <div className="space-y-3">
              {installs.map((inst, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="info">{inst.host}</Badge>
                    <Badge>{inst.scope}</Badge>
                    <span className="text-xs font-medium text-slate-900">{inst.pack}</span>
                  </div>
                  <div className="flex gap-3 mt-1 text-[10px]">
                    <span className="text-slate-500">{inst.managedFiles} managed</span>
                    <span className="text-slate-500">{inst.mergeableFiles} mergeable</span>
                    <span className="text-slate-500">{inst.customFiles} custom</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Hosts */}
        <Card className="p-5 col-span-2">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Hosts</h2>
          {(snapshot?.hosts ?? []).length === 0 ? (
            <div className="text-xs text-slate-400">No hosts configured</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(snapshot?.hosts ?? []).map((h, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-900">{h.host}</span>
                    <Badge>{h.scope}</Badge>
                    <Check size={12} className="text-emerald-500" />
                  </div>
                  <div className="text-[10px] text-slate-500">Pack: {h.pack} · {h.workflowCount} workflows</div>
                  {h.aliases?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {h.aliases.map(a => (
                        <code key={a} className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{a}</code>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
