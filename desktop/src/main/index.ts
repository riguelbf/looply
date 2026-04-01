import { app, BrowserWindow, shell, nativeImage } from 'electron'
import { join } from 'path'
import { execSync } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc-handlers'
import { startFileWatcher, stopFileWatcher } from './file-watcher'
import { createPtyManager, destroyAllPtySessions } from './pty-manager'
import { createMenu } from './menu'

// Fix PATH for macOS GUI apps that don't inherit shell environment
function fixPath(): void {
  try {
    const userShell = process.env.SHELL || '/bin/zsh'
    const shellPath = execSync(`${userShell} -ilc 'echo $PATH'`, { encoding: 'utf-8' }).trim()
    if (shellPath) {
      process.env.PATH = shellPath
    }
  } catch {
    if (!process.env.PATH || process.env.PATH.length < 20) {
      process.env.PATH = '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin'
    }
  }
}

fixPath()

let mainWindow: BrowserWindow | null = null

function resolveTargetRoot(): string {
  const args = process.argv.slice(2)
  const dirIndex = args.indexOf('--project-root')
  if (dirIndex !== -1 && args[dirIndex + 1]) {
    return args[dirIndex + 1]
  }
  // Walk up from cwd to find the real project root (has packs/ directory)
  const { existsSync } = require('fs')
  const { join, dirname } = require('path')
  let dir = process.cwd()
  for (let i = 0; i < 5; i++) {
    if (existsSync(join(dir, 'packs'))) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return process.cwd()
}

function createWindow(): void {
  const iconPath = join(__dirname, '../../resources/icon.png')
  const icon = nativeImage.createFromPath(iconPath)

  // Set dock icon on macOS
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(icon)
  }

  mainWindow = new BrowserWindow({
    width: 1780,
    height: 960,
    minWidth: 1280,
    minHeight: 720,
    show: false,
    icon,
    titleBarStyle: 'default',
    backgroundColor: '#F1F5F9',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.setName('Looply')

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.looply.desktop')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const targetRoot = resolveTargetRoot()

  createWindow()
  createMenu(mainWindow!)
  registerIpcHandlers(targetRoot)
  startFileWatcher(targetRoot, mainWindow!)
  createPtyManager(mainWindow!, targetRoot)
})

app.on('window-all-closed', () => {
  stopFileWatcher()
  destroyAllPtySessions()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
