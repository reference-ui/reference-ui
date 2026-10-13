// Undo log for the staged commit. It takes a backup dir inside the stage and
// emits journaled live mutations, each recorded with its way back. A replaced
// file keeps its old inode as a hard link (a symlink copy for a link) until the
// rename-over lands, so the live path always names a whole file. A rollback
// renames the backups back and removes what the commit added, newest first.

import {
  copyFileSync,
  linkSync,
  mkdirSync,
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

function undo(entry: JournalEntry): void {
  if (entry.op === 'restore') {
    renameSync(entry.backup, entry.live)
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
   * Puts a staged file's bytes at its live path: a hard link into the backup dir,
   * then a rename over the live path. The staged name is left in place, so a sync
   * that was displaced mid-commit can copy what is staged but never move a file out
   * of the stage that the newer sync is committing from.
   */
  place(stagedFile: string, live: string): void {
    const temp = this.nextBackupPath()
    linkOrCopy(stagedFile, temp)
    renameSync(temp, live)
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

  /** Puts every journaled change back, newest first. Returns the paths it could not restore. */
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

  /** Drops the backups once the commit has landed. Best effort: the stage removal takes them too. */
  discard(): void {
    try {
      rmSync(this.backupRoot, { recursive: true, force: true })
    } catch {
      // The stage removal that follows the commit sweeps the backup dir as well.
    }
  }
}
