import { execSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..', '..')
const REF_SYNC_TIMEOUT_MS = 180_000
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

  const appWatchProcess = spawn('node', [refCore, 'sync', '--watch', '--debug'], {
    cwd: pkgRoot,
    stdio: 'ignore',
    detached: true,
  })
  appWatchProcess.unref()

  await new Promise((resolveReady) => setTimeout(resolveReady, 500))

  return () => {
    killProcessTree(appWatchProcess.pid)
  }
}
