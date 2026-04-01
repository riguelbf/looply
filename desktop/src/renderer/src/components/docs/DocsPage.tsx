import { useTerminalWriter } from '../../hooks/useTerminalWriter'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { BookOpen, ExternalLink, Terminal, FileText } from 'lucide-react'

const workflowDocs = [
  { name: 'idea-to-prd', cmd: '/looply:idea-to-prd', desc: 'Transform raw idea into approved PRD' },
  { name: 'prd-to-stories', cmd: '/looply:prd-to-stories', desc: 'Break PRD into actionable stories' },
  { name: 'story-to-production', cmd: '/looply:story-to-production', desc: 'Deliver story from design to production' },
  { name: 'workflow-status', cmd: '/looply:workflow-status', desc: 'Check progress and resume workflows' },
  { name: 'cloud-workload-design', cmd: '/looply:cloud-workload-design', desc: 'Design cloud topology' },
  { name: 'platform-foundation-evolution', cmd: '/looply:platform-foundation-evolution', desc: 'Evolve platform baseline' },
]

const cliDocs = [
  { cmd: 'looply status', desc: 'Show consolidated project status' },
  { cmd: 'looply install', desc: 'Install a pack into a host' },
  { cmd: 'looply sync --yes', desc: 'Sync managed artifacts to hosts' },
  { cmd: 'looply refresh-context', desc: 'Scan project and update context' },
  { cmd: 'looply doctor', desc: 'Check installation health' },
  { cmd: 'looply validate', desc: 'Validate pack artifacts' },
  { cmd: 'looply run-task <feature> <task>', desc: 'Register manual task execution' },
  { cmd: 'looply run-agent <feature> <agent>', desc: 'Invoke an agent manually' },
  { cmd: 'looply replay <feature> --from <checkpoint>', desc: 'Replay from a checkpoint' },
  { cmd: 'looply reconcile <feature>', desc: 'Recalculate recovery path' },
  { cmd: 'looply history', desc: 'Show upgrade/sync history' },
  { cmd: 'looply list workflow', desc: 'List available workflows' },
  { cmd: 'looply inspect workflow <name>', desc: 'Inspect artifact details' },
]

export function DocsPage(): JSX.Element {
  const { writeCommand } = useTerminalWriter()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Documentation</h1>
        <button
          onClick={() => writeCommand('looply docs open\n')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium hover:bg-slate-100"
        >
          <ExternalLink size={14} /> Open Docs Site
        </button>
      </div>

      {/* Workflow Commands */}
      <Card className="p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          <BookOpen size={16} className="text-indigo-500" /> Workflow Slash Commands
        </h2>
        <p className="text-[10px] text-slate-500 mb-3">Use these in the Claude Code terminal tab</p>
        <div className="space-y-1.5">
          {workflowDocs.map(w => (
            <div key={w.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
              <button
                onClick={() => writeCommand(w.cmd + ' ')}
                className="font-mono text-[11px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 flex-shrink-0"
              >
                {w.cmd}
              </button>
              <span className="text-xs text-slate-500 flex-1">{w.desc}</span>
              <Badge variant="info">{w.name.includes('prd') || w.name.includes('idea') ? 'discovery' : 'delivery'}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* CLI Commands */}
      <Card className="p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Terminal size={16} className="text-emerald-500" /> CLI Commands
        </h2>
        <p className="text-[10px] text-slate-500 mb-3">Run these in the zsh terminal tab or externally</p>
        <div className="space-y-1.5">
          {cliDocs.map(c => (
            <div key={c.cmd} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
              <button
                onClick={() => writeCommand(c.cmd + '\n')}
                className="font-mono text-[11px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 flex-shrink-0 text-left"
              >
                {c.cmd}
              </button>
              <span className="text-xs text-slate-500 flex-1">{c.desc}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card className="p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <FileText size={16} className="text-amber-500" /> Keyboard Shortcuts
        </h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ['⌘K or /', 'Command palette'],
            ['⌘1-9', 'Navigate sidebar pages'],
            ['⌘\\', 'Toggle terminal'],
            ['⌘B', 'Collapse/expand sidebar'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
              <kbd className="font-mono text-[10px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-700 flex-shrink-0">{key}</kbd>
              <span className="text-slate-600">{desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
