import { useState, useEffect, useCallback } from 'react'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  description: string
  timestamp: number
  read: boolean
}

function extractFeatureName(file: string): string {
  const match = file.match(/features\/([^/]+)\//)
  return match?.[1] ?? 'unknown'
}

function classifyFileEvent(file: string, event: string): AppNotification | null {
  const ts = Date.now()
  const id = `${ts}-${Math.random().toString(36).slice(2, 6)}`

  // Feature workflow control changed — intervention registered
  if (file.includes('features/') && file.includes('workflow-control.json')) {
    const feature = extractFeatureName(file)
    if (event === 'add') {
      return { id, type: 'success', title: 'Feature created', description: `Workflow initialized for "${feature}"`, timestamp: ts, read: false }
    }
    return { id, type: 'warning', title: 'Intervention registered', description: `Workflow control updated for "${feature}"`, timestamp: ts, read: false }
  }

  // Feature workflow status changed — stage progressed
  if (file.includes('features/') && file.includes('workflow-status.md')) {
    const feature = extractFeatureName(file)
    if (event === 'add') {
      return { id, type: 'success', title: 'Feature started', description: `Workflow status created for "${feature}"`, timestamp: ts, read: false }
    }
    return { id, type: 'info', title: 'Stage progressed', description: `Workflow stage updated for "${feature}"`, timestamp: ts, read: false }
  }

  // Pack installed or updated
  if (file.includes('state/install-manifest.json')) {
    return { id, type: 'success', title: 'Pack installed/updated', description: 'Install manifest was updated', timestamp: ts, read: false }
  }

  // Sync completed
  if (file.includes('state/upgrade-history.json')) {
    return { id, type: 'success', title: 'Sync completed', description: 'Upgrade/sync history was updated', timestamp: ts, read: false }
  }

  // Context refreshed
  if (file.includes('state/context-snapshot.json')) {
    return { id, type: 'success', title: 'Context refreshed', description: 'Project context analysis updated', timestamp: ts, read: false }
  }

  // Project snapshot regenerated
  if (file.includes('state/project-snapshot.json')) {
    return { id, type: 'info', title: 'Snapshot updated', description: 'Project snapshot regenerated', timestamp: ts, read: false }
  }

  // Session links changed
  if (file.includes('session-links.json')) {
    return { id, type: 'info', title: 'Session updated', description: 'Session links were modified', timestamp: ts, read: false }
  }

  // Locale changed
  if (file.includes('state/locale.json')) {
    return { id, type: 'info', title: 'Locale changed', description: 'Output locale was updated', timestamp: ts, read: false }
  }

  // Interaction policy changed
  if (file.includes('state/interaction-policy.json')) {
    return { id, type: 'info', title: 'Policy changed', description: 'Interaction policy was updated', timestamp: ts, read: false }
  }

  // Integration context changed
  if (file.includes('integrations/') && file.endsWith('.md')) {
    return { id, type: 'info', title: 'Integration updated', description: `Integration context modified: ${file.split('/').pop()}`, timestamp: ts, read: false }
  }

  return null
}

const MAX_NOTIFICATIONS = 50

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [toasts, setToasts] = useState<AppNotification[]>([])

  useEffect(() => {
    if (!window.api?.onStateChanged) return
    const cleanup = window.api.onStateChanged(({ event, file }) => {
      const notif = classifyFileEvent(file, event)
      if (!notif) return

      setNotifications((prev) => [notif, ...prev].slice(0, MAX_NOTIFICATIONS))

      // Toast for success, warning, error events
      if (notif.type === 'success' || notif.type === 'error' || notif.type === 'warning') {
        setToasts((prev) => [...prev, notif])
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== notif.id))
        }, 4000)
      }
    })
    return cleanup
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { notifications, toasts, unreadCount, markAllRead, clearAll, dismissToast }
}
