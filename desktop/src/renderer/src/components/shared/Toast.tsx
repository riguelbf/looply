import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import type { AppNotification } from '../../hooks/useNotifications'

interface ToastContainerProps {
  toasts: AppNotification[]
  onDismiss: (id: string) => void
}

const iconMap = {
  info: <Info size={16} className="text-blue-500" />,
  success: <CheckCircle2 size={16} className="text-emerald-500" />,
  warning: <AlertTriangle size={16} className="text-amber-500" />,
  error: <XCircle size={16} className="text-red-500" />
}

const bgMap = {
  info: 'border-blue-200 bg-blue-50',
  success: 'border-emerald-200 bg-emerald-50',
  warning: 'border-amber-200 bg-amber-50',
  error: 'border-red-200 bg-red-50'
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps): JSX.Element | null {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-2 w-80">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-3 rounded-lg border shadow-lg animate-slide-in ${bgMap[toast.type]}`}
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          <div className="flex-shrink-0 mt-0.5">{iconMap[toast.type]}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-900">{toast.title}</div>
            <div className="text-[10px] text-slate-600 mt-0.5">{toast.description}</div>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-slate-600 flex-shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
