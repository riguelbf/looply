import { useProjectSnapshot } from '../../hooks/useProjectSnapshot'

export function StatusBar(): JSX.Element {
  const { data: snapshot } = useProjectSnapshot()
  const project = snapshot?.project

  return (
    <div className="h-5 bg-[#1E293B] flex items-center px-4 gap-6 flex-shrink-0">
      <span className="text-[10px] text-slate-500">
        Host: <span className="text-slate-400">{snapshot?.hosts?.[0]?.host ?? 'N/A'}</span>
      </span>
      <span className="text-[10px] text-slate-500">
        Scope: <span className="text-slate-400">{snapshot?.installation?.installs?.[0]?.scope ?? 'N/A'}</span>
      </span>
      <span className="text-[10px] text-slate-500">
        Mode: <span className="text-slate-400">{project?.interactionMode ?? 'N/A'}</span>
      </span>
      <span className="text-[10px] text-slate-500">
        Locale: <span className="text-slate-400">{project?.locale ?? 'N/A'}</span>
      </span>
      <span className="text-[10px] text-slate-500">
        Pack: <span className="text-slate-400">{snapshot?.installation?.installs?.[0]?.pack ?? 'N/A'}</span>
      </span>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-[10px] text-slate-500">Connected</span>
      </div>
    </div>
  )
}
