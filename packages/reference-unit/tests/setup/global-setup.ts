import { execSync, spawn } from 'node:child_process'
import { closeSync, existsSync, writeFileSync, openSync, readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..', '..')
const REF_SYNC_TIMEOUT_MS = 180_000
const REF_SYNC_READY_MESSAGE = '[ref sync] ready'
const WATCH_LOG_PATH = join(pkgRoot, '.ref-sync-watch.log')
const refCore = join(
  pkgRoot,
  'node_modules',
  '@reference-ui',
  'core',
  'dist',
  'cli',
  'index.mjs'
)

async function waitForOutputs(paths: string[], maxMs = 15_000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    if (paths.every((path) => existsSync(path))) {
      await new Promise((r) => setTimeout(r, 100))
      return true
    }
    await new Promise((r) => setTimeout(r, 80))
  }
  return false
}

async function waitForReadyCount(logPath: string, expectedCount: number, maxMs = 30_000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    try {
      const content = readFileSync(logPath, 'utf-8')
      const count = content.split(REF_SYNC_READY_MESSAGE).length - 1
      if (count >= expectedCount) return true
    } catch {
      // log may not exist yet
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  return false
}

function killProcessTree(pid: number | undefined): void {
  if (!pid) return
  try {
    process.kill(-pid, 'SIGKILL')
  } catch {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      // Process may already be dead
    }
  }
}

export default async function globalSetup() {
  execSync(`node "${refCore}" clean`, { cwd: pkgRoot, stdio: 'pipe', timeout: 10_000 })
  execSync(`node "${refCore}" sync`, {
    cwd: pkgRoot,
    stdio: 'pipe',
    timeout: REF_SYNC_TIMEOUT_MS,
  })

  const appReady = await waitForOutputs([
    join(pkgRoot, '.reference-ui', 'react', 'react.mjs'),
    join(pkgRoot, '.reference-ui', 'virtual'),
  ])
  if (!appReady) {
    throw new Error('ref sync failed to produce .reference-ui/react (full pipeline did not complete)')
  }

  if (process.env.REF_UNIT_ENABLE_WATCH_SETUP !== '1') {
    return
  }

  writeFileSync(WATCH_LOG_PATH, '')
  const logFd = openSync(WATCH_LOG_PATH, 'a')
  const appWatchProcess = spawn('node', [refCore, 'sync', '--watch', '--debug'], {
    cwd: pkgRoot,
    stdio: ['ignore', logFd, logFd],
    detached: true,
  })
  closeSync(logFd)
  appWatchProcess.unref()

  const ready = await waitForReadyCount(WATCH_LOG_PATH, 1)
  if (!ready) {
    killProcessTree(appWatchProcess.pid)
    throw new Error('ref sync --watch did not emit initial ready signal for reference-unit tests')
  }

  return () => {
    killProcessTree(appWatchProcess.pid)
  }
}
