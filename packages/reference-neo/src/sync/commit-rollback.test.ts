// Rollback and supersede legs for the staged commit: a failure after live changes
// restores the folder as it was, a file in the way of a generated dir heals, and a
// superseded commit stops without rolling back what the new lock holder owns.
// Each leg runs over temp dirs with no writer process; the permission legs skip
// for root, since chmod does not stop root from writing.

import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { commitStagedDir } from './commit.ts'
import { lockTakenByOther } from './owner-check.ts'

const tempDirs: string[] = []
const isRoot = process.getuid?.() === 0
const permissionLeg = isRoot ? it.skip : it

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-commit-rollback-'))
  tempDirs.push(dir)
  return dir
}

function putFile(path: string, body: string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, body)
}

// Every file under root, relative path to its text. Empty when root is missing.
function treeOf(root: string): Record<string, string> {
  const out: Record<string, string> = {}
  const walk = (dir: string, rel: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      const key = rel === '' ? entry.name : `${rel}/${entry.name}`
      if (entry.isDirectory()) walk(full, key)
      else out[key] = readFileSync(full, 'utf8')
    }
  }
  if (existsSync(root)) walk(root, '')
  return out
}

function writeOwner(lockDir: string, pid: number, lockNonce: string): void {
  putFile(join(lockDir, 'owner.json'), JSON.stringify({ pid, lockNonce, kind: 'one-shot', argv: [], startedAt: '' }))
}

describe('commit rolls back a failure after live changes', () => {
  permissionLeg('restores replaced files and a dir moved aside, and removes what the commit added', async () => {
    const root = await makeTempDir()
    const outDir = join(root, '.reference-ui')
    const stage = join(root, 'stage')
    putFile(join(outDir, 'a.txt'), 'old a\n')
    putFile(join(outDir, 'slot', 'inner.txt'), 'old inner\n')
    putFile(join(outDir, 'ro', 'stale.txt'), 'stale\n')
    putFile(join(stage, 'a.txt'), 'new a\n')
    putFile(join(stage, 'slot'), 'a file where the dir was\n')
    putFile(join(stage, 'added.txt'), 'new\n')
    const before = treeOf(outDir)

    // The staged files all land first; the stale pass then fails moving ro/stale.txt out.
    chmodSync(join(outDir, 'ro'), 0o555)
    try {
      expect(() => commitStagedDir(stage, outDir)).toThrow()
    } finally {
      chmodSync(join(outDir, 'ro'), 0o755)
    }

    expect(treeOf(outDir)).toEqual(before)
  })

  it('a file in the way of a generated dir moves aside, the dir is made, and the commit lands whole', async () => {
    const root = await makeTempDir()
    const outDir = join(root, '.reference-ui')
    const stage = join(root, 'stage')
    putFile(join(outDir, 'styled'), 'not a directory\n')
    putFile(join(stage, 'styled', 'styles.css'), 'body {}\n')

    const stats = commitStagedDir(stage, outDir)

    expect(stats).toEqual({ committed: 1, skipped: 0, removed: 0 })
    expect(treeOf(outDir)).toEqual({ 'styled/styles.css': 'body {}\n' })
  })

  it('a stage nested in the out dir commits from itself and is removed, never retired as stale', async () => {
    const root = await makeTempDir()
    const outDir = join(root, '.reference-ui')
    const stage = join(outDir, 'sync.stage')
    putFile(join(outDir, 'old.txt'), 'stale\n')
    putFile(join(stage, 'a.txt'), 'new a\n')

    const stats = commitStagedDir(stage, outDir)

    expect(stats).toEqual({ committed: 1, skipped: 0, removed: 1 })
    expect(treeOf(outDir)).toEqual({ 'a.txt': 'new a\n' })
    expect(existsSync(stage)).toBe(false)
  })
})

describe('commit stops when another session holds the lock', () => {
  it('stops before its first live change when the lock is already taken', async () => {
    const root = await makeTempDir()
    const outDir = join(root, '.reference-ui')
    const stage = join(root, 'stage')
    putFile(join(outDir, 'one.txt'), 'old one\n')
    putFile(join(stage, 'one.txt'), 'new one\n')
    const before = treeOf(outDir)

    expect(() => commitStagedDir(stage, outDir, { superseded: () => true })).toThrow(/another sync took the lock/)

    expect(treeOf(outDir)).toEqual(before)
  })

  it('leaves what it already wrote in place, since the new holder owns the folder from then on', async () => {
    const root = await makeTempDir()
    const outDir = join(root, '.reference-ui')
    const stage = join(root, 'stage')
    putFile(join(outDir, 'one.txt'), 'old one\n')
    putFile(join(outDir, 'two.txt'), 'old two\n')
    putFile(join(stage, 'one.txt'), 'new one\n')
    putFile(join(stage, 'two.txt'), 'new two\n')
    // The first check (top of commit) and the first file pass; the second file's check finds the lock taken.
    let checks = 0
    const superseded = (): boolean => {
      checks += 1
      return checks > 2
    }

    expect(() => commitStagedDir(stage, outDir, { superseded })).toThrow(/another sync took the lock/)

    const after = treeOf(outDir)
    const landed = ['one.txt', 'two.txt'].filter((file) => after[file] !== undefined && after[file].startsWith('new'))
    expect(landed).toHaveLength(1)
    expect(['one.txt', 'two.txt'].filter((file) => after[file]?.startsWith('old'))).toHaveLength(1)
  })
})

describe('lock takeover probe', () => {
  it('reads a missing owner as not taken, since a racer rewrites it within milliseconds', async () => {
    const root = await makeTempDir()
    expect(lockTakenByOther(join(root, 'sync.lock'), 'mine')).toBe(false)
  })

  it('reads an owner with this nonce as ours, and a foreign or unreadable owner as taken', async () => {
    const root = await makeTempDir()
    const lockDir = join(root, 'sync.lock')
    writeOwner(lockDir, process.pid, 'mine')
    expect(lockTakenByOther(lockDir, 'mine')).toBe(false)
    writeOwner(lockDir, process.pid, 'theirs')
    expect(lockTakenByOther(lockDir, 'mine')).toBe(true)
    putFile(join(lockDir, 'owner.json'), '{ torn')
    expect(lockTakenByOther(lockDir, 'mine')).toBe(true)
  })
})
