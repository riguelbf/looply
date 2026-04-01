import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { RefreshCw, Terminal } from 'lucide-react'
import { useTerminalWriter } from '../../hooks/useTerminalWriter'
import { NotificationCenter } from '../shared/NotificationCenter'
import { SyncModal } from '../shared/SyncModal'
import type { AppNotification } from '../../hooks/useNotifications'

export type TerminalPosition = 'right' | 'bottom' | 'fullscreen'

const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/features': 'Features',
  '/workflows': 'Workflows',
  '/agents': 'Agents',
  '/tasks': 'Tasks',
  '/packs': 'Packs',
  '/context': 'Context',
  '/sessions': 'Sessions',
  '/history': 'History',
  '/settings': 'Settings',
  '/status': 'Status',
  '/knowledge': 'Knowledge Base',
  '/templates': 'Templates',
  '/hosts': 'Hosts',
  '/doctor': 'Doctor',
  '/integrations': 'Integrations'
}

interface HeaderProps {
  terminalOpen: boolean
  onToggleTerminal: () => void
  notifications: AppNotification[]
  unreadCount: number
  onMarkAllRead: () => void
  onClearAll: () => void
}

export function Header({ terminalOpen, onToggleTerminal, notifications, unreadCount, onMarkAllRead, onClearAll }: HeaderProps): JSX.Element {
  const location = useLocation()
  const currentRoute = routeNames[location.pathname] ?? 'Page'
  const { writeCommand } = useTerminalWriter()
  const [syncOpen, setSyncOpen] = useState(false)

  return (
    <>
      <div className="h-12 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 flex-shrink-0 flex items-center justify-between px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">Home</span>
          <span className="text-slate-400 text-xs">/</span>
          <span className="text-slate-900 text-sm font-semibold">{currentRoute}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => writeCommand('looply refresh-context\n')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-xs font-medium hover:bg-slate-100 transition-colors titlebar-no-drag"
          >
            <RefreshCw size={14} />
            Refresh Context
          </button>

          <button
            onClick={() => setSyncOpen(true)}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity titlebar-no-drag"
          >
            Sync
          </button>

          <NotificationCenter
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllRead={onMarkAllRead}
            onClearAll={onClearAll}
          />

          <button
            onClick={onToggleTerminal}
            className={`p-1.5 rounded-lg border transition-colors titlebar-no-drag ${
              terminalOpen
                ? 'border-indigo-300 bg-indigo-50 text-indigo-500'
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
            title={terminalOpen ? 'Hide terminal (⌘\\)' : 'Show terminal (⌘\\)'}
          >
            <Terminal size={16} />
          </button>
        </div>
      </div>

      <SyncModal open={syncOpen} onClose={() => setSyncOpen(false)} onSync={writeCommand} />
    </>
  )
}
