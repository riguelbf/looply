import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTerminalWriter } from '../../hooks/useTerminalWriter'
import {
  LayoutDashboard, CheckCircle2, FileText, GitBranch, Users, ListChecks,
  Package, BookOpen, FileCode, Info, Radio, Clock, Server, Stethoscope,
  Settings, Terminal, Search
} from 'lucide-react'

interface PaletteItem {
  id: string
  label: string
  description?: string
  group: 'Pages' | 'Commands' | 'Features'
  icon: React.ReactNode
  action: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  features: string[]
}

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (t.includes(q)) return true
  let qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++
  }
  return qi === q.length
}

export function CommandPalette({ open, onClose, features }: CommandPaletteProps): JSX.Element | null {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { writeCommand } = useTerminalWriter()

  const go = useCallback((path: string) => {
    navigate(path)
    onClose()
  }, [navigate, onClose])

  const run = useCallback((cmd: string) => {
    writeCommand(cmd)
    onClose()
  }, [writeCommand, onClose])

  const allItems = useMemo<PaletteItem[]>(() => {
    const pages: PaletteItem[] = [
      { id: 'p-dash', label: 'Dashboard', group: 'Pages', icon: <LayoutDashboard size={14} />, action: () => go('/') },
      { id: 'p-status', label: 'Status', group: 'Pages', icon: <CheckCircle2 size={14} />, action: () => go('/status') },
      { id: 'p-features', label: 'Features', group: 'Pages', icon: <FileText size={14} />, action: () => go('/features') },
      { id: 'p-workflows', label: 'Workflows', group: 'Pages', icon: <GitBranch size={14} />, action: () => go('/workflows') },
      { id: 'p-agents', label: 'Agents', group: 'Pages', icon: <Users size={14} />, action: () => go('/agents') },
      { id: 'p-tasks', label: 'Tasks', group: 'Pages', icon: <ListChecks size={14} />, action: () => go('/tasks') },
      { id: 'p-packs', label: 'Packs', group: 'Pages', icon: <Package size={14} />, action: () => go('/packs') },
      { id: 'p-knowledge', label: 'Knowledge Base', group: 'Pages', icon: <BookOpen size={14} />, action: () => go('/knowledge') },
      { id: 'p-templates', label: 'Templates', group: 'Pages', icon: <FileCode size={14} />, action: () => go('/templates') },
      { id: 'p-context', label: 'Context', group: 'Pages', icon: <Info size={14} />, action: () => go('/context') },
      { id: 'p-sessions', label: 'Sessions', group: 'Pages', icon: <Radio size={14} />, action: () => go('/sessions') },
      { id: 'p-history', label: 'History', group: 'Pages', icon: <Clock size={14} />, action: () => go('/history') },
      { id: 'p-hosts', label: 'Hosts', group: 'Pages', icon: <Server size={14} />, action: () => go('/hosts') },
      { id: 'p-doctor', label: 'Doctor', group: 'Pages', icon: <Stethoscope size={14} />, action: () => go('/doctor') },
      { id: 'p-settings', label: 'Settings', group: 'Pages', icon: <Settings size={14} />, action: () => go('/settings') },
    ]

    const commands: PaletteItem[] = [
      { id: 'c-status', label: 'looply status', description: 'Show project status', group: 'Commands', icon: <Terminal size={14} />, action: () => run('looply status\n') },
      { id: 'c-refresh', label: 'looply refresh-context', description: 'Refresh project context', group: 'Commands', icon: <Terminal size={14} />, action: () => run('looply refresh-context\n') },
      { id: 'c-sync', label: 'looply sync --yes', description: 'Sync artifacts to hosts', group: 'Commands', icon: <Terminal size={14} />, action: () => run('looply sync --yes\n') },
      { id: 'c-doctor', label: 'looply doctor', description: 'Check installation health', group: 'Commands', icon: <Terminal size={14} />, action: () => run('looply doctor\n') },
      { id: 'c-install', label: 'looply install', description: 'Install a pack', group: 'Commands', icon: <Terminal size={14} />, action: () => run('looply install\n') },
      { id: 'c-validate', label: 'looply validate', description: 'Validate pack artifacts', group: 'Commands', icon: <Terminal size={14} />, action: () => run('looply validate\n') },
      { id: 'c-history', label: 'looply history', description: 'Show upgrade/sync history', group: 'Commands', icon: <Terminal size={14} />, action: () => run('looply history\n') },
      { id: 'c-replay', label: 'looply replay', description: 'Replay from checkpoint', group: 'Commands', icon: <Terminal size={14} />, action: () => run('looply replay ') },
      { id: 'c-reconcile', label: 'looply reconcile', description: 'Reconcile feature workflow', group: 'Commands', icon: <Terminal size={14} />, action: () => run('looply reconcile ') },
      { id: 'c-run-task', label: 'looply run-task', description: 'Execute a task manually', group: 'Commands', icon: <Terminal size={14} />, action: () => run('looply run-task ') },
      { id: 'c-run-agent', label: 'looply run-agent', description: 'Invoke an agent manually', group: 'Commands', icon: <Terminal size={14} />, action: () => run('looply run-agent ') },
      { id: 'c-upgrade', label: 'looply upgrade', description: 'Check and apply updates', group: 'Commands', icon: <Terminal size={14} />, action: () => run('looply upgrade\n') },
      { id: 'c-list', label: 'looply list workflow', description: 'List available workflows', group: 'Commands', icon: <Terminal size={14} />, action: () => run('looply list workflow\n') },
    ]

    const featureItems: PaletteItem[] = features.map((f) => ({
      id: `f-${f}`,
      label: f,
      description: 'Go to feature detail',
      group: 'Features',
      icon: <FileText size={14} />,
      action: () => go(`/features/${f}`)
    }))

    return [...pages, ...commands, ...featureItems]
  }, [go, run, features])

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems
    return allItems.filter((item) =>
      fuzzyMatch(query, item.label) || (item.description && fuzzyMatch(query, item.description))
    )
  }, [query, allItems])

  const grouped = useMemo(() => {
    const groups: Record<string, PaletteItem[]> = {}
    for (const item of filtered) {
      if (!groups[item.group]) groups[item.group] = []
      groups[item.group].push(item)
    }
    return groups
  }, [filtered])

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Clamp selected index
  useEffect(() => {
    if (selectedIndex >= filtered.length) setSelectedIndex(Math.max(0, filtered.length - 1))
  }, [filtered.length, selectedIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter') {
        e.preventDefault()
        filtered[selectedIndex]?.action()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, filtered, selectedIndex])

  if (!open) return null

  let flatIndex = -1

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 modal-backdrop" />

      {/* Palette */}
      <div
        className="relative w-[520px] max-h-[440px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search size={16} className="text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            placeholder="Search pages, commands, features..."
            className="flex-1 text-sm text-slate-900 placeholder-slate-400 outline-none bg-transparent"
          />
          <kbd className="text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 font-mono">esc</kbd>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No results found</div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{group}</div>
                {items.map((item) => {
                  flatIndex++
                  const idx = flatIndex
                  return (
                    <button
                      key={item.id}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                        selectedIndex === idx ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className={selectedIndex === idx ? 'text-indigo-500' : 'text-slate-400'}>{item.icon}</span>
                      <span className="text-sm font-medium flex-1">{item.label}</span>
                      {item.description && (
                        <span className="text-[10px] text-slate-400">{item.description}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="border-t border-slate-100 px-4 py-2 flex items-center gap-4 text-[10px] text-slate-400">
          <span><kbd className="font-mono border rounded px-1">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono border rounded px-1">↵</kbd> select</span>
          <span><kbd className="font-mono border rounded px-1">esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
