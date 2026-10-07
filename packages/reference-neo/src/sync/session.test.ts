// Unit tests for the sync session lock over temp dirs, no child processes.
// They take fake lock dirs plus owner docs and assert acquire, release,
// re-entry, and validation. Real-process contention (kill, poke, stale,
// malformed, signals) is proven live in session-repro.test.ts.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  SUPERSEDED_EXIT_CODE,
  coveredByWatchMessage,
  getSyncLockDir,
  parseSyncSessionOwner,
  supersededMessage,
} from './session-owner.ts'
import { acquireSyncSession } from './session.ts'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-session-'))
  tempDirs.push(dir)
  return dir
}

function ownerDoc(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { pid: process.pid, lockNonce: 'nonce-1', kind: 'one-shot', argv: ['ref', 'sync'], startedAt: 'now', ...overrides }
}

describe('session owner model', () => {
  it('resolves the lock dir under the generated folder', async () => {
    const dir = await makeTempDir()
    expect(getSyncLockDir(dir)).toBe(join(dir, '.reference-ui', 'sync.lock'))
  })

  it('accepts a well-formed owner and pins the exit-path messages', () => {
    expect(parseSyncSessionOwner(ownerDoc())).toEqual(ownerDoc())
    expect(coveredByWatchMessage(4242)).toBe('[ref] already watching this project (pid 4242) — using the running session')
    expect(supersededMessage(4243)).toBe('[ref] sync superseded by sync pid 4243')
    expect(SUPERSEDED_EXIT_CODE).toBe(75)
  })

  it('rejects every malformed owner shape', () => {
    for (const bad of [null, 42, 'x', [], { ...ownerDoc(), pid: 0 }, { ...ownerDoc(), pid: -3 },
      { ...ownerDoc(), pid: 1.5 }, { ...ownerDoc(), pid: '9' }, { ...ownerDoc(), lockNonce: '' },
      { ...ownerDoc(), lockNonce: 7 }, { ...ownerDoc(), kind: 'solo' }, { ...ownerDoc(), kind: 0 },
      { pid: process.pid }, {}]) {
      expect(parseSyncSessionOwner(bad)).toBeNull()
    }
  })
})

describe('session acquire and release', () => {
  it('holds the lock dir while held and removes it on release', async () => {
    const dir = await makeTempDir()
    const sigtermBefore = process.listenerCount('SIGTERM')
    const session = await acquireSyncSession({ cwd: dir, kind: 'one-shot' })
    try {
      expect(session.owner.pid).toBe(process.pid)
      expect(session.owner.kind).toBe('one-shot')
      expect(session.owner.lockNonce.length).toBeGreaterThan(0)
      const lockDir = getSyncLockDir(dir)
      expect(existsSync(join(lockDir, 'owner.json'))).toBe(true)
      expect(process.listenerCount('SIGTERM')).toBe(sigtermBefore + 1)
    } finally {
      session.release()
    }
    expect(existsSync(getSyncLockDir(dir))).toBe(false)
    expect(process.listenerCount('SIGTERM')).toBe(sigtermBefore)
  })

  it('re-enters for the same process without preempting itself', async () => {
    const dir = await makeTempDir()
    const outer = await acquireSyncSession({ cwd: dir, kind: 'watch' })
    try {
      const inner = await acquireSyncSession({ cwd: dir, kind: 'one-shot' })
      expect(inner.owner.lockNonce).toBe(outer.owner.lockNonce)
      inner.release()
      expect(existsSync(getSyncLockDir(dir))).toBe(true)
    } finally {
      outer.release()
    }
    expect(existsSync(getSyncLockDir(dir))).toBe(false)
  })

  it('leaves a stolen lock alone on release', async () => {
    const dir = await makeTempDir()
    const session = await acquireSyncSession({ cwd: dir, kind: 'one-shot' })
    const lockDir = getSyncLockDir(dir)
    writeFileSync(join(lockDir, 'owner.json'), JSON.stringify(ownerDoc({ lockNonce: 'foreign' })))
    session.release()
    expect(existsSync(lockDir)).toBe(true)
    expect(JSON.parse(readFileSync(join(lockDir, 'owner.json'), 'utf8'))).toMatchObject({ lockNonce: 'foreign' })
  })

  it('takes a dead-pid lock with a warning and takes a torn owner too', async () => {
    const dir = await makeTempDir()
    const lockDir = getSyncLockDir(dir)
    mkdirSync(lockDir, { recursive: true })
    const lines: string[] = []
    const original = console.log
    console.log = (...args: unknown[]): void => {
      lines.push(args.map(String).join(' '))
    }
    try {
      writeFileSync(join(lockDir, 'owner.json'), JSON.stringify(ownerDoc({ pid: 2 ** 30 })))
      const first = await acquireSyncSession({ cwd: dir, kind: 'one-shot' })
      first.release()
      mkdirSync(lockDir, { recursive: true })
      writeFileSync(join(lockDir, 'owner.json'), '{torn')
      const second = await acquireSyncSession({ cwd: dir, kind: 'one-shot' })
      second.release()
    } finally {
      console.log = original
    }
    expect(lines.some((line) => line.includes('stale lock'))).toBe(true)
    expect(lines.some((line) => line.includes('owner unreadable'))).toBe(true)
    expect(existsSync(lockDir)).toBe(false)
  })
})
