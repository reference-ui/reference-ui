import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..', '..')
const outDir = join(pkgRoot, '.reference-ui')
const sessionFile = join(outDir, 'tmp', 'session.json')
const lockFile = join(outDir, 'tmp', 'session.lock')

/**
 * Reads and parses session.json. Returns null if absent or malformed.
 */
function readSession(): Record<string, unknown> | null {
  if (!existsSync(sessionFile)) return null
  try {
    return JSON.parse(readFileSync(sessionFile, 'utf-8')) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * These tests run after globalSetup has completed a full one-shot `ref sync`.
 * They verify that the session module wrote a well-formed manifest to disk.
 */
describe('session – manifest shape after ref sync (one-shot)', () => {
  // MIGRATED: Covered by matrix/session/tests/unit/session-manifest.test.ts.
  it.skip('session.json exists inside .reference-ui/tmp', () => {
    expect(existsSync(sessionFile), `expected ${sessionFile} to exist`).toBe(true)
  })

  // MIGRATED: Covered by matrix/session/tests/unit/session-manifest.test.ts.
  it.skip('session.json is valid JSON', () => {
    expect(readSession()).not.toBeNull()
  })

  // MIGRATED: Covered by matrix/session/tests/unit/session-manifest.test.ts.
  it.skip('session.json has all required fields', () => {
    const s = readSession()!
    expect(s).toHaveProperty('pid')
    expect(s).toHaveProperty('mode')
    expect(s).toHaveProperty('state')
    expect(s).toHaveProperty('buildState')
    expect(s).toHaveProperty('startedAt')
    expect(s).toHaveProperty('updatedAt')
  })

  // MIGRATED: Covered by matrix/session/tests/unit/session-manifest.test.ts.
  it.skip('pid is a positive integer', () => {
    const s = readSession()!
    expect(typeof s.pid).toBe('number')
    expect(s.pid as number).toBeGreaterThan(0)
    expect(Number.isInteger(s.pid)).toBe(true)
  })

  // MIGRATED: Covered by matrix/session/tests/unit/session-manifest.test.ts.
  it.skip('mode is one-shot for a non-watch sync run', () => {
    expect(readSession()!.mode).toBe('one-shot')
  })

  // MIGRATED: Covered by matrix/session/tests/unit/session-manifest.test.ts.
  it.skip('state is stopped after a completed one-shot sync', () => {
    expect(readSession()!.state).toBe('stopped')
  })

  // MIGRATED: Covered by matrix/session/tests/unit/session-manifest.test.ts.
  it.skip('buildState is ready after a completed one-shot sync', () => {
    expect(readSession()!.buildState).toBe('ready')
  })

  // MIGRATED: Covered by matrix/session/tests/unit/session-manifest.test.ts.
  it.skip('startedAt and updatedAt are ISO 8601 strings', () => {
    const s = readSession()!
    const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    expect(String(s.startedAt)).toMatch(iso)
    expect(String(s.updatedAt)).toMatch(iso)
  })

  // MIGRATED: Covered by matrix/session/tests/unit/session-manifest.test.ts.
  it.skip('updatedAt is at or after startedAt', () => {
    const s = readSession()!
    expect(String(s.updatedAt) >= String(s.startedAt)).toBe(true)
  })
})

describe('session – lock file after ref sync (one-shot)', () => {
  // MIGRATED: Covered by matrix/session/tests/unit/session-manifest.test.ts.
  it.skip('session.lock is removed after a completed one-shot sync', () => {
    // One-shot cleanupSession() should remove the lock.
    expect(existsSync(lockFile), `lock file should be cleaned up after one-shot sync`).toBe(false)
  })
})
