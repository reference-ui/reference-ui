import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  sessionPath,
  lockPath,
  writeManifest,
  readManifest,
  writeLock,
  readLock,
  removeLock,
  tryAcquireLock,
  isProcessAlive,
  isLockStale,
} from './files'
import type { SessionManifest, SessionLock } from './types'

const MANIFEST: SessionManifest = {
  pid: 12345,
  mode: 'watch',
  state: 'watching',
  buildState: 'ready',
  startedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:01.000Z',
}

const LOCK: SessionLock = {
  pid: 12345,
  startedAt: '2026-01-01T00:00:00.000Z',
}

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ref-session-test-'))
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('session/files – paths', () => {
  it('sessionPath returns session.json under outDir', () => {
    expect(sessionPath('/a/b')).toBe('/a/b/session.json')
  })

  it('lockPath returns session.lock under outDir', () => {
    expect(lockPath('/a/b')).toBe('/a/b/session.lock')
  })
})

describe('session/files – manifest', () => {
  it('writeManifest creates session.json with correct content', () => {
    writeManifest(dir, MANIFEST)
    const result = readManifest(dir)
    expect(result).toEqual(MANIFEST)
  })

  it('readManifest returns null when file is absent', () => {
    expect(readManifest(dir)).toBeNull()
  })

  it('readManifest returns null when file is malformed JSON', () => {
    writeFileSync(sessionPath(dir), 'not-json', 'utf-8')
    expect(readManifest(dir)).toBeNull()
  })

  it('writeManifest creates missing outDir automatically', () => {
    const nested = join(dir, 'deep', 'nested')
    writeManifest(nested, MANIFEST)
    expect(readManifest(nested)).toEqual(MANIFEST)
  })
})

describe('session/files – lock', () => {
  it('writeLock creates session.lock with correct content', () => {
    writeLock(dir, LOCK)
    expect(readLock(dir)).toEqual(LOCK)
  })

  it('readLock returns null when file is absent', () => {
    expect(readLock(dir)).toBeNull()
  })

  it('readLock returns null when file is malformed JSON', () => {
    writeFileSync(lockPath(dir), '!!!', 'utf-8')
    expect(readLock(dir)).toBeNull()
  })

  it('removeLock deletes session.lock', () => {
    writeLock(dir, LOCK)
    removeLock(dir)
    expect(readLock(dir)).toBeNull()
  })

  it('removeLock is a no-op when lock does not exist', () => {
    expect(() => removeLock(dir)).not.toThrow()
  })
})

describe('session/files – tryAcquireLock', () => {
  it('returns acquired when no lock file exists', () => {
    const lock: SessionLock = { pid: process.pid, startedAt: '2026-01-01T00:00:00.000Z' }
    expect(tryAcquireLock(dir, lock)).toBe('acquired')
    // Lock file was created.
    expect(readLock(dir)).toEqual(lock)
  })

  it('returns contested when a live-process lock exists', () => {
    const lock: SessionLock = { pid: process.pid, startedAt: '2026-01-01T00:00:00.000Z' }
    writeLock(dir, lock)
    expect(tryAcquireLock(dir, lock)).toBe('contested')
  })

  it('returns stale and removes the lock when the holder is dead', () => {
    const deadLock: SessionLock = { pid: 2147483647, startedAt: '2026-01-01T00:00:00.000Z' }
    writeLock(dir, deadLock)

    const result = tryAcquireLock(dir, { pid: process.pid, startedAt: '2026-01-01T00:00:00.000Z' })
    expect(result).toBe('stale')
    // Stale lock file should have been removed so caller can retry.
    expect(readLock(dir)).toBeNull()
  })

  it('acquired lock can be released and re-acquired', () => {
    const lock: SessionLock = { pid: process.pid, startedAt: '2026-01-01T00:00:00.000Z' }
    expect(tryAcquireLock(dir, lock)).toBe('acquired')
    removeLock(dir)
    expect(tryAcquireLock(dir, lock)).toBe('acquired')
  })
})

describe('session/files – process liveness', () => {
  it('isProcessAlive returns true for the current process', () => {
    expect(isProcessAlive(process.pid)).toBe(true)
  })

  it('isProcessAlive returns false for a pid that does not exist', () => {
    // PID 2147483647 (INT_MAX) is almost certainly not a real process.
    expect(isProcessAlive(2147483647)).toBe(false)
  })

  it('isLockStale returns false for a live-process lock', () => {
    const liveLock: SessionLock = { pid: process.pid, startedAt: '2026-01-01T00:00:00.000Z' }
    expect(isLockStale(liveLock)).toBe(false)
  })

  it('isLockStale returns true for a dead-process lock', () => {
    const deadLock: SessionLock = { pid: 2147483647, startedAt: '2026-01-01T00:00:00.000Z' }
    expect(isLockStale(deadLock)).toBe(true)
  })
})
