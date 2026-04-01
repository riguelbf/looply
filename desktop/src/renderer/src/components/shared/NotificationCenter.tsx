import { useState, useRef, useEffect } from 'react'
import { Bell, CheckCircle2, AlertTriangle, XCircle, Info, Check, Trash2 } from 'lucide-react'
import type { AppNotification } from '../../hooks/useNotifications'

interface NotificationCenterProps {
  notifications: AppNotification[]
  unreadCount: number
  onMarkAllRead: () => void
  onClearAll: () => void
}

const iconMap = {
  info: <Info size={14} className="text-blue-500" />,
  success: <CheckCircle2 size={14} className="text-emerald-500" />,
  warning: <AlertTriangle size={14} className="text-amber-500" />,
  error: <XCircle size={14} className="text-red-500" />
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function NotificationCenter({ notifications, unreadCount, onMarkAllRead, onClearAll }: NotificationCenterProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(!open); if (!open) onMarkAllRead() }}
        className="relative p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors titlebar-no-drag"
      >
        <Bell size={16} className="text-slate-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[7px] text-white font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-10 w-80 max-h-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[150] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900">Notifications</span>
            <div className="flex gap-1">
              <button
                onClick={onMarkAllRead}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                title="Mark all read"
              >
                <Check size={12} />
              </button>
              <button
                onClick={onClearAll}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                title="Clear all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">No notifications</div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-2.5 px-4 py-2.5 border-b border-slate-50 ${
                    n.read ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">{iconMap[n.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-slate-900">{n.title}</div>
                    <div className="text-[10px] text-slate-500">{n.description}</div>
                  </div>
                  <span className="text-[9px] text-slate-400 flex-shrink-0 whitespace-nowrap">{timeAgo(n.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
