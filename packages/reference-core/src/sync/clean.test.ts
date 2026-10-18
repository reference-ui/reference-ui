// Unit tests for the clean writer leg: the preserving cleanDir guardrail,
// the emptied-root drop, and the clean session kind. They take temp dirs
// plus planted lock files and assert the live lock survives a wipe
// byte-identical while everything else goes. Real-process clean kills
// (clean toward sync, clean toward watch) are proven live in
// clean-repro.test.ts.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanDir, removeDirIfEmpty } from './clean.ts'
import {
  SYNC_LOCK_DIR_NAME,
  getSyncLockDir,
  lockActorTag,
  parseSyncSessionOwner,
  supersededMessage,
} from './session-owner.ts'
import { acquireSyncSession } from './session.ts'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-clean-'))
  tempDirs.push(dir)
  return dir
}

function plantLock(outDir: string): { ownerBytes: Buffer; preemptBytes: Buffer } {
  const lockDir = join(outDir, SYNC_LOCK_DIR_NAME)
  mkdirSync(lockDir, { recursive: true })
  const owner = JSON.stringify({ pid: process.pid, lockNonce: 'live-nonce', kind: 'watch', argv: [], startedAt: '' })
  const preempt = JSON.stringify({ pid: 4242, kind: 'one-shot' })
  writeFileSync(join(lockDir, 'owner.json'), owner)
  writeFileSync(join(lockDir, 'preempt.json'), preempt)
  return { ownerBytes: Buffer.from(owner), preemptBytes: Buffer.from(preempt) }
}

describe('cleanDir guardrail', () => {
  it('keeps a live lock byte-identical while wiping everything else', async () => {
    const dir = await makeTempDir()
    const outDir = join(dir, '.reference-ui')
    mkdirSync(join(outDir, 'system'), { recursive: true })
    writeFileSync(join(outDir, 'system', 'baseSystem.mjs'), 'stale\n')
    writeFileSync(join(outDir, 'loose.txt'), 'stale\n')
    const before = plantLock(outDir)
    const entriesBefore = readFileSync(join(outDir, SYNC_LOCK_DIR_NAME, 'owner.json'))

    await cleanDir(outDir, { preserve: [SYNC_LOCK_DIR_NAME] })

    expect(existsSync(join(outDir, 'system'))).toBe(false)
    expect(existsSync(join(outDir, 'loose.txt'))).toBe(false)
    const lockDir = join(outDir, SYNC_LOCK_DIR_NAME)
    expect(existsSync(lockDir)).toBe(true)
    expect(readFileSync(join(lockDir, 'owner.json'))).toEqual(before.ownerBytes)
    expect(readFileSync(join(lockDir, 'owner.json'))).toEqual(entriesBefore)
    expect(readFileSync(join(lockDir, 'preempt.json'))).toEqual(before.preemptBytes)
  })

  it('still removes the whole tree without a preserve list', async () => {
    const dir = await makeTempDir()
    const outDir = join(dir, '.reference-ui')
    mkdirSync(join(outDir, 'system'), { recursive: true })
    writeFileSync(join(outDir, 'system', 'baseSystem.mjs'), 'stale\n')

    await cleanDir(outDir)

    expect(existsSync(outDir)).toBe(false)
  })
})

describe('removeDirIfEmpty', () => {
  it('drops an empty dir and tolerates a missing one', async () => {
    const dir = await makeTempDir()
    const empty = join(dir, 'empty')
    mkdirSync(empty)
    await removeDirIfEmpty(empty)
    expect(existsSync(empty)).toBe(false)
    await removeDirIfEmpty(join(dir, 'never-there'))
  })

  it('leaves a non-empty dir untouched', async () => {
    const dir = await makeTempDir()
    const full = join(dir, 'full')
    mkdirSync(full)
    writeFileSync(join(full, 'file.txt'), 'mine\n')
    await removeDirIfEmpty(full)
    expect(readFileSync(join(full, 'file.txt'), 'utf8')).toBe('mine\n')
  })
})

describe('clean writer kind', () => {
  it('validates the clean owner kind and tags clean messages', () => {
    expect(parseSyncSessionOwner({ pid: 7, lockNonce: 'n', kind: 'clean', argv: [], startedAt: '' })).toMatchObject({
      kind: 'clean',
    })
    expect(lockActorTag('clean')).toBe('clean')
    expect(lockActorTag('one-shot')).toBe('sync')
    expect(lockActorTag('watch')).toBe('sync')
    expect(supersededMessage(4242, 'clean')).toBe('[ref] sync superseded by clean pid 4242')
    expect(supersededMessage(4242)).toBe('[ref] sync superseded by sync pid 4242')
  })

  it('takes a dead-pid lock as clean with clean-tagged warnings', async () => {
    const dir = await makeTempDir()
    const lockDir = getSyncLockDir(dir)
    mkdirSync(lockDir, { recursive: true })
    writeFileSync(
      join(lockDir, 'owner.json'),
      JSON.stringify({ pid: 2 ** 30, lockNonce: 'dead', kind: 'one-shot', argv: [], startedAt: '' }),
    )
    const lines: string[] = []
    const original = console.log
    console.log = (...args: unknown[]): void => {
      lines.push(args.map(String).join(' '))
    }
    try {
      const session = await acquireSyncSession({ cwd: dir, kind: 'clean' })
      try {
        expect(session.owner.kind).toBe('clean')
      } finally {
        session.release()
      }
    } finally {
      console.log = original
    }
    expect(lines.some((line) => line.includes('[ref] clean: stale lock'))).toBe(true)
    expect(existsSync(lockDir)).toBe(false)
  })
})
