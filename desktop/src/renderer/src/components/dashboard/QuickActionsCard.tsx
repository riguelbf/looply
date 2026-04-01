import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../shared/Card'
import { Plus, Play, RotateCcw, RefreshCw, Package, Zap } from 'lucide-react'
import { useTerminalWriter } from '../../hooks/useTerminalWriter'
import { NewFeatureModal } from '../shared/NewFeatureModal'
import { ActionModal, type QuickActionType } from '../shared/ActionModal'

interface ActionButtonProps {
  icon: React.ReactNode
  label: string
  description: string
  color: string
  borderColor: string
  bgColor: string
  onClick: () => void
}

function ActionButton({ icon, label, description, color, borderColor, bgColor, onClick }: ActionButtonProps): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:opacity-80 ${bgColor} ${borderColor}`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div className="text-left">
        <div className="text-[11px] font-semibold text-slate-900">{label}</div>
        <div className="text-[9px] text-slate-500">{description}</div>
      </div>
    </button>
  )
}

export function QuickActionsCard(): JSX.Element {
  const { writeCommand } = useTerminalWriter()
  const navigate = useNavigate()
  const [newFeatureOpen, setNewFeatureOpen] = useState(false)
  const [actionModal, setActionModal] = useState<QuickActionType | null>(null)

  return (
    <>
      <Card className="p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2">
          <ActionButton
            icon={<Plus size={14} className="text-white" />}
            label="New Feature"
            description="Create & start workflow"
            color="bg-blue-500"
            bgColor="bg-blue-50"
            borderColor="border-blue-200"
            onClick={() => setNewFeatureOpen(true)}
          />
          <ActionButton
            icon={<Zap size={14} className="text-white" />}
            label="Run Agent"
            description="Select feature + agent"
            color="bg-purple-600"
            bgColor="bg-purple-50"
            borderColor="border-purple-200"
            onClick={() => setActionModal('run-agent')}
          />
          <ActionButton
            icon={<Play size={14} className="text-white" />}
            label="Run Task"
            description="Select feature + task"
            color="bg-orange-500"
            bgColor="bg-orange-50"
            borderColor="border-orange-200"
            onClick={() => setActionModal('run-task')}
          />
          <ActionButton
            icon={<RotateCcw size={14} className="text-white" />}
            label="Replay"
            description="Rewind from checkpoint"
            color="bg-emerald-600"
            bgColor="bg-emerald-50"
            borderColor="border-emerald-200"
            onClick={() => setActionModal('replay')}
          />
          <ActionButton
            icon={<RefreshCw size={14} className="text-white" />}
            label="Reconcile"
            description="Select feature"
            color="bg-red-500"
            bgColor="bg-red-50"
            borderColor="border-red-200"
            onClick={() => setActionModal('reconcile')}
          />
          <ActionButton
            icon={<Package size={14} className="text-white" />}
            label="Install Pack"
            description="Go to packs"
            color="bg-slate-600"
            bgColor="bg-slate-50"
            borderColor="border-slate-200"
            onClick={() => navigate('/packs')}
          />
        </div>
      </Card>

      <NewFeatureModal open={newFeatureOpen} onClose={() => setNewFeatureOpen(false)} />
      <ActionModal open={actionModal !== null} action={actionModal ?? 'run-task'} onClose={() => setActionModal(null)} onExecute={writeCommand} />
    </>
  )
}
