// Unit tests for the stop handlers a held sync session puts on its process,
// over temp dirs with no child processes. They take sessions of each kind and
// call the installed handler directly, because a real signal on a session with
// no graceful shutdown restores the default death and would take the test worker
// with it, and assert which signals each kind answers, what the lock does on
// each, and how a newcomer's kill is read: aimed at the holder, aimed elsewhere,
// or found after the lock already moved on. The live legs run in session-repro.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  SUPERSEDED_EXIT_CODE,
  getSyncLockDir,
  getSyncPreemptPath,
  supersededMessage,
  type SyncSessionKind,
} from './session-owner.ts'
import { acquireSyncSession, type SyncSession } from './session.ts'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'core-hold-'))
  tempDirs.push(dir)
  return dir
}

function ownerDoc(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { pid: process.pid, lockNonce: 'nonce-1', kind: 'one-shot', argv: ['ref', 'sync'], startedAt: 'now', ...overrides }
}

const STOP_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const
type StopSignal = (typeof STOP_SIGNALS)[number]

function stopListenerCounts(): number[] {
  return STOP_SIGNALS.map((signal) => process.listenerCount(signal))
}

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

// Stands in for the watch CLI's graceful shutdown, and for the process.exit a supersede ends in:
// the spy throws instead of exiting, so a test reads what the handler did on its way there.
const graceful = (): void => {}

async function withExitSpy(run: (exit: ReturnType<typeof vi.spyOn>, log: ReturnType<typeof vi.spyOn>) => Promise<void>): Promise<void> {
  const exit = vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`exit ${code}`)
  })
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  process.on('SIGTERM', graceful)
  try {
    await run(exit, log)
  } finally {
    exit.mockRestore()
    log.mockRestore()
    process.removeListener('SIGTERM', graceful)
  }
}

describe('stop signals on a held session', () => {
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

  it('a one-shot frees its lock at once on SIGTERM even with a graceful shutdown around', async () => {
    const dir = await makeTempDir()
    process.on('SIGTERM', graceful)
    const { session, handlerFor } = await acquireWithHandlers(dir, 'one-shot')
    try {
      handlerFor('SIGTERM')()
      expect(existsSync(getSyncLockDir(dir))).toBe(false)
    } finally {
      session.release()
      process.removeListener('SIGTERM', graceful)
    }
  })

  it('a one-shot answers SIGTERM alone: Ctrl-C and hangup stay default deaths a spinning fragment cannot ignore', async () => {
    const dir = await makeTempDir()
    const before = stopListenerCounts()
    const session = await acquireSyncSession({ cwd: dir, kind: 'one-shot' })
    try {
      expect(stopListenerCounts()).toEqual([before[0], (before[1] ?? 0) + 1, before[2]])
    } finally {
      session.release()
    }
    expect(stopListenerCounts()).toEqual(before)
    const watch = await acquireSyncSession({ cwd: dir, kind: 'watch' })
    try {
      expect(stopListenerCounts()).toEqual(before.map((count) => count + 1))
    } finally {
      watch.release()
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

describe('superseded holders', () => {
  it('exits 75 for a marker aimed at it, keeping its handler on until the exit', async () => {
    const dir = await makeTempDir()
    await withExitSpy(async (_exit, log) => {
      const { session, handlerFor } = await acquireWithHandlers(dir, 'one-shot')
      try {
        const target = session.owner.lockNonce
        writeFileSync(getSyncPreemptPath(getSyncLockDir(dir)), JSON.stringify({ pid: 4242, kind: 'one-shot', target }))
        const sigtermBefore = process.listenerCount('SIGTERM')
        expect(handlerFor('SIGTERM')).toThrow(`exit ${SUPERSEDED_EXIT_CODE}`)
        expect(log).toHaveBeenCalledWith(supersededMessage(4242, 'one-shot'))
        expect(process.listenerCount('SIGTERM')).toBe(sigtermBefore)
        expect(existsSync(getSyncLockDir(dir))).toBe(false)
      } finally {
        session.release()
      }
    })
  })

  it('ignores a marker aimed at another holder: that SIGTERM is a plain stop', async () => {
    const dir = await makeTempDir()
    await withExitSpy(async (exit, log) => {
      const { session, handlerFor } = await acquireWithHandlers(dir, 'one-shot')
      try {
        writeFileSync(getSyncPreemptPath(getSyncLockDir(dir)), JSON.stringify({ pid: 4242, kind: 'one-shot', target: 'someone-else' }))
        handlerFor('SIGTERM')()
        expect(exit).not.toHaveBeenCalled()
        expect(log).not.toHaveBeenCalled()
      } finally {
        session.release()
      }
    })
  })

})

describe('a lock taken from its holder', () => {
  it('leaves a watch whose lock --break-lock took to its graceful stop: only a named kill supersedes it', async () => {
    const dir = await makeTempDir()
    await withExitSpy(async (exit, log) => {
      const { session, handlerFor } = await acquireWithHandlers(dir, 'watch')
      try {
        writeFileSync(join(getSyncLockDir(dir), 'owner.json'), JSON.stringify(ownerDoc({ pid: 4243, lockNonce: 'breaker' })))
        handlerFor('SIGTERM')()
        expect(exit).not.toHaveBeenCalled()
        expect(log).not.toHaveBeenCalled()
        expect(JSON.parse(readFileSync(join(getSyncLockDir(dir), 'owner.json'), 'utf8'))).toMatchObject({ lockNonce: 'breaker' })
      } finally {
        session.release()
      }
    })
  })

  it('exits 75 without a name when a SIGTERM finds the lock already taken by another session', async () => {
    const dir = await makeTempDir()
    await withExitSpy(async (_exit, log) => {
      const { session, handlerFor } = await acquireWithHandlers(dir, 'one-shot')
      try {
        const taken = ownerDoc({ pid: 4243, lockNonce: 'taker' })
        writeFileSync(join(getSyncLockDir(dir), 'owner.json'), JSON.stringify(taken))
        expect(handlerFor('SIGTERM')).toThrow(`exit ${SUPERSEDED_EXIT_CODE}`)
        expect(log).toHaveBeenCalledWith('[ref] sync superseded')
        expect(JSON.parse(readFileSync(join(getSyncLockDir(dir), 'owner.json'), 'utf8'))).toMatchObject({ lockNonce: 'taker' })
      } finally {
        session.release()
      }
    })
  })
})
