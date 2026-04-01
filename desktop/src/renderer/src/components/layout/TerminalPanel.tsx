import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { Plus, X, PanelRight, PanelBottom, Maximize2 } from 'lucide-react'

export type TerminalPosition = 'right' | 'bottom' | 'fullscreen'

interface TerminalPanelProps {
  activeFeature: string | null
  position: TerminalPosition
  onChangePosition: (pos: TerminalPosition) => void
}

export interface TerminalPanelHandle {
  writeToActiveTerminal: (data: string) => void
}

interface Tab {
  id: string
  label: string
  shell?: string
  startCommand?: string
}

let tabCounter = 0

const positionButtons: { pos: TerminalPosition; icon: React.ReactNode; title: string }[] = [
  { pos: 'right', icon: <PanelRight size={12} />, title: 'Right' },
  { pos: 'bottom', icon: <PanelBottom size={12} />, title: 'Bottom' },
  { pos: 'fullscreen', icon: <Maximize2 size={12} />, title: 'Fullscreen' },
]

function XtermInstance({
  sessionId,
  shell,
  startCommand,
  visible
}: {
  sessionId: string
  shell?: string
  startCommand?: string
  visible: boolean
}) {
  const divRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    if (!visible) return

    const el = divRef.current
    if (!el) return

    // Delay mount to ensure container has real dimensions
    const delayTimer = setTimeout(() => {
      if (startedRef.current) return
      startedRef.current = true
      mountTerminal()
    }, 200)

    let disposed = false
    let dataCleanup: (() => void) | null = null
    let exitCleanup: (() => void) | null = null
    let inputCleanup: { dispose: () => void } | null = null
    let ro: ResizeObserver | null = null

    function mountTerminal() {
      const term = new Terminal({
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
        fontSize: 12,
        lineHeight: 1.4,
        cursorBlink: true,
        scrollback: 5000,
        theme: {
          background: '#0F172A', foreground: '#E2E8F0', cursor: '#22C55E',
          selectionBackground: '#334155',
          black: '#0F172A', brightBlack: '#475569',
          red: '#EF4444', brightRed: '#F87171',
          green: '#22C55E', brightGreen: '#4ADE80',
          yellow: '#F59E0B', brightYellow: '#FBBF24',
          blue: '#3B82F6', brightBlue: '#60A5FA',
          magenta: '#A78BFA', brightMagenta: '#C4B5FD',
          cyan: '#22D3EE', brightCyan: '#67E8F9',
          white: '#E2E8F0', brightWhite: '#F8FAFC'
        }
      })

      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)
      term.open(el)
      termRef.current = term

      window.api.pty.create({ id: sessionId, shell }).then(() => {
        if (disposed) {
          void window.api.pty.kill(sessionId).catch(() => {})
          return
        }

        dataCleanup = window.api.pty.onData(sessionId, (data) => term.write(data))
        exitCleanup = window.api.pty.onExit(sessionId, (code) => {
          term.write(`\r\n\x1b[90m[process exited with code ${code}]\x1b[0m\r\n`)
        })
        inputCleanup = term.onData((data) => window.api.pty.write(sessionId, data))

        setTimeout(() => {
          try { fitAddon.fit() } catch {}
          try { window.api.pty.resize(sessionId, term.cols, term.rows) } catch {}
          term.focus()
          if (startCommand) {
            window.api.pty.write(sessionId, `${startCommand}\r`)
          }
        }, 100)
      }).catch(() => {
        term.write('\x1b[31mFailed to create terminal session\x1b[0m\r\n')
      })

      ro = new ResizeObserver(() => {
        try { fitAddon.fit() } catch {}
        try { window.api.pty.resize(sessionId, term.cols, term.rows) } catch {}
      })
      ro.observe(el)

      el.addEventListener('mousedown', () => term.focus())
    }

    return () => {
      clearTimeout(delayTimer)
      disposed = true
      ro?.disconnect()
      dataCleanup?.()
      exitCleanup?.()
      inputCleanup?.dispose()
      if (termRef.current) {
        termRef.current.dispose()
        termRef.current = null
      }
      void window.api.pty.kill(sessionId).catch(() => {})
      startedRef.current = false
    }
  }, [sessionId, shell, startCommand, visible])

  useEffect(() => {
    if (visible && termRef.current) {
      setTimeout(() => termRef.current?.focus(), 100)
    }
  }, [visible])

  return (
    <div
      ref={divRef}
      className="absolute inset-0 p-1"
      style={{ display: visible ? 'block' : 'none' }}
    />
  )
}

