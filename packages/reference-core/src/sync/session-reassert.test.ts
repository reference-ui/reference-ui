// Unit tests for putting a lost lock back, over temp dirs with no child processes.
// They take a lock dir in each state a deleted generated folder can leave behind
// (gone, claimed by a racer, torn, owner missing) and assert the re-assert is a
// compare-and-set: our own owner document comes back only into a dir this process
// made or one whose owner stayed missing, and an owner a racing claimer wrote is
// never overwritten, whether it lands before the re-assert looks, between its
// look and its mkdir, or between the racer's mkdir and its own write.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { reclaimLostLock } from './session-claim.ts'
import { armSession, disarmSession, markHeld } from './session-hold.ts'
import { getSyncLockDir, getSyncOwnerPath, parseSyncSessionOwner, readOwnerFile, type SyncSessionOwner } from './session-owner.ts'
import { acquireSyncSession, reassertHeldSession } from './session.ts'

// Wrapped, not replaced: every read passes through unless a test queues a one-off
// behavior, which is how a racer is made to land at an exact point of the re-assert.
vi.mock('./session-owner.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./session-owner.ts')>()
  return { ...actual, readOwnerFile: vi.fn(actual.readOwnerFile) }
})

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function makeProject(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'core-reassert-'))
  tempDirs.push(dir)
  return dir
}

const MINE: SyncSessionOwner = { pid: process.pid, lockNonce: 'mine-nonce', kind: 'watch', argv: [], startedAt: '' }
const RACER = JSON.stringify({ pid: process.pid + 1, lockNonce: 'racer-nonce', kind: 'one-shot', argv: ['ref', 'sync'], startedAt: 'now' })

// A racing claimer's whole claim: the dir, then its owner document.
function claimLikeARacer(lockDir: string): void {
  mkdirSync(lockDir, { recursive: true })
  writeFileSync(getSyncOwnerPath(lockDir), RACER)
}

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

describe('reclaimLostLock', () => {
  it('claims a lock dir that is gone, parent and all, and writes our owner with the same nonce', async () => {
    const lockDir = getSyncLockDir(await makeProject())

    expect(await reclaimLostLock(lockDir, MINE)).toBe(true)

    expect(parseSyncSessionOwner(JSON.parse(readFileSync(getSyncOwnerPath(lockDir), 'utf8')))).toEqual(MINE)
    expect(readdirSync(lockDir)).toEqual(['owner.json'])
  })

  it('leaves the owner a racer wrote byte-identical, and writes nothing beside it', async () => {
    const lockDir = getSyncLockDir(await makeProject())
    claimLikeARacer(lockDir)

    expect(await reclaimLostLock(lockDir, MINE)).toBe(false)

    expect(readFileSync(getSyncOwnerPath(lockDir), 'utf8')).toBe(RACER)
    expect(readdirSync(lockDir)).toEqual(['owner.json'])
  })

  it('leaves an owner that cannot be read byte-identical: the lock moved on', async () => {
    const lockDir = getSyncLockDir(await makeProject())
    mkdirSync(lockDir, { recursive: true })
    writeFileSync(getSyncOwnerPath(lockDir), '{torn')

    expect(await reclaimLostLock(lockDir, MINE)).toBe(false)

    expect(readFileSync(getSyncOwnerPath(lockDir), 'utf8')).toBe('{torn')
  })

  it('waits out a racer that has made the dir but not yet written its owner, then leaves its owner alone', async () => {
    const lockDir = getSyncLockDir(await makeProject())
    mkdirSync(lockDir, { recursive: true })
    const slowRacer = wait(150).then(() => writeFileSync(getSyncOwnerPath(lockDir), RACER))

    expect(await reclaimLostLock(lockDir, MINE)).toBe(false)

    await slowRacer
    expect(readFileSync(getSyncOwnerPath(lockDir), 'utf8')).toBe(RACER)
  })

  it('writes our owner into a dir whose owner stayed missing, once the settle has passed, and keeps what else is in it', async () => {
    const lockDir = getSyncLockDir(await makeProject())
    mkdirSync(lockDir, { recursive: true })
    writeFileSync(join(lockDir, 'watch-state.json'), '{"state":"kept"}')
    const started = Date.now()

    expect(await reclaimLostLock(lockDir, MINE)).toBe(true)

    expect(Date.now() - started).toBeGreaterThanOrEqual(550)
    expect(parseSyncSessionOwner(JSON.parse(readFileSync(getSyncOwnerPath(lockDir), 'utf8')))).toEqual(MINE)
    expect(readFileSync(join(lockDir, 'watch-state.json'), 'utf8')).toBe('{"state":"kept"}')
  })
})

describe('reassertHeldSession over a racing claimer', () => {
  it('never overwrites an owner that lands between its look at the lock dir and its mkdir', async () => {
    const dir = await makeProject()
    const session = await acquireSyncSession({ cwd: dir, kind: 'watch' })
    try {
      const lockDir = getSyncLockDir(dir)
      rmSync(join(dir, '.reference-ui'), { recursive: true, force: true })
      // The look finds the folder gone, and the racer's claim lands right behind it.
      const real = await vi.importActual<typeof import('./session-owner.ts')>('./session-owner.ts')
      vi.mocked(readOwnerFile).mockImplementationOnce(async (seenDir) => {
        const seen = await real.readOwnerFile(seenDir)
        claimLikeARacer(lockDir)
        return seen
      })

      expect(await reassertHeldSession(dir)).toBe(false)

      expect(readFileSync(getSyncOwnerPath(lockDir), 'utf8')).toBe(RACER)
      expect(readdirSync(lockDir)).toEqual(['owner.json'])
    } finally {
      session.release()
    }
  })

  it('never overwrites an owner that lands after a racer has made the dir', async () => {
    const dir = await makeProject()
    const session = await acquireSyncSession({ cwd: dir, kind: 'watch' })
    try {
      const lockDir = getSyncLockDir(dir)
      rmSync(join(dir, '.reference-ui'), { recursive: true, force: true })
      mkdirSync(lockDir, { recursive: true })
      const slowRacer = wait(150).then(() => writeFileSync(getSyncOwnerPath(lockDir), RACER))

      expect(await reassertHeldSession(dir)).toBe(false)

      await slowRacer
      expect(readFileSync(getSyncOwnerPath(lockDir), 'utf8')).toBe(RACER)
    } finally {
      session.release()
    }
  })

  it('re-asserts nothing for a held session whose owner is not this process', async () => {
    const dir = await makeProject()
    const lockDir = getSyncLockDir(dir)
    const hold = armSession(lockDir, { ...MINE, pid: process.pid + 1 }, false)
    markHeld(hold)
    try {
      expect(await reassertHeldSession(dir)).toBe(false)
      expect(existsSync(lockDir)).toBe(false)
    } finally {
      disarmSession(hold)
    }
  })
})
