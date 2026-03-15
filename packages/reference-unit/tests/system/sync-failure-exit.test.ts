import { spawn } from 'node:child_process'
import { chmod, rm, writeFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..', '..')
const fixtureRoot = resolve(pkgRoot, 'tests', 'fixtures', 'sync-failure-exit')
const refCore = join(
  pkgRoot,
  'node_modules',
  '@reference-ui',
  'core',
  'dist',
  'cli',
  'index.mjs'
)
const unreadableFixturePath = join(fixtureRoot, 'src', '__sync_failure__.tsx')

function killProcessTree(pid: number | undefined): void {
  if (!pid) return

  try {
    process.kill(-pid, 'SIGKILL')
  } catch {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      // Process may already be gone.
    }
  }
}

function isProcessGroupAlive(pid: number | undefined): boolean {
  if (!pid) return false

  try {
    process.kill(-pid, 0)
    return true
  } catch {
    return false
  }
}

async function waitForExit(
  child: ReturnType<typeof spawn>,
  timeoutMs: number
): Promise<{ code: number | null; signal: NodeJS.Signals | null; elapsedMs: number }> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const timer = setTimeout(() => {
      reject(
        new Error(
          `ref sync did not exit within ${timeoutMs}ms\nstdout:\n${logs.stdout}\nstderr:\n${logs.stderr}`
        )
      )
    }, timeoutMs)

    const logs = { stdout: '', stderr: '' }
    child.stdout?.on('data', (chunk: Buffer | string) => {
      logs.stdout += chunk.toString()
    })
    child.stderr?.on('data', (chunk: Buffer | string) => {
      logs.stderr += chunk.toString()
    })

    child.once('exit', (code, signal) => {
      clearTimeout(timer)
      resolve({ code, signal, elapsedMs: Date.now() - start })
    })

    child.once('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
  })
}

async function waitForProcessGroupToDisappear(pid: number | undefined, timeoutMs: number): Promise<boolean> {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    if (!isProcessGroupAlive(pid)) {
      return true
    }

    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  return !isProcessGroupAlive(pid)
}

describe('sync failure shutdown', () => {
  it('exits quickly and does not leave a lingering process group after a sync failure', async () => {
    try {
      await writeFile(
        unreadableFixturePath,
        `export default function SyncFailureFixture() {
  return <div>broken fixture</div>
}
`,
        'utf-8'
      )
      await chmod(unreadableFixturePath, 0)

      const syncProcess = spawn('node', [refCore, 'clean'], {
        cwd: fixtureRoot,
        stdio: 'pipe',
      })

      await waitForExit(syncProcess, 10_000)

      const failingSync = spawn('node', [refCore, 'sync'], {
        cwd: fixtureRoot,
        stdio: 'pipe',
        detached: true,
      })

      try {
      const result = await waitForExit(failingSync, 8_000)

        expect(result.code).toBe(1)
        expect(result.signal).toBe(null)
        expect(result.elapsedMs).toBeLessThan(8_000)

        const groupGone = await waitForProcessGroupToDisappear(failingSync.pid, 2_000)
        expect(groupGone).toBe(true)
      } finally {
        killProcessTree(failingSync.pid)
      }
    } finally {
      await chmod(unreadableFixturePath, 0o644).catch(() => {})
      await rm(unreadableFixturePath, { force: true }).catch(() => {})
    }
  }, 15_000)
})
