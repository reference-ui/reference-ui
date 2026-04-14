/**
 * Ref sync helpers for tests.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = join(__dirname, '..', '..', '..')
const LIB_PATH = join(PACKAGE_ROOT, '..', 'reference-lib')
const REF_SYNC_SESSION = join('.reference-ui', 'session.json')

export interface WaitForRefSyncReadyOptions {
  timeout?: number
  interval?: number
}

function readReadyMarker(sandboxDir: string): string | null {
  const sessionPath = join(sandboxDir, REF_SYNC_SESSION)
  if (!existsSync(sessionPath)) return null

  try {
    const session = JSON.parse(readFileSync(sessionPath, 'utf-8')) as {
      buildState?: string
      updatedAt?: string
    }
    if (session.buildState !== 'ready') return null
    return session.updatedAt ?? null
  } catch {
    return null
  }
}

/** Poll session.json for a fresh ready transition. */
export async function waitForRefSyncReady(
  sandboxDir: string,
  options?: WaitForRefSyncReadyOptions
): Promise<void> {
  const { timeout = 15_000, interval = 100 } = options ?? {}
  const deadline = Date.now() + timeout
  const baselineMarker = readReadyMarker(sandboxDir)

  while (Date.now() < deadline) {
    const nextMarker = readReadyMarker(sandboxDir)
    if (nextMarker && nextMarker !== baselineMarker) return
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
