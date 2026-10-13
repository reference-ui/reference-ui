// Unit tests for the watch's lock re-assert over temp projects, no child processes.
// A held watch session whose lock dir a deletion removed gets its own owner back
// with the same nonce, a present or foreign owner is left alone, and a process
// that holds nothing re-asserts nothing.

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { getSyncLockDir, getSyncOwnerPath } from '../../sync/session-owner.ts'
import { acquireSyncSession, reassertHeldSession } from '../../sync/session.ts'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function makeTempProject(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-watch-lock-'))
  tempDirs.push(dir)
  return dir
}

function readOwner(cwd: string): Record<string, unknown> {
  return JSON.parse(readFileSync(getSyncOwnerPath(getSyncLockDir(cwd)), 'utf8')) as Record<string, unknown>
}

describe('reassertHeldSession', () => {
  it('restores the held owner, with the same nonce, after the generated folder is deleted', async () => {
    const dir = await makeTempProject()
    const session = await acquireSyncSession({ cwd: dir, kind: 'watch' })
    try {
      const held = readOwner(dir)
      rmSync(join(dir, '.reference-ui'), { recursive: true, force: true })
      expect(existsSync(getSyncLockDir(dir))).toBe(false)

      expect(await reassertHeldSession(dir)).toBe(true)
      expect(readOwner(dir)).toEqual(held)
      expect(await reassertHeldSession(dir)).toBe(false)
    } finally {
      session.release()
    }
  })

  it('leaves a lock owned by another session alone', async () => {
    const dir = await makeTempProject()
    const session = await acquireSyncSession({ cwd: dir, kind: 'watch' })
    try {
      const foreign = { ...readOwner(dir), lockNonce: 'foreign-nonce', kind: 'one-shot' }
      const owner = getSyncOwnerPath(getSyncLockDir(dir))
      rmSync(owner)
      writeFileSync(owner, JSON.stringify(foreign))

      expect(await reassertHeldSession(dir)).toBe(false)
      expect(readOwner(dir)).toEqual(foreign)
    } finally {
      session.release()
    }
  })

  it('re-asserts nothing for a project this process does not hold', async () => {
    const dir = await makeTempProject()
    expect(await reassertHeldSession(dir)).toBe(false)
    expect(existsSync(getSyncLockDir(dir))).toBe(false)
  })
})
