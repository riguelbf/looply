import { ipcMain, BrowserWindow } from 'electron'
import { execSync } from 'child_process'
import path from 'path'

interface PtySession {
  id: string
  process: import('node-pty').IPty
  label: string
}

const sessions = new Map<string, PtySession>()

function isCommandAvailable(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function resolveShellLaunch(shellPath: string): { file: string; args: string[] } {
  const shellName = path.basename(shellPath)
  if (shellName === 'zsh' || shellName === 'bash') {
    return { file: shellPath, args: ['-il'] }
  }
  if (shellName === 'fish') {
    return { file: shellPath, args: ['-i'] }
  }
  return { file: shellPath, args: ['-i'] }
}

export function createPtyManager(window: BrowserWindow, targetRoot: string): void {
  ipcMain.handle('host:check-available', (_event, cmd: string) => {
    return isCommandAvailable(cmd)
  })

  ipcMain.handle('pty:create', async (_event, opts: { id: string; shell?: string; cwd?: string }) => {
    const pty = await import('node-pty')
    const defaultShell = process.env.SHELL || '/bin/zsh'

    let shell = defaultShell
    if (opts.shell && opts.shell !== defaultShell) {
      if (isCommandAvailable(opts.shell)) {
        shell = opts.shell
      }
    }

    const launch = resolveShellLaunch(shell)
    const env = { ...process.env, TERM: 'xterm-256color' } as Record<string, string>
    const cwd = opts.cwd ?? targetRoot ?? process.cwd()

    const proc = pty.spawn(launch.file, launch.args, {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env
    })

    proc.onData((data: string) => {
      if (!window.isDestroyed()) {
        window.webContents.send(`pty:data:${opts.id}`, data)
      }
    })

    proc.onExit(({ exitCode }: { exitCode: number }) => {
      if (!window.isDestroyed()) {
        window.webContents.send(`pty:exit:${opts.id}`, exitCode)
      }
      sessions.delete(opts.id)
    })

    sessions.set(opts.id, { id: opts.id, process: proc, label: shell })
    return { id: opts.id, pid: proc.pid }
  })

  ipcMain.on('pty:write', (_event, id: string, data: string) => {
    sessions.get(id)?.process.write(data)
  })

  ipcMain.on('pty:resize', (_event, id: string, cols: number, rows: number) => {
    sessions.get(id)?.process.resize(cols, rows)
  })

  ipcMain.handle('pty:kill', (_event, id: string) => {
    const session = sessions.get(id)
    if (session) {
      session.process.kill()
      sessions.delete(id)
    }
  })
}

export function destroyAllPtySessions(): void {
  for (const session of sessions.values()) {
    try {
      session.process.kill()
    } catch {
      // ignore
    }
  }
  sessions.clear()
}
