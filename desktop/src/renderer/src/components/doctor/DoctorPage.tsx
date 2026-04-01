import { useCallback } from 'react'
import { useLooplyData } from '../../hooks/useLooplyData'
import { Card } from '../shared/Card'
import { Badge } from '../shared/Badge'
import { useTerminalWriter } from '../../hooks/useTerminalWriter'
import { CheckCircle2, XCircle, Stethoscope, AlertTriangle, FileWarning } from 'lucide-react'
import type { InstallManifest, ValidationReport } from '../../../../preload/types'

interface HealthCheck {
  label: string
  status: 'ok' | 'warn' | 'fail'
  detail: string
}

function buildChecks(manifest: InstallManifest | null): HealthCheck[] {
  const checks: HealthCheck[] = []
  if (!manifest) {
    checks.push({ label: 'Installation', status: 'fail', detail: 'No install manifest found. Run looply install.' })
    return checks
  }
  checks.push({
    label: 'Installation',
    status: manifest.installs.length > 0 ? 'ok' : 'fail',
    detail: manifest.installs.length > 0 ? `${manifest.installs.length} host(s) installed` : 'No hosts installed'
  })
  for (const inst of manifest.installs) {
    checks.push({ label: `Host: ${inst.host} (${inst.scope})`, status: 'ok', detail: `Pack: ${inst.pack} | ${inst.managedFiles?.length ?? 0} managed, ${inst.customFiles?.length ?? 0} custom` })
    checks.push({ label: `Locale (${inst.host})`, status: inst.locale ? 'ok' : 'warn', detail: inst.locale || 'Not set' })
    checks.push({ label: `Project Mode (${inst.host})`, status: inst.projectMode ? 'ok' : 'warn', detail: inst.projectMode || 'Not set' })
  }
  return checks
}

export function DoctorPage(): JSX.Element {
  const manifestFetcher = useCallback(() => window.api.getManifest() as Promise<InstallManifest | null>, [])
  const validateFetcher = useCallback(() => window.api.validate() as Promise<ValidationReport>, [])
  const { data: manifest, loading } = useLooplyData(manifestFetcher)
  const { data: validation } = useLooplyData(validateFetcher)
  const { writeCommand } = useTerminalWriter()

  if (loading) return <div className="text-slate-400 text-sm p-8">Running health checks...</div>

  const checks = buildChecks(manifest)
  const okCount = checks.filter(c => c.status === 'ok').length
  const failCount = checks.filter(c => c.status === 'fail').length
  const warnCount = checks.filter(c => c.status === 'warn').length

  const valErrors = validation?.issues?.filter(i => i.severity === 'error') ?? []
  const valWarnings = validation?.issues?.filter(i => i.severity === 'warning') ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Doctor</h1>
        <div className="flex gap-2">
          <button
            onClick={() => writeCommand('looply validate\n')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-xs font-medium hover:bg-slate-100"
          >
            <FileWarning size={14} /> Full Validate
          </button>
          <button
            onClick={() => writeCommand('looply doctor\n')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-xs font-medium hover:bg-slate-100"
          >
            <Stethoscope size={14} /> Full Doctor
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-3">
        <Card className="p-3 flex items-center gap-2 flex-1">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span className="text-sm font-semibold text-slate-900">{okCount}</span>
          <span className="text-xs text-slate-500">passed</span>
        </Card>
        <Card className="p-3 flex items-center gap-2 flex-1">
          <XCircle size={16} className="text-red-500" />
          <span className="text-sm font-semibold text-slate-900">{failCount + valErrors.length}</span>
          <span className="text-xs text-slate-500">errors</span>
        </Card>
        <Card className="p-3 flex items-center gap-2 flex-1">
          <AlertTriangle size={16} className="text-amber-500" />
          <span className="text-sm font-semibold text-slate-900">{warnCount + valWarnings.length}</span>
          <span className="text-xs text-slate-500">warnings</span>
        </Card>
      </div>

      {/* Health Checks */}
      <Card className="p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Health Checks</h2>
        <div className="space-y-2">
          {checks.map((c, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              {c.status === 'ok' && <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />}
              {c.status === 'fail' && <XCircle size={16} className="text-red-500 flex-shrink-0" />}
              {c.status === 'warn' && <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900">{c.label}</div>
                <div className="text-[10px] text-slate-500">{c.detail}</div>
              </div>
              <Badge variant={c.status === 'ok' ? 'success' : c.status === 'fail' ? 'danger' : 'warning'}>{c.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Validation Results */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900">
            Pack Validation {validation ? `(${validation.total} artifacts)` : ''}
          </h2>
          {validation?.ok && <Badge variant="success">All valid</Badge>}
        </div>
        {!validation ? (
          <div className="text-xs text-slate-400">Loading validation...</div>
        ) : validation.issues.length === 0 ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span className="text-xs text-emerald-700">All {validation.total} artifacts passed validation</span>
          </div>
        ) : (
          <div className="space-y-2">
            {validation.issues.map((issue, i) => (
              <div key={i} className={`flex items-start gap-3 p-2.5 rounded-lg border ${
                issue.severity === 'error' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
              }`}>
                {issue.severity === 'error'
                  ? <XCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                  : <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                }
                <div className="flex-1 min-w-0">
                  <code className="text-[10px] text-slate-600">{issue.file}</code>
                  <div className="text-xs text-slate-700 mt-0.5">{issue.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
