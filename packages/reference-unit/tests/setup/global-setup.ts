import { execSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..', '..')
const libRoot = resolve(pkgRoot, '..', 'reference-lib')
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
  execSync('pnpm run build', {
    cwd: libRoot,
    stdio: 'pipe',
    timeout: 180_000,
  })

  const libReady = await waitForOutputs([
    join(libRoot, '.reference-ui', 'system', 'baseSystem.mjs'),
    join(libRoot, 'node_modules', '@reference-ui', 'system', 'baseSystem.mjs'),
  ], 20_000)
  if (!libReady) {
    throw new Error(
      'reference-lib build failed to produce baseSystem outputs for downstream consumers'
    )
  }

  execSync(`node "${refCore}" clean`, { cwd: pkgRoot, stdio: 'pipe', timeout: 10_000 })
  const appWatchProcess = spawn('node', [refCore, 'sync', '--watch', '--debug'], {
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
    killProcessTree(appWatchProcess.pid)
    throw new Error('ref sync --watch failed to produce .reference-ui/react (full pipeline did not complete)')
  }

  return () => {
    killProcessTree(appWatchProcess.pid)
  }
}
