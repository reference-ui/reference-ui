import { execSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..', '..')
const refCli = join(
  pkgRoot,
  'node_modules',
  '@reference-ui',
  'cli',
  'dist',
  'cli',
  'index.mjs'
)

async function waitForVirtual(maxMs = 12_000): Promise<boolean> {
  const virtualApp = join(pkgRoot, '.reference-ui', 'virtual', 'src', 'App.tsx')
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    if (existsSync(virtualApp)) return true
    await new Promise((r) => setTimeout(r, 80))
  }
  return false
}

export default async function globalSetup() {
  execSync(`node "${refCli}" clean`, { cwd: pkgRoot, stdio: 'pipe', timeout: 10_000 })
  const watchProcess = spawn('node', [refCli, 'sync', '--watch'], {
    cwd: pkgRoot,
    stdio: 'pipe',
    detached: true,
  })
  watchProcess.unref()

  const ok = await waitForVirtual()
  if (!ok) {
    try {
      process.kill(-watchProcess.pid!, 'SIGKILL')
    } catch {
      watchProcess.kill('SIGKILL')
    }
    throw new Error('ref sync --watch failed to produce initial virtual copy')
  }

  return () => {
    try {
      process.kill(-watchProcess.pid!, 'SIGKILL')
    } catch {
      try {
        watchProcess.kill('SIGKILL')
      } catch {
        // Process may already be dead
      }
    }
  }
}
