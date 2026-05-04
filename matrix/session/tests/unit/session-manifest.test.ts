import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..', '..')
const outDir = join(packageRoot, '.reference-ui')
const sessionFile = join(outDir, 'tmp', 'session.json')
const lockFile = join(outDir, 'tmp', 'session.lock')

function readSession(): Record<string, unknown> | null {
  if (!existsSync(sessionFile)) {
    return null
  }

  try {
    return JSON.parse(readFileSync(sessionFile, 'utf-8')) as Record<string, unknown>
  } catch {
    return null
  }
}

describe('session manifest after one-shot sync', () => {
  it('writes session.json inside .reference-ui/tmp', () => {
    expect(existsSync(sessionFile)).toBe(true)
  })

  it('writes valid JSON', () => {
    expect(readSession()).not.toBeNull()
  })

  it('includes the required manifest fields', () => {
    const session = readSession()!

    expect(session).toHaveProperty('pid')
    expect(session).toHaveProperty('mode')
    expect(session).toHaveProperty('state')
    expect(session).toHaveProperty('buildState')
    expect(session).toHaveProperty('startedAt')
    expect(session).toHaveProperty('updatedAt')
  })

  it('stores a positive integer pid', () => {
    const session = readSession()!

    expect(typeof session.pid).toBe('number')
    expect(session.pid as number).toBeGreaterThan(0)
    expect(Number.isInteger(session.pid)).toBe(true)
  })

  it('records one-shot mode', () => {
    expect(readSession()!.mode).toBe('one-shot')
  })

  it('records a stopped state after completion', () => {
    expect(readSession()!.state).toBe('stopped')
  })

  it('records a ready build state after completion', () => {
    expect(readSession()!.buildState).toBe('ready')
  })

  it('stores ISO timestamps in startedAt and updatedAt', () => {
    const session = readSession()!
    const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

    expect(String(session.startedAt)).toMatch(iso)
    expect(String(session.updatedAt)).toMatch(iso)
  })

  it('keeps updatedAt at or after startedAt', () => {
    const session = readSession()!

    expect(String(session.updatedAt) >= String(session.startedAt)).toBe(true)
  })
})

describe('session cleanup after one-shot sync', () => {
  it('removes session.lock after completion', () => {
    expect(existsSync(lockFile)).toBe(false)
  })
})