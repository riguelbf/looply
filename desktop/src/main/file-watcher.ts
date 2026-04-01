import chokidar from 'chokidar'
import { join, relative } from 'path'
import { BrowserWindow } from 'electron'

let watcher: chokidar.FSWatcher | null = null

export function startFileWatcher(targetRoot: string, window: BrowserWindow): void {
  const watchPath = join(targetRoot, '.looply')

  watcher = chokidar.watch(watchPath, {
    ignoreInitial: true,
    depth: 4,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  })

  watcher.on('all', (event, filePath) => {
    if (window.isDestroyed()) return
    window.webContents.send('looply:state-changed', {
      event,
      file: relative(targetRoot, filePath)
    })
  })
}

export function stopFileWatcher(): void {
  if (watcher) {
    watcher.close()
    watcher = null
  }
}
