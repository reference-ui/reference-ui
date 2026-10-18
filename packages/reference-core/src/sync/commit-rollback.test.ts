// Rollback and supersede legs for the staged commit: a failure after live changes
// restores the folder as it was, a rollback that cannot restore a file keeps that file's
// backup in a dir the error names, a file in the way of a generated dir heals, and a
// superseded commit stops without rolling back what the new lock holder owns.
// Each leg runs over temp dirs with no writer process; the permission legs skip
// for root, since chmod does not stop root from writing.

import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { commitStagedDir } from './commit.ts'
import { CommitJournal } from './commit-journal.ts'
import { dropFailedStageAndScratch } from './failed-run.ts'
import { lockTakenByOther } from './owner-check.ts'

const tempDirs: string[] = []
const isRoot = process.getuid?.() === 0
const permissionLeg = isRoot ? it.skip : it

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'core-commit-rollback-'))
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

// The error a run throws; a run that does not throw fails the leg.
function failureOf(run: () => unknown): Error {
  try {
    run()
  } catch (error) {
    if (error instanceof Error) return error
    throw error
  }
  throw new Error('expected the commit to throw')
}

// The error a commit throws while `readOnly` is read-only; the mode is back before this returns.
function failureWhileReadOnly(readOnly: string, run: () => unknown): Error {
  chmodSync(readOnly, 0o555)
  try {
    return failureOf(run)
  } finally {
    chmodSync(readOnly, 0o755)
  }
}

// The sibling dirs of the stage where a rollback keeps the backups it could not restore.
function keptDirs(outDir: string): string[] {
  return readdirSync(outDir).filter((name) => name.startsWith('sync.rollback-'))
}

// The paths and the kept dir a failed rollback names, read from the thrown message.
function namedBy(error: Error): { stuck: string; kept: string } {
  const named = /; rollback could not restore (.+); their last-good bytes are kept in (.+)$/.exec(error.message)
  if (named === null) throw new Error(`the error names no kept dir: ${error.message}`)
  return { stuck: named[1], kept: named[2] }
}

// A commit that replaces locked/a.txt and open/b.txt, then fails retiring ro/stale.txt.
function putStuckWorld(outDir: string, stage: string): void {
  putFile(join(outDir, 'locked', 'a.txt'), 'old a\n')
  putFile(join(outDir, 'open', 'b.txt'), 'old b\n')
  putFile(join(outDir, 'ro', 'stale.txt'), 'stale\n')
  putFile(join(stage, 'locked', 'a.txt'), 'new a\n')
  putFile(join(stage, 'open', 'b.txt'), 'new b\n')
}

