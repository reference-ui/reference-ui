import { spawn, type ChildProcess } from 'node:child_process'
import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')

let watchProcess: ChildProcess | null = null

export default async function globalSetup() {
  // Run ref sync once to build the design system
  execSync('ref sync', {
    cwd: pkgRoot,
    stdio: 'pipe',
    timeout: 45_000,
  })

  // Spawn ref sync --watch in background so design system stays current during tests
  watchProcess = spawn('ref', ['sync', '--watch'], {
    cwd: pkgRoot,
    stdio: 'pipe',
    detached: false,
  })

  watchProcess.on('error', (err) => {
    console.error('[test-setup] ref sync --watch failed to start:', err)
  })

  // Brief delay for watch to initialize
  await new Promise((r) => setTimeout(r, 500))

  return () => {
    if (watchProcess?.pid) {
      watchProcess.kill('SIGTERM')
      watchProcess = null
    }
  }
}
