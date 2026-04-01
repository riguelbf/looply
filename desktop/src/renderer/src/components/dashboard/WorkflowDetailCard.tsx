import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { useTerminalWriter } from '../../hooks/useTerminalWriter'
import type { FeatureState } from '../../../../preload/types'

interface WorkflowDetailCardProps {
  features: FeatureState[]
}

const storyToProductionStages = [
  { id: 'technical-design', label: 'Technical Design', agent: 'architect', task: 'create-tech-spec' },
  { id: 'architecture-decision', label: 'Architecture Decision', agent: 'architect', task: 'create-adr' },
  { id: 'implementation', label: 'Implementation', agent: 'backend', task: 'implement-api' },
  { id: 'technical-review', label: 'Technical Review', agent: 'reviewer', task: 'review-code' },
  { id: 'release-preparation', label: 'Release Preparation', agent: 'devops', task: 'prepare-service-release' },
  { id: 'operability-review', label: 'Operability Review', agent: 'sre', task: 'assess-service-operability' }
]

const gates = [
  { after: 'architecture-decision', label: 'design-approved' },
  { after: 'technical-review', label: 'implementation-reviewed' },
  { after: 'operability-review', label: 'release-ready' }
]

function getStageStatus(stageId: string, currentStage: string): 'completed' | 'active' | 'pending' {
  const stageIndex = storyToProductionStages.findIndex((s) => s.id === stageId)
  const currentIndex = storyToProductionStages.findIndex((s) => s.id === currentStage)
  if (stageIndex < currentIndex) return 'completed'
  if (stageIndex === currentIndex) return 'active'
  return 'pending'
}

export function WorkflowDetailCard({ features }: WorkflowDetailCardProps): JSX.Element {
  const activeFeature = features[0]
  const { writeCommand } = useTerminalWriter()
  const featureName = activeFeature?.feature ?? '<feature>'

  return (
    <Card className="p-6">
      <h2 className="text-base font-bold text-slate-900">Workflow Detail</h2>
      <p className="text-[11px] text-slate-500 mb-4">
        {activeFeature ? `${activeFeature.feature} / ${activeFeature.workflow}` : 'No active feature'}
      </p>

      {activeFeature ? (
        <>
          <div className="space-y-0">
            {storyToProductionStages.map((stage, i) => {
              const status = getStageStatus(stage.id, activeFeature.currentStage)
              const gate = gates.find((g) => g.after === stage.id)

              return (
                <div key={stage.id}>
                  <div className="flex items-start gap-3 py-2">
                    <div className="flex flex-col items-center">
                      {status === 'completed' && <CheckCircle2 size={20} className="text-emerald-500" />}
                      {status === 'active' && <Loader2 size={20} className="text-indigo-500 animate-spin" />}
                      {status === 'pending' && <Circle size={20} className="text-slate-300" />}
                      {i < storyToProductionStages.length - 1 && (
                        <div className={`w-0.5 h-6 mt-1 ${
                          status === 'completed' ? 'bg-emerald-500' : 'bg-slate-200'
                        } ${status === 'pending' ? 'border-l border-dashed border-slate-300 w-0' : ''}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold ${status === 'pending' ? 'text-slate-400' : 'text-slate-900'}`}>
                        {stage.label}
                      </div>
                      <div className={`text-[10px] ${status === 'pending' ? 'text-slate-300' : 'text-slate-500'}`}>
                        {stage.agent} / {stage.task}
                      </div>
                    </div>
                    {status === 'completed' && <Badge variant="success">Completed</Badge>}
                    {status === 'active' && <Badge variant="purple">Active</Badge>}
                    {status === 'pending' && <Badge>Pending</Badge>}
                  </div>
                  {gate && (
                    <div className="flex items-center gap-2 ml-8 mb-1">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                        status === 'completed' || status === 'active'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}>GATE</span>
                      <span className={`text-[10px] font-semibold ${
                        status === 'completed' || status === 'active' ? 'text-emerald-600' : 'text-slate-400'
                      }`}>{gate.label}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Action buttons — wired to terminal */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                const cmd = activeFeature.nextCommand || `looply run-task ${featureName} ${activeFeature.nextTask || '<task>'}`
                writeCommand(cmd + '\n')
              }}
              className="px-3 py-1.5 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-semibold"
              title={activeFeature.nextCommand || 'Continue workflow'}
            >
              Continue
            </button>
            <button
              onClick={() => writeCommand(`looply replay ${featureName} --from ${activeFeature.currentStage || '<stage>'} --reason ""`)}
              className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200"
            >
              Replay
            </button>
            <button
              onClick={() => writeCommand(`looply reconcile ${featureName}\n`)}
              className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200"
            >
              Reconcile
            </button>
            <button
              onClick={() => writeCommand(`looply run-task ${featureName} `)}
              className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200"
            >
              Run Task
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-slate-400 text-sm">No active workflow</div>
      )}
    </Card>
  )
}
