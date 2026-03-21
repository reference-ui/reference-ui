/**
 * Ref sync helpers for tests.
 */

import { readFile, stat } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = join(__dirname, '..', '..', '..')
const LIB_PATH = join(PACKAGE_ROOT, '..', 'reference-lib')

/** Must match REF_SYNC_READY_MESSAGE in @reference-ui/core sync/complete.ts */
const REF_SYNC_READY_MESSAGE = '[ref sync] ready'

const REF_SYNC_LOG = 'ref-sync.log'

export interface WaitForRefSyncReadyOptions {
  timeout?: number
  interval?: number
}

/** Poll ref-sync.log for the ready message. Returns when found (fresh since start). */
export async function waitForRefSyncReady(
  sandboxDir: string,
  options?: WaitForRefSyncReadyOptions
): Promise<void> {
  const { timeout = 15_000, interval = 100 } = options ?? {}
  const logPath = join(sandboxDir, REF_SYNC_LOG)
  const deadline = Date.now() + timeout
  let baselineCount = 0

  try {
    const initialContent = await readFile(logPath, 'utf-8')
    baselineCount = initialContent.split(REF_SYNC_READY_MESSAGE).length - 1
  } catch {
    // log missing or unreadable
  }

  while (Date.now() < deadline) {
    try {
      await stat(logPath)
      const content = await readFile(logPath, 'utf-8')
      const readyCount = content.split(REF_SYNC_READY_MESSAGE).length - 1
      if (readyCount > baselineCount) return
    } catch {
      // log missing or unreadable
    }
    await new Promise((r) => setTimeout(r, interval))
  }
  throw new Error(`waitForRefSyncReady timed out after ${timeout}ms`)
}

/** Run ref sync (cold) in sandbox. Use when tests need to assert on file output after config change. */
export async function runRefSync(sandboxDir: string): Promise<void> {
  await execa('pnpm', ['exec', 'ref', 'sync'], {
    cwd: sandboxDir,
    stdio: 'pipe',
    timeout: 45_000,
  })
}

/** Run ref sync on reference-lib so baseSystem.mjs has css for layers consumers. */
export async function runRefSyncLib(): Promise<void> {
  await execa('pnpm', ['exec', 'ref', 'sync'], {
    cwd: LIB_PATH,
    stdio: 'pipe',
    timeout: 45_000,
  })
}
