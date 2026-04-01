import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { TerminalPanel, type TerminalPanelHandle, type TerminalPosition } from './TerminalPanel'
import { StatusBar } from './StatusBar'
import { CommandPalette } from '../shared/CommandPalette'
import { ToastContainer } from '../shared/Toast'
import { TerminalWriterContext } from '../../hooks/useTerminalWriter'
import { useProjectSnapshot } from '../../hooks/useProjectSnapshot'
import { useNotifications } from '../../hooks/useNotifications'

const STORAGE_KEY_TERMINAL_WIDTH = 'looply:terminal-width'
const STORAGE_KEY_TERMINAL_HEIGHT = 'looply:terminal-height'
const STORAGE_KEY_TERMINAL_OPEN = 'looply:terminal-open'
const STORAGE_KEY_TERMINAL_POS = 'looply:terminal-position'
const STORAGE_KEY_SIDEBAR_COLLAPSED = 'looply:sidebar-collapsed'

const sidebarRoutes = [
  '/', '/status', '/features', '/workflows', '/agents',
  '/tasks', '/packs', '/knowledge', '/context', '/settings'
]

function loadStored<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v !== null ? JSON.parse(v) : fallback
  } catch { return fallback }
}

export function AppShell({ children }: { children: React.ReactNode }): JSX.Element {
  const [terminalOpen, setTerminalOpen] = useState(() => loadStored(STORAGE_KEY_TERMINAL_OPEN, true))
  const [terminalPosition, setTerminalPosition] = useState<TerminalPosition>(() => loadStored(STORAGE_KEY_TERMINAL_POS, 'right'))
  const [terminalWidth, setTerminalWidth] = useState(() => loadStored(STORAGE_KEY_TERMINAL_WIDTH, 340))
  const [terminalHeight, setTerminalHeight] = useState(() => loadStored(STORAGE_KEY_TERMINAL_HEIGHT, 300))
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => loadStored(STORAGE_KEY_SIDEBAR_COLLAPSED, false))
  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [resizing, setResizing] = useState(false)
  const terminalRef = useRef<TerminalPanelHandle>(null)
  const { data: snapshot } = useProjectSnapshot()
  const { notifications, toasts, unreadCount, markAllRead, clearAll, dismissToast } = useNotifications()
  const navigate = useNavigate()

  useEffect(() => { localStorage.setItem(STORAGE_KEY_TERMINAL_OPEN, JSON.stringify(terminalOpen)) }, [terminalOpen])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_TERMINAL_WIDTH, JSON.stringify(terminalWidth)) }, [terminalWidth])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_TERMINAL_HEIGHT, JSON.stringify(terminalHeight)) }, [terminalHeight])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_TERMINAL_POS, JSON.stringify(terminalPosition)) }, [terminalPosition])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_SIDEBAR_COLLAPSED, JSON.stringify(sidebarCollapsed)) }, [sidebarCollapsed])

  const writeCommand = useCallback((command: string) => {
    if (!terminalOpen) setTerminalOpen(true)
    setTimeout(() => {
      terminalRef.current?.writeToActiveTerminal(command)
    }, terminalOpen ? 0 : 200)
  }, [terminalOpen])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key === 'k') { e.preventDefault(); setPaletteOpen(true); return }
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) { e.preventDefault(); setPaletteOpen(true); return }
      if (meta && e.key >= '1' && e.key <= '9') { e.preventDefault(); const idx = parseInt(e.key) - 1; if (idx < sidebarRoutes.length) navigate(sidebarRoutes[idx]); return }
      if (meta && e.key === '\\') { e.preventDefault(); setTerminalOpen(prev => !prev) }
      if (meta && e.key === 'b') { e.preventDefault(); setSidebarCollapsed(prev => !prev) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  const handleResizeH = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); setResizing(true)
    const startX = e.clientX; const startW = terminalWidth
    const move = (ev: MouseEvent) => setTerminalWidth(Math.min(700, Math.max(200, startW + (startX - ev.clientX))))
    const up = () => { setResizing(false); document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up)
  }, [terminalWidth])

  const handleResizeV = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); setResizing(true)
    const startY = e.clientY; const startH = terminalHeight
    const move = (ev: MouseEvent) => setTerminalHeight(Math.min(600, Math.max(150, startH + (startY - ev.clientY))))
    const up = () => { setResizing(false); document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up)
  }, [terminalHeight])

  const featureNames = snapshot?.features?.map((f) => f.feature) ?? []
  const isFullscreen = terminalOpen && terminalPosition === 'fullscreen'
  const isBottom = terminalOpen && terminalPosition === 'bottom'
  const isRight = terminalOpen && terminalPosition === 'right'

  // The TerminalPanel is rendered ONCE — CSS controls its position
  const terminalPanel = (
    <TerminalPanel
      ref={terminalRef}
      activeFeature={activeFeature}
      position={terminalPosition}
      onChangePosition={setTerminalPosition}
    />
  )

  return (
    <TerminalWriterContext.Provider value={{ writeCommand, activeFeature, setActiveFeature }}>
      {/* Fullscreen terminal overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]">
          {terminalPanel}
        </div>
      )}

      <div className={`flex h-screen w-screen overflow-hidden bg-slate-100 ${resizing ? 'select-none' : ''}`}>
        {/* Sidebar */}
        <div className={`flex-shrink-0 transition-all duration-200 ${sidebarCollapsed ? 'w-14' : 'w-60'}`}>
          <Sidebar
            onOpenPalette={() => setPaletteOpen(true)}
            collapsed={sidebarCollapsed}
            onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
            featureCount={snapshot?.summary?.featureCount ?? 0}
            installed={snapshot?.project?.installed ?? false}
          />
        </div>

        {/* Content + optional bottom terminal */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <Header
            terminalOpen={terminalOpen}
            onToggleTerminal={() => setTerminalOpen(!terminalOpen)}
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllRead={markAllRead}
            onClearAll={clearAll}
          />
          <main className="flex-1 overflow-y-auto p-6 min-h-0 page-enter">
            {children}
          </main>

          {/* Bottom terminal */}
          {isBottom && (
            <>
              <div onMouseDown={handleResizeV} className="h-1 flex-shrink-0 cursor-row-resize hover:bg-indigo-500/30 active:bg-indigo-500/50" />
              <div className="flex-shrink-0 border-t border-slate-700" style={{ height: terminalHeight }}>
                {terminalPanel}
              </div>
            </>
          )}

          <StatusBar />
        </div>

        {/* Right terminal */}
        {isRight && (
          <>
            <div onMouseDown={handleResizeH} className="w-1 flex-shrink-0 cursor-col-resize hover:bg-indigo-500/30 active:bg-indigo-500/50" />
            <div className="flex-shrink-0 border-l border-slate-700" style={{ width: terminalWidth }}>
              {terminalPanel}
            </div>
          </>
        )}
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} features={featureNames} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </TerminalWriterContext.Provider>
  )
}
