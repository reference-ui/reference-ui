// Unit tests for the watch-state publisher over a temp lock dir, no watcher running. They pin
// the counters a one-shot reads: the boot state, a poke on disk before it is scheduled, `done`
// and `failed` taken from the start of a pass, `stopping` published first, and no write into a
// lock dir this watch does not own (missing, foreign, or gone).

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getWatchStatePath, parseWatchState, type SyncSessionOwner } from '../../sync/session-owner.ts'
import { createWatchStatePublisher } from './handshake.ts'

const NONCE = 'handshake-test-nonce'
const tempDirs: string[] = []
let lockDir: string

const owner: SyncSessionOwner = { pid: process.pid, lockNonce: NONCE, kind: 'watch', argv: [], startedAt: '' }

function writeOwner(nonce: string): void {
  writeFileSync(join(lockDir, 'owner.json'), JSON.stringify({ ...owner, lockNonce: nonce }))
}

function readState(): unknown {
  return parseWatchState(JSON.parse(readFileSync(getWatchStatePath(lockDir), 'utf8')) as unknown)
}

beforeEach(() => {
  const dir = mkdtempSync(join(tmpdir(), 'neo-watch-handshake-'))
  tempDirs.push(dir)
  lockDir = join(dir, 'sync.lock')
  mkdirSync(lockDir)
  writeOwner(NONCE)
})

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('createWatchStatePublisher', () => {
  it('publishes the boot state with nothing requested and nothing done', () => {
    createWatchStatePublisher(lockDir, owner, vi.fn()).publish()
    expect(readState()).toEqual({ pid: process.pid, nonce: NONCE, requested: 0, done: 0, failed: false, stopping: false })
  })

  it('has a poke on disk before the call returns', () => {
    const publisher = createWatchStatePublisher(lockDir, owner, vi.fn())
    publisher.publish()
    publisher.poke()
    expect(readState()).toMatchObject({ requested: 1, done: 0 })
    publisher.poke()
    expect(readState()).toMatchObject({ requested: 2 })
  })

  it('takes done and failed from the count a pass started at', () => {
    const publisher = createWatchStatePublisher(lockDir, owner, vi.fn())
    publisher.publish()
    publisher.poke()
    const started = publisher.passStarted()
    publisher.poke()
    publisher.passFinished(started, true)
    expect(readState()).toMatchObject({ requested: 2, done: 1, failed: true })
  })

  it('publishes stopping before anything else the stop does', () => {
    const publisher = createWatchStatePublisher(lockDir, owner, vi.fn())
    publisher.publish()
    publisher.stopping()
    expect(readState()).toMatchObject({ stopping: true })
  })

  it('writes nothing into a lock dir with no owner or a foreign owner', () => {
    const report = vi.fn()
    const publisher = createWatchStatePublisher(lockDir, owner, report)
    writeOwner('someone-else')
    publisher.poke()
    expect(existsSync(getWatchStatePath(lockDir))).toBe(false)
    rmSync(join(lockDir, 'owner.json'))
    publisher.poke()
    expect(existsSync(getWatchStatePath(lockDir))).toBe(false)
    expect(report).not.toHaveBeenCalled()
  })

  it('keeps counting through a missing generated folder, then publishes once the lock is re-asserted', () => {
    const report = vi.fn()
    const publisher = createWatchStatePublisher(lockDir, owner, report)
    rmSync(lockDir, { recursive: true, force: true })
    expect(() => publisher.poke()).not.toThrow()
    expect(report).not.toHaveBeenCalled()

    mkdirSync(lockDir)
    writeOwner(NONCE)
    publisher.publish()
    expect(readState()).toMatchObject({ requested: 1 })
  })
})
