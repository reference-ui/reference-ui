// Undo log for the staged commit. It takes a backup dir inside the stage and
// emits journaled live mutations, each recorded with its way back. A replaced
// file keeps its old inode as a hard link (a symlink copy for a link) until the
// rename-over lands, so the live path always names a whole file. A placed file is
// a copy, never a link to its staged twin, so a write into the stage can never
// reach live bytes. A rollback renames the backups back and removes what the
// commit added, newest first, and the backups it could not rename back can leave
// the stage whole, so they outlive the failed run.

import {
  constants,
  copyFileSync,
  linkSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readlinkSync,
  renameSync,
  rmdirSync,
  rmSync,
  statSync,
  symlinkSync,
  utimesSync,
} from 'node:fs'
import { join } from 'node:path'

type JournalEntry =
  | { op: 'restore'; live: string; backup: string }
  | { op: 'remove'; path: string; isDir: boolean }

/** A live entry the commit replaces by rename: a regular file or a symlink. */
export type KeptKind = 'file' | 'symlink'

// Filesystems that cannot hard link fall back to a byte copy with the times kept.
const NO_HARD_LINK_CODES = new Set(['EXDEV', 'EPERM', 'ENOTSUP', 'EOPNOTSUPP', 'EMLINK'])

function linkOrCopy(from: string, to: string): void {
  try {
    linkSync(from, to)
  } catch (error) {
    if (!NO_HARD_LINK_CODES.has((error as NodeJS.ErrnoException)?.code ?? '')) throw error
    copyFileSync(from, to)
    const source = statSync(from)
    utimesSync(to, source.atime, source.mtime)
  }
}

// A directory the commit made is only removed empty; a missing one is already undone.
function removeAddedDir(dir: string): void {
  try {
    rmdirSync(dir)
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') throw error
  }
}

// True when the live path still names the backup's inode: the rename-over never landed, so there is
// nothing to put back. Asked before any rename, because a link renamed onto itself is a no-op on Linux
// but fails with EACCES on macOS inside a read-only dir. An inode number of 0 (a filesystem without
// stable ones) never matches.
function isUnreplaced(live: string, backup: string): boolean {
  try {
    const liveStat = lstatSync(live, { bigint: true })
    const backupStat = lstatSync(backup, { bigint: true })
    return liveStat.ino !== 0n && liveStat.ino === backupStat.ino && liveStat.dev === backupStat.dev
  } catch {
    return false
  }
}

// An unreplaced live path is already restored, so its backup is only a spare link to live bytes and drops:
// what stays in the backup dir after a rollback is exactly what it could not put back.
function undo(entry: JournalEntry): void {
  if (entry.op === 'restore') {
    if (isUnreplaced(entry.live, entry.backup)) rmSync(entry.backup, { force: true })
    else renameSync(entry.backup, entry.live)
  } else if (entry.isDir) {
    removeAddedDir(entry.path)
  } else {
    rmSync(entry.path, { force: true })
  }
}

function entryPath(entry: JournalEntry): string {
  return entry.op === 'restore' ? entry.live : entry.path
}

export class CommitJournal {
  private readonly backupRoot: string
  private readonly entries: JournalEntry[] = []
  private backupCount = 0

  constructor(backupRoot: string) {
    this.backupRoot = backupRoot
  }

  private nextBackupPath(): string {
    mkdirSync(this.backupRoot, { recursive: true })
    this.backupCount += 1
    return join(this.backupRoot, String(this.backupCount))
  }

  /**
   * Puts a staged file's bytes at its live path: a copy into the backup dir (a
   * clone where the filesystem has them), then a rename over the live path. A
   * copy, not a link: a displaced sync that rewrites a stage file in place must
   * never change a live file's bytes. The staged name is left in place, so a
   * displaced sync never moves a file out of the stage a newer sync commits from.
   * A placement that fails leaves no copy behind, so the backup dir never holds staged bytes.
   */
  place(stagedFile: string, live: string): void {
    const temp = this.nextBackupPath()
    try {
      copyFileSync(stagedFile, temp, constants.COPYFILE_FICLONE)
      renameSync(temp, live)
    } catch (error) {
      rmSync(temp, { force: true })
      throw error
    }
  }

  /** Keeps a live file or symlink beside itself, so the rename-over that follows can be undone. */
  keep(live: string, kind: KeptKind): void {
    const backup = this.nextBackupPath()
    if (kind === 'symlink') symlinkSync(readlinkSync(live), backup)
    else linkOrCopy(live, backup)
    this.entries.push({ op: 'restore', live, backup })
  }

  /** Moves a live entry out of the way (a directory or an odd file) into the backup dir. */
  moveAside(live: string): void {
    const backup = this.nextBackupPath()
    renameSync(live, backup)
    this.entries.push({ op: 'restore', live, backup })
  }

  /** Creates one live directory the commit needs; rollback removes it when empty. */
  makeDir(dir: string): void {
    mkdirSync(dir)
    this.entries.push({ op: 'remove', path: dir, isDir: true })
  }

  /** Notes a live path the commit is about to create, recorded before the rename that creates it. */
  noteAdded(path: string): void {
    this.entries.push({ op: 'remove', path, isDir: false })
  }

  /**
   * Puts every journaled change back, newest first. Returns the paths it could not restore.
   * Only their backups stay in the backup dir, which is dropped whole when nothing is stuck.
   */
  rollback(): string[] {
    const stuck: string[] = []
    for (const entry of [...this.entries].reverse()) {
      try {
        undo(entry)
      } catch {
        stuck.push(entryPath(entry))
      }
    }
    if (stuck.length === 0) this.discard()
    return stuck
  }

  /**
   * Moves the backup dir to `destination` when a rollback left backups in it, so the last-good
   * bytes of the entries it could not restore outlive the stage. One rename: `destination` must
   * be on the backup dir's volume. False means nothing was kept, either because no backup was
   * left or because the rename failed, and the backups stay where they were.
   */
  keepBackups(destination: string): boolean {
    try {
      if (readdirSync(this.backupRoot).length === 0) return false
      renameSync(this.backupRoot, destination)
      return true
    } catch {
      return false
    }
  }

  /** Drops the backups once the commit has landed. Best effort: the stage removal takes them too. */
  discard(): void {
    try {
      rmSync(this.backupRoot, { recursive: true, force: true })
    } catch {
      // The stage removal that follows the commit sweeps the backup dir as well.
    }
  }
}