// Runs that commit with ro/ read-only, so the stale pass fails, and with locked/ turned read-only
// once both files landed: the rename that would put a.txt back cannot write, so its rollback sticks
// while b.txt's succeeds. The ownership probe runs before every live change, which makes it the
// seam for the lock. The modes are restored before the error comes back.
function commitWithStuckRollback(outDir: string, stage: string): Error {
  const locked = join(outDir, 'locked')
  const bothLanded = (): boolean =>
    readFileSync(join(locked, 'a.txt'), 'utf8') === 'new a\n' &&
    readFileSync(join(outDir, 'open', 'b.txt'), 'utf8') === 'new b\n'
  const superseded = (): boolean => {
    if (bothLanded()) chmodSync(locked, 0o555)
    return false
  }
  try {
    return failureWhileReadOnly(join(outDir, 'ro'), () => commitStagedDir(stage, outDir, { superseded }))
  } finally {
    chmodSync(locked, 0o755)
  }
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
    const failure = failureWhileReadOnly(join(outDir, 'ro'), () => commitStagedDir(stage, outDir))

    // Nothing stuck: the original failure comes back as it was and no backup dir is kept.
    expect(failure.message).not.toMatch(/rollback could not restore/)
    expect(keptDirs(outDir)).toEqual([])
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

describe('a rollback that cannot restore a file keeps that file backup', () => {
  permissionLeg('moves the backups out of the stage, names the dir in the error, and keeps them past the failed run', async () => {
    const root = await makeTempDir()
    const outDir = join(root, '.reference-ui')
    const stage = join(outDir, 'sync.stage')
    putStuckWorld(outDir, stage)

    const { stuck, kept } = namedBy(commitWithStuckRollback(outDir, stage))

    // The error names the file it could not restore and a sibling of the stage holding its old bytes.
    expect(stuck).toBe(join(outDir, 'locked', 'a.txt'))
    expect(dirname(kept)).toBe(outDir)
    expect(basename(kept)).toMatch(new RegExp(`^sync\\.rollback-${process.pid}-\\d+$`))
    expect(keptDirs(outDir)).toEqual([basename(kept)])
    expect(Object.values(treeOf(kept))).toEqual(['old a\n'])
    // The other replaced file is restored; the stuck one still holds its new bytes; the stage holds only staged files.
    expect(readFileSync(join(outDir, 'open', 'b.txt'), 'utf8')).toBe('old b\n')
    expect(readFileSync(join(outDir, 'locked', 'a.txt'), 'utf8')).toBe('new a\n')
    expect(treeOf(stage)).toEqual({ 'locked/a.txt': 'new a\n', 'open/b.txt': 'new b\n' })

    // The failed sync removes its stage; the backups are no longer inside it.
    await dropFailedStageAndScratch(stage, outDir, true)
    expect(existsSync(stage)).toBe(false)
    expect(Object.values(treeOf(kept))).toEqual(['old a\n'])
  })

  permissionLeg('is swept as stale output by the next successful commit, which rebuilds the folder whole', async () => {
    const root = await makeTempDir()
    const outDir = join(root, '.reference-ui')
    const stage = join(outDir, 'sync.stage')
    putStuckWorld(outDir, stage)
    const { kept } = namedBy(commitWithStuckRollback(outDir, stage))
    await dropFailedStageAndScratch(stage, outDir, true)
    putFile(join(stage, 'locked', 'a.txt'), 'new a\n')
    putFile(join(stage, 'open', 'b.txt'), 'new b\n')

    commitStagedDir(stage, outDir)

    expect(existsSync(kept)).toBe(false)
    expect(treeOf(outDir)).toEqual({ 'locked/a.txt': 'new a\n', 'open/b.txt': 'new b\n' })
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

describe('a placed live file shares nothing with its staged twin', () => {
  it('keeps live bytes when a displaced sync rewrites the stage file in place', async () => {
    const root = await makeTempDir()
    const staged = join(root, 'stage', 'index.js')
    const live = join(root, 'out', 'index.js')
    putFile(staged, 'index v2\n')
    putFile(live, 'index v1\n')
    const journal = new CommitJournal(join(root, 'stage', '.commit-backup'))

    journal.keep(live, 'file')
    journal.place(staged, live)
    writeFileSync(staged, 'displaced writer\n')

    expect(statSync(live).ino).not.toBe(statSync(staged).ino)
    expect(readFileSync(live, 'utf8')).toBe('index v2\n')
  })
})

describe('a rollback leaves in the backup dir exactly what it could not put back', () => {
  permissionLeg('drops the backup of a placement that never landed and the copy of one that failed', async () => {
    const root = await makeTempDir()
    const out = join(root, 'out')
    const stage = join(root, 'stage')
    const landed = join(out, 'locked', 'a.txt')
    const missed = join(out, 'ro', 'b.txt')
    putFile(landed, 'old a\n')
    putFile(missed, 'old b\n')
    putFile(join(stage, 'a.txt'), 'new a\n')
    putFile(join(stage, 'b.txt'), 'new b\n')
    const journal = new CommitJournal(join(stage, '.commit-backup'))
    journal.keep(landed, 'file')
    journal.place(join(stage, 'a.txt'), landed)
    journal.keep(missed, 'file')

    // locked/ turns read-only once a.txt landed, so its rollback sticks; b.txt never lands in ro/.
    const kept = join(root, 'kept')
    chmodSync(join(out, 'locked'), 0o555)
    chmodSync(join(out, 'ro'), 0o555)
    try {
      expect(() => journal.place(join(stage, 'b.txt'), missed)).toThrow()
      expect(journal.rollback()).toEqual([landed])
      expect(journal.keepBackups(kept)).toBe(true)
    } finally {
      chmodSync(join(out, 'locked'), 0o755)
      chmodSync(join(out, 'ro'), 0o755)
    }

    expect(Object.values(treeOf(kept))).toEqual(['old a\n'])
    expect(readFileSync(missed, 'utf8')).toBe('old b\n')
  })

  permissionLeg('keeps nothing when only added paths are stuck', async () => {
    const root = await makeTempDir()
    const live = join(root, 'out', 'a.txt')
    const added = join(root, 'out', 'added')
    putFile(live, 'old a\n')
    const journal = new CommitJournal(join(root, 'stage', '.commit-backup'))
    journal.keep(live, 'file')
    journal.makeDir(added)
    journal.noteAdded(join(added, 'f.txt'))
    writeFileSync(join(added, 'f.txt'), 'new\n')

    // The added file cannot be removed from a read-only dir, so it and its dir stick; no backup is left to keep.
    chmodSync(added, 0o555)
    const kept = join(root, 'kept')
    try {
      expect(journal.rollback()).toEqual([join(added, 'f.txt'), added])
      expect(journal.keepBackups(kept)).toBe(false)
    } finally {
      chmodSync(added, 0o755)
    }

    expect(existsSync(kept)).toBe(false)
  })

  it('keeps nothing when the rollback was clean or no backup was ever made', async () => {
    const root = await makeTempDir()
    const live = join(root, 'out', 'a.txt')
    putFile(live, 'old a\n')
    const journal = new CommitJournal(join(root, 'stage', '.commit-backup'))
    expect(journal.keepBackups(join(root, 'kept'))).toBe(false)

    journal.keep(live, 'file')
    expect(journal.rollback()).toEqual([])
    expect(journal.keepBackups(join(root, 'kept'))).toBe(false)
    expect(existsSync(join(root, 'kept'))).toBe(false)
  })
})
