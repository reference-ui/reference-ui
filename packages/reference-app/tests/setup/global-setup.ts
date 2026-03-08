import { execSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..', '..')
const libRoot = resolve(pkgRoot, '..', 'reference-lib')
const refCli = join(
  pkgRoot,
  'node_modules',
  '@reference-ui',
  'cli',
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
  const libWatchProcess = spawn('node', [refCli, 'sync', '--watch', '--debug'], {
    cwd: libRoot,
    stdio: 'inherit',
    detached: true,
  })
  libWatchProcess.unref()

  const libReady = await waitForOutputs([
    join(libRoot, '.reference-ui', 'system', 'baseSystem.mjs'),
  ], 20_000)
  if (!libReady) {
    killProcessTree(libWatchProcess.pid)
    throw new Error('reference-lib ref sync --watch failed to produce .reference-ui/system/baseSystem.mjs')
  }

  execSync(`node "${refCli}" clean`, { cwd: pkgRoot, stdio: 'pipe', timeout: 10_000 })
  const appWatchProcess = spawn('node', [refCli, 'sync', '--watch', '--debug'], {
    cwd: pkgRoot,
    stdio: 'inherit',
    detached: true,
  })
  appWatchProcess.unref()

  const appReady = await waitForOutputs([
    join(pkgRoot, '.reference-ui', 'react', 'react.mjs'),
    join(pkgRoot, '.reference-ui', 'virtual'),
  ])
  if (!appReady) {
    killProcessTree(libWatchProcess.pid)
    killProcessTree(appWatchProcess.pid)
    throw new Error('ref sync --watch failed to produce .reference-ui/react (full pipeline did not complete)')
  }

  return () => {
    killProcessTree(libWatchProcess.pid)
    killProcessTree(appWatchProcess.pid)
  }
}
