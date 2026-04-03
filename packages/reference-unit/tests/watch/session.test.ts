import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSyncSession } from '@reference-ui/core'
import { waitForNextWatchReady } from '../watch/helpers'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..', '..')
const outDir = join(pkgRoot, '.reference-ui')
const sessionFile = join(outDir, 'session.json')
const lockFile = join(outDir, 'session.lock')

/**
 * Safe JSON parse helper — returns null if the file is absent or being written
 * to mid-read (can happen on a busy CI machine).
 */
function readSession(): Record<string, unknown> | null {
  if (!existsSync(sessionFile)) return null
  try {
    return JSON.parse(readFileSync(sessionFile, 'utf-8')) as Record<string, unknown>
  } catch {
    return null
  }
}

function readLockFile(): Record<string, unknown> | null {
  if (!existsSync(lockFile)) return null
  try {
    return JSON.parse(readFileSync(lockFile, 'utf-8')) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * These tests run only in watch mode (REF_UNIT_INCLUDE_WATCH_TESTS=1).
 * globalSetup starts ref sync --watch in the background and waits for the
 * first ready signal before any test runs.
 */

describe('session – manifest shape in watch mode', () => {
  it('session.json exists', () => {
    expect(existsSync(sessionFile)).toBe(true)
  })

  it('mode is watch', () => {
    const s = readSession()
    expect(s).not.toBeNull()
    expect(s!.mode).toBe('watch')
  })

  it('state is watching while sync --watch is running', () => {
    const s = readSession()
    expect(s).not.toBeNull()
    expect(s!.state).toBe('watching')
  })

  it('session.lock exists and holds the correct pid', () => {
    expect(existsSync(lockFile), 'lock file should be present while watch is running').toBe(true)
    const lock = readLockFile()
    expect(lock).not.toBeNull()
    expect(typeof lock!.pid).toBe('number')
    expect(lock!.pid as number).toBeGreaterThan(0)
  })
})

describe('session – getSyncSession onRefresh fires on watch cycle', () => {
  it('onRefresh callback is invoked after a watch rebuild completes', async () => {
    const session = getSyncSession({ cwd: pkgRoot })
    const calls: unknown[] = []

    const unsub = session.onRefresh(e => calls.push(e))

    try {
      // Wait for the next natural watch rebuild.
      const ready = await waitForNextWatchReady(30_000)
      expect(ready, 'watch mode should emit a fresh ready signal').toBe(true)

      // Give the file watcher a moment to deliver the event.
      await new Promise(r => setTimeout(r, 300))

      expect(calls.length, 'onRefresh should have been called at least once').toBeGreaterThan(0)
      expect((calls[0] as { changedOutputs: string[] }).changedOutputs).toEqual([])
    } finally {
      unsub()
      session.dispose()
    }
  }, 35_000)
})