export const TerminalPanel = forwardRef<TerminalPanelHandle, TerminalPanelProps>(
  function TerminalPanel({ activeFeature, position, onChangePosition }, ref) {
    const [tabs, setTabs] = useState<Tab[]>([])
    const [activeTabId, setActiveTabId] = useState('')
    const [ready, setReady] = useState(false)

    // Create initial tabs
    useEffect(() => {
      if (ready) return
      setReady(true)
      window.api.checkHostAvailable('claude').then((hasClaude) => {
        const t: Tab[] = [{ id: `t${++tabCounter}`, label: 'zsh' }]
        if (hasClaude) {
          t.push({ id: `t${++tabCounter}`, label: 'Claude Code', startCommand: 'claude' })
        }
        setTabs(t)
        setActiveTabId(t[0].id)
      })
    }, [ready])

    useImperativeHandle(ref, () => ({
      writeToActiveTerminal: (data: string) => {
        if (activeTabId) window.api.pty.write(activeTabId, data)
      }
    }), [activeTabId])

    const addTab = useCallback(() => {
      const id = `t${++tabCounter}`
      setTabs(prev => [...prev, { id, label: 'zsh' }])
      setActiveTabId(id)
    }, [])

    const closeTab = useCallback((id: string) => {
      setTabs(prev => {
        const next = prev.filter(t => t.id !== id)
        if (!next.length) return prev
        if (activeTabId === id) setActiveTabId(next[0].id)
        return next
      })
    }, [activeTabId])

    if (!tabs.length) {
      return <div className="h-full bg-[#0F172A] flex items-center justify-center text-slate-500 text-xs">Loading...</div>
    }

    return (
      <div className="h-full flex flex-col bg-[#0F172A]">
        {/* Tab bar */}
        <div className="h-10 bg-[#1E293B] flex items-center px-2 gap-1 flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs ${
                activeTabId === tab.id ? 'bg-[#0F172A] text-slate-200' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTabId === tab.id ? 'bg-green-500' : 'bg-slate-600'}`} />
              {tab.label}
              {tabs.length > 1 && (
                <X size={10} className="opacity-50 hover:opacity-100" onClick={e => { e.stopPropagation(); closeTab(tab.id) }} />
              )}
            </button>
          ))}
          <button onClick={addTab} className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-700">
            <Plus size={14} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center rounded overflow-hidden border border-slate-600">
            {positionButtons.map(({ pos, icon, title }) => (
              <button
                key={pos}
                onClick={() => onChangePosition(pos)}
                title={title}
                className={`p-1 ${position === pos ? 'bg-indigo-500/30 text-indigo-300' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'}`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal instances */}
        <div className="flex-1 relative min-h-0">
          {tabs.map(tab => (
            <XtermInstance
              key={tab.id}
              sessionId={tab.id}
              shell={tab.shell}
              startCommand={tab.startCommand}
              visible={activeTabId === tab.id}
            />
          ))}
        </div>

        {/* Status bar */}
        <div className="h-7 bg-[#1E293B] border-t border-slate-700 flex items-center px-3 gap-4 flex-shrink-0">
          <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-indigo-500 text-white">NORMAL</span>
          <span className="text-[9px] text-slate-500 font-mono">click terminal to focus</span>
          {activeFeature ? (
            <span className="text-[9px] text-slate-500 font-mono">feature:<span className="text-indigo-300">{activeFeature}</span></span>
          ) : (
            <span className="text-[9px] text-slate-500 font-mono italic">no feature selected</span>
          )}
          <div className="flex-1" />
          <span className="text-[9px] text-slate-500 font-mono">{tabs.length} tab{tabs.length > 1 ? 's' : ''}</span>
        </div>
      </div>
    )
  }
)
