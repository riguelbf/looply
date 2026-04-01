import { useState, useEffect } from 'react'
import { X, RefreshCw, Package, CheckCircle2 } from 'lucide-react'
import { Badge } from './Badge'
import type { SyncPlan } from '../../../../preload/types'

interface SyncModalProps {
  open: boolean
  onClose: () => void
  onSync: (cmd: string) => void
}

export function SyncModal({ open, onClose, onSync }: SyncModalProps): JSX.Element | null {
  const [plan, setPlan] = useState<SyncPlan | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    window.api.getSyncPlan().then((p: unknown) => {
      setPlan(p as SyncPlan)
      setLoading(false)
    })
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 modal-backdrop" />
      <div className="relative bg-white rounded-xl shadow-2xl modal-content border border-slate-200 w-[500px] max-h-[500px] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw size={16} className="text-indigo-500" /> Sync Plan
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-xs text-slate-400 text-center py-8">Loading sync plan...</div>
          ) : !plan?.installs?.length ? (
            <div className="text-center py-8">
              <Package size={32} className="text-slate-300 mx-auto mb-2" />
              <div className="text-xs text-slate-500">No installations found. Install a pack first.</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 mb-2">
                Syncing will update managed artifacts for {plan.installs.length} installation(s) from {plan.available} available pack(s).
              </div>
              {plan.installs.map((inst, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="info">{inst.host}</Badge>
                    <Badge>{inst.scope}</Badge>
                    <span className="text-xs font-semibold text-slate-900">{inst.pack}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="p-2 bg-white rounded border border-slate-100 text-center">
                      <div className="text-lg font-bold text-slate-900">{inst.managedFiles}</div>
                      <div className="text-slate-500">managed</div>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-100 text-center">
                      <div className="text-lg font-bold text-slate-900">{inst.mergeableFiles}</div>
                      <div className="text-slate-500">mergeable</div>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-100 text-center">
                      <div className="text-lg font-bold text-slate-900">{inst.customFiles}</div>
                      <div className="text-slate-500">custom</div>
                    </div>
                  </div>
                  {inst.updatedAt && (
                    <div className="text-[9px] text-slate-400 mt-2">Last synced: {new Date(inst.updatedAt).toLocaleString()}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200">Cancel</button>
          <div className="flex gap-2">
            <button
              onClick={() => { onSync('looply sync --yes\n'); onClose() }}
              disabled={!plan?.installs?.length}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-500 hover:opacity-90 disabled:opacity-40"
            >
              Apply Sync
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
