import { useParams, Link } from 'react-router-dom'
import { useCallback, useState } from 'react'
import { useLooplyData } from '../../hooks/useLooplyData'
import { useTerminalWriter } from '../../hooks/useTerminalWriter'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { TagPill } from '../shared/TagPill'
import { WorkflowActionModal, type ActionType } from './WorkflowActionModal'
import { StartWorkflowModal } from '../shared/StartWorkflowModal'
import { ArrowLeft, Play, Zap, RotateCcw, RefreshCw, Rocket } from 'lucide-react'
import type { FeatureControl } from '../../../../preload/types'

export function FeatureDetailPage(): JSX.Element {
  const { name } = useParams<{ name: string }>()
  const { writeCommand } = useTerminalWriter()
  const [modalAction, setModalAction] = useState<ActionType | null>(null)
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false)

  const fetcher = useCallback(
    () => window.api.getFeatureControl(name!) as Promise<FeatureControl | null>,
    [name]
  )
  const { data: control, loading } = useLooplyData(fetcher)

  if (loading) return <div className="text-slate-400 text-sm p-8">Loading feature...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/features" className="flex items-center gap-1 text-xs text-indigo-500 hover:underline">
            <ArrowLeft size={12} /> Features
          </Link>
          <h1 className="text-lg font-bold text-slate-900">{name}</h1>
        </div>

        {/* Workflow action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWorkflowModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-semibold hover:opacity-90"
          >
            <Rocket size={12} /> Start Workflow
          </button>
          <button
            onClick={() => setModalAction('run-task')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 text-xs font-medium hover:bg-orange-100"
          >
            <Play size={12} /> Run Task
          </button>
          <button
            onClick={() => setModalAction('run-agent')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-xs font-medium hover:bg-purple-100"
          >
            <Zap size={12} /> Run Agent
          </button>
          <button
            onClick={() => setModalAction('replay')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100"
          >
            <RotateCcw size={12} /> Replay
          </button>
          <button
            onClick={() => setModalAction('reconcile')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100"
          >
            <RefreshCw size={12} /> Reconcile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Overview */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Overview</h2>
          <div className="space-y-2 text-xs">
            <Row label="Workflow" value={control?.workflow ?? 'N/A'} />
            <div className="flex justify-between">
              <span className="text-slate-500">Execution Mode</span>
              <Badge variant={control?.executionMode === 'workflow' ? 'success' : 'warning'}>
                {control?.executionMode ?? 'N/A'}
              </Badge>
            </div>
            <Row label="Last Updated" value={control?.updatedAt ? new Date(control.updatedAt).toLocaleString() : 'N/A'} />
            <Row label="Last Reconciled" value={control?.lastReconciledAt ? new Date(control.lastReconciledAt).toLocaleString() : 'Never'} />
            {control?.replayedFrom && (
              <div className="flex justify-between">
                <span className="text-slate-500">Replayed From</span>
                <TagPill color="amber">{control.replayedFrom}</TagPill>
              </div>
            )}
            {control?.recommendedRecoveryCommand && (
              <div className="flex justify-between items-start">
                <span className="text-slate-500">Recovery</span>
                <button
                  onClick={() => writeCommand(control.recommendedRecoveryCommand + '\n')}
                  className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded hover:bg-indigo-100 hover:text-indigo-600 cursor-pointer text-right max-w-[200px] truncate"
                  title={`Click to run: ${control.recommendedRecoveryCommand}`}
                >
                  {control.recommendedRecoveryCommand}
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Superseded Outputs */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Superseded Outputs</h2>
          {control?.supersededOutputs?.length ? (
            <div className="flex flex-wrap gap-1">
              {control.supersededOutputs.map((o) => <TagPill key={o} color="red">{o}</TagPill>)}
            </div>
          ) : (
            <div className="text-xs text-slate-400">None</div>
          )}

          {control?.recommendedRecoveryWorkflow && (
            <div className="mt-4">
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Recommended Recovery</h3>
              <TagPill color="blue">{control.recommendedRecoveryWorkflow}</TagPill>
            </div>
          )}
        </Card>
      </div>

      {/* Interventions */}
      <Card className="p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3">
          Interventions ({control?.interventions?.length ?? 0})
        </h2>
        {control?.interventions?.length ? (
          <div className="space-y-3">
            {control.interventions.map((iv) => (
              <div key={iv.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={iv.type === 'replay' ? 'warning' : iv.type === 'reconcile' ? 'info' : 'purple'}>
                      {iv.type}
                    </Badge>
                    <span className="text-xs font-medium text-slate-900">{iv.summary}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(iv.createdAt).toLocaleString()}</span>
                </div>
                {iv.reason && <div className="text-[10px] text-slate-500">Reason: {iv.reason}</div>}
                {iv.agent && <div className="text-[10px] text-slate-500">Agent: {iv.agent}{iv.task ? ` / ${iv.task}` : ''}</div>}
                {iv.checkpoint && <div className="text-[10px] text-slate-500">Checkpoint: {iv.checkpoint}</div>}
                {iv.supersededOutputs?.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {iv.supersededOutputs.map(o => <TagPill key={o} color="red">{o}</TagPill>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400">No interventions recorded. Use the action buttons above to register workflow interventions.</div>
        )}
      </Card>

      {/* Action Modal */}
      <WorkflowActionModal
        open={modalAction !== null}
        action={modalAction ?? 'run-task'}
        feature={name!}
        onClose={() => setModalAction(null)}
        onExecute={writeCommand}
      />

      {/* Start Workflow Modal */}
      <StartWorkflowModal
        open={workflowModalOpen}
        feature={name!}
        onClose={() => setWorkflowModalOpen(false)}
        onExecute={writeCommand}
      />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-medium">{value}</span>
    </div>
  )
}
