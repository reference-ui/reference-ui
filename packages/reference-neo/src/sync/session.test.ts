// Unit tests for the sync session lock over temp dirs, no child processes.
// They take fake lock dirs plus owner docs and assert acquire, release,
// re-entry, attach, validation, and what a held session's own stop-signal
// handler does with the lock (invoked directly, never by a real signal).
// Real-process contention (kill, poke, attach, stale, malformed, signals) is
// proven live in session-repro.test.ts.

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  SUPERSEDED_EXIT_CODE,
  coveredByWatchMessage,
  getSyncLockDir,
  getSyncPreemptPath,
  parseSyncSessionOwner,
  supersededMessage,
  type SyncSessionKind,
} from './session-owner.ts'
import { acquireSyncSession, attachToWatchSession, type SyncSession } from './session.ts'

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

  it('attach resolves at once when the owner is already gone', async () => {
    const before = [process.listenerCount('SIGINT'), process.listenerCount('SIGTERM'), process.listenerCount('SIGHUP')]
    await attachToWatchSession(2 ** 30)
    await attachToWatchSession(process.pid)
    expect([process.listenerCount('SIGINT'), process.listenerCount('SIGTERM'), process.listenerCount('SIGHUP')]).toEqual(before)
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

const STOP_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const
type StopSignal = (typeof STOP_SIGNALS)[number]

function stopListenerCounts(): number[] {
  return STOP_SIGNALS.map((signal) => process.listenerCount(signal))
}

describe('attach to a watch session', () => {
  it('arms its forwarders before it announces, and removes them when the owner exits', async () => {
    const owner = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], { stdio: 'ignore' })
    try {
      if (owner.pid === undefined) throw new Error('the stand-in owner did not spawn')
      const before = stopListenerCounts()
      let armedAtAnnounce: number[] | undefined
      const attached = attachToWatchSession(owner.pid, () => {
        armedAtAnnounce = stopListenerCounts()
      })
      expect(armedAtAnnounce).toEqual(before.map((count) => count + 1))
      owner.kill('SIGKILL')
      await attached
      expect(stopListenerCounts()).toEqual(before)
    } finally {
      owner.kill('SIGKILL')
    }
  })

  it('still announces when the owner is already gone', async () => {
    let announced = 0
    await attachToWatchSession(2 ** 30, () => {
      announced += 1
    })
    expect(announced).toBe(1)
  })
})

// Acquire a session and pick out the stop handlers it installed: for each
// signal, the listener gained during the acquire. The tests call a handler
// directly, because a real signal on a session with no graceful shutdown
// restores the default death and would take the test worker with it.
async function acquireWithHandlers(cwd: string, kind: SyncSessionKind): Promise<{ session: SyncSession; handlerFor: (signal: StopSignal) => () => void }> {
  const before = new Map(STOP_SIGNALS.map((signal) => [signal, process.listeners(signal)]))
  const session = await acquireSyncSession({ cwd, kind })
  const handlerFor = (signal: StopSignal): (() => void) => {
    const added = process.listeners(signal).find((listener) => !before.get(signal)?.includes(listener))
    if (added === undefined) throw new Error(`the session installed no ${signal} handler`)
    return () => added(signal)
  }
  return { session, handlerFor }
}

describe('stop signals on a held session', () => {
  // Stands in for the watch CLI's graceful shutdown: any listener beyond the
  // session's own counts as one.
  const graceful = (): void => {}

  it.each(STOP_SIGNALS)('a watch with a graceful shutdown keeps its lock on %s until release', async (signal) => {
    const dir = await makeTempDir()
    process.on(signal, graceful)
    const { session, handlerFor } = await acquireWithHandlers(dir, 'watch')
    try {
      handlerFor(signal)()
      expect(existsSync(join(getSyncLockDir(dir), 'owner.json'))).toBe(true)
      // The in-flight sync keeps re-entering the held lock, never taking a fresh one.
      const inner = await acquireSyncSession({ cwd: dir, kind: 'one-shot' })
      expect(inner.owner.lockNonce).toBe(session.owner.lockNonce)
    } finally {
      session.release()
      process.removeListener(signal, graceful)
    }
    expect(existsSync(getSyncLockDir(dir))).toBe(false)
  })

  it.each(STOP_SIGNALS)('a one-shot frees its lock at once on %s even with a graceful shutdown around', async (signal) => {
    const dir = await makeTempDir()
    process.on(signal, graceful)
    const { session, handlerFor } = await acquireWithHandlers(dir, 'one-shot')
    try {
      handlerFor(signal)()
      expect(existsSync(getSyncLockDir(dir))).toBe(false)
    } finally {
      session.release()
      process.removeListener(signal, graceful)
    }
  })

  it('a watch with a graceful shutdown still exits 75 on a SIGTERM carrying a preempt marker', async () => {
    const dir = await makeTempDir()
    process.on('SIGTERM', graceful)
    const { session, handlerFor } = await acquireWithHandlers(dir, 'watch')
    const exit = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`exit ${code}`)
    })
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      writeFileSync(getSyncPreemptPath(getSyncLockDir(dir)), JSON.stringify({ pid: 4242, kind: 'clean' }))
      expect(handlerFor('SIGTERM')).toThrow(`exit ${SUPERSEDED_EXIT_CODE}`)
      expect(log).toHaveBeenCalledWith(supersededMessage(4242, 'clean'))
      expect(existsSync(getSyncLockDir(dir))).toBe(false)
    } finally {
      exit.mockRestore()
      log.mockRestore()
      session.release()
      process.removeListener('SIGTERM', graceful)
    }
  })
})
