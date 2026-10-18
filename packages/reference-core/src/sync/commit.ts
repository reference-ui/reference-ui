// Staged commit for the Neo generated folder. It takes a fully assembled staging dir plus the live out dir and emits the new folder with no missing-file window.
// Identical bytes keep their mtime, changed files are linked into place over a backup of their old bytes, and stale entries retire last.
// Every live change is journaled, so a failed commit rolls back to the last-good folder (backups a rollback cannot restore move to a sibling `sync.rollback-*` dir), and a superseded one stops without touching what the new lock holder owns.
// Preserved paths (the session lock, the tasty dir) never commit or delete, and a writer temp beside one survives too, as does young evaluator scratch
// (commit-keep.ts); temps a dead writer left behind and stranded scratch sweep at commit.
// Readers always see complete files, which is what makes the folder bundler-friendly with no bundler plugin.

import {
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  rmSync,
  statSync,
  type Dirent,
  type Stats,
} from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { CommitJournal } from './commit-journal.ts'
import { isFreshScratch, isPreserved, isUnder, sweepStrandedWriterTemps } from './commit-keep.ts'
import { pauseInCommit } from './commit-pause.ts'

export interface CommitStats {
  committed: number
  skipped: number
  removed: number
}

export interface CommitOptions {
  /**
   * Absolute paths that never commit and never delete (lock, tasty dir). A root
   * also covers its sibling writer temps `<base>.tmp-*`; a dead writer's temps
   * there sweep at commit, while a live writer's always stay.
   */
  preserve?: string[]
  /**
   * True once another session holds the lock. Checked before every live change:
   * a superseded commit stops at once and never rolls back, since the new holder
   * owns the folder from then on.
   */
  superseded?: () => boolean
  /**
   * Absolute path of the evaluator scratch dir. Another process loads its config
   * there before it contends for the lock, so a scratch entry retires (and a
   * scratch dir prunes) only once it is too old to belong to a live evaluation.
   */
  scratch?: string
}

interface CommitContext {
  stagingRoot: string
  outDir: string
  preserved: string[]
  preserveAncestors: Set<string>
  stagedRel: Set<string>
  journal: CommitJournal
  superseded: () => boolean
  scratch: string | undefined
}

type LiveKind = 'missing' | 'file' | 'symlink' | 'dir' | 'other'

// The backup dir lives inside the stage, so every hard link stays on one volume.
// It is named per process, so a sync that displaced another never shares its backups.
const BACKUP_DIR_PREFIX = '.commit-backup-'
// A rollback that cannot restore an entry moves the backup dir here, beside the stage in the out dir (one
// volume, so one rename), because the failed run removes the stage. Nothing commits from it and the stage
// walk never sees it. The next successful commit retires it as stale output, like any live file with no
// staged twin: the folder is rebuilt whole by then, so those last-good bytes are obsolete.
const KEPT_BACKUP_PREFIX = 'sync.rollback-'
const SUPERSEDED_MESSAGE =
  '[ref] sync: another sync took the lock during this commit; the new holder now owns the generated folder'


// The stage sits inside the out dir, so the live walks must skip it by path.
function isStageEntry(path: string, ctx: CommitContext): boolean {
  return path === ctx.stagingRoot
}

function lstatOrUndefined(path: string): Stats | undefined {
  try {
    return lstatSync(path)
  } catch {
    return undefined
  }
}

function statOrUndefined(path: string): Stats | undefined {
  try {
    return statSync(path)
  } catch {
    return undefined
  }
}

// The kind of one live entry, read without following a link: a symlink is its own kind.
function liveKindOf(path: string): LiveKind {
  const stat = lstatOrUndefined(path)
  if (stat === undefined) return 'missing'
  if (stat.isSymbolicLink()) return 'symlink'
  if (stat.isDirectory()) return 'dir'
  return stat.isFile() ? 'file' : 'other'
}

// Identical bytes, following a link to a file. An unreadable live file counts as different.
function sameBytes(stagedFile: string, liveFile: string): boolean {
  let live: Buffer
  try {
    live = readFileSync(liveFile)
  } catch {
    return false
  }
  const staged = readFileSync(stagedFile)
  return staged.length === live.length && staged.equals(live)
}

function readDirEntries(dir: string): Dirent[] {
  try {
    return readdirSync(dir, { withFileTypes: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return []
    throw error
  }
}

// Every non-dir entry under the stage, recursive. Symlinks never resolve,
// so a linked dir moves as one entry instead of spilling its target.
function collectStageFiles(dir: string, out: string[]): void {
  for (const entry of readDirEntries(dir)) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) collectStageFiles(full, out)
    else out.push(full)
  }
}

// The live dirs between the out dir and a file's parent, top-down, out dir excluded.
function liveDirsAbove(outDir: string, liveFile: string): string[] {
  const dirs: string[] = []
  let current = outDir
  for (const part of relative(outDir, dirname(liveFile)).split(sep)) {
    if (part === '') continue
    current = join(current, part)
    dirs.push(current)
  }
  return dirs
}

function assertOwned(ctx: CommitContext): void {
  if (ctx.superseded()) throw new Error(SUPERSEDED_MESSAGE)
}

// Every live dir above a file exists as a dir first: a file or link in the way moves
// aside (a type change, so the path is briefly absent), and the dir is then made.
function ensureLiveDirs(ctx: CommitContext, liveFile: string): void {
  for (const dir of liveDirsAbove(ctx.outDir, liveFile)) {
    if (statOrUndefined(dir)?.isDirectory() === true) continue
    assertOwned(ctx)
    if (liveKindOf(dir) !== 'missing') ctx.journal.moveAside(dir)
    ctx.journal.makeDir(dir)
  }
}

// Puts the staged file at its live path. A file or link keeps its bytes as a
// backup first, so the rename-over never leaves the path empty.
function placeStagedFile(ctx: CommitContext, stagedFile: string, liveFile: string, kind: LiveKind): void {
  if (kind === 'file' || kind === 'symlink') {
    ctx.journal.keep(liveFile, kind)
  } else if (kind === 'dir' || kind === 'other') {
    ctx.journal.moveAside(liveFile)
    ctx.journal.noteAdded(liveFile)
  } else {
    ctx.journal.noteAdded(liveFile)
  }
  ctx.journal.place(stagedFile, liveFile)
}

// One staged file goes live: identical bytes stay untouched (mtime stable),
// anything else is placed over its live twin. True when the live tree changed.
function commitOneFile(ctx: CommitContext, stagedFile: string): boolean {
  const liveFile = join(ctx.outDir, relative(ctx.stagingRoot, stagedFile))
  if (isPreserved(liveFile, ctx.preserved)) return false
  const kind = liveKindOf(liveFile)
  if ((kind === 'file' || kind === 'symlink') && sameBytes(stagedFile, liveFile)) return false
  assertOwned(ctx)
  ensureLiveDirs(ctx, liveFile)
  placeStagedFile(ctx, stagedFile, liveFile, kind)
  return true
}

// Live files with no staged twin retire, last, after every commit landed. Preserved
// paths stay put whatever the stage holds, and no stage dir is ever walked.
function retireStaleFiles(dir: string, ctx: CommitContext): number {
  let removed = 0
  for (const entry of readDirEntries(dir)) {
    const full = join(dir, entry.name)
    if (isStageEntry(full, ctx)) continue
    if (entry.isDirectory()) {
      removed += retireStaleFiles(full, ctx)
      continue
    }
    if (ctx.stagedRel.has(relative(ctx.outDir, full))) continue
    if (isPreserved(full, ctx.preserved) || isFreshScratch(full, ctx.scratch)) continue
    assertOwned(ctx)
    ctx.journal.moveAside(full)
    removed += 1
  }
  return removed
}


// Live dirs from the preserve roots up to (not including) the out dir.
function preserveAncestors(outDir: string, preserved: string[]): Set<string> {
  const ancestors = new Set<string>()
  for (const root of preserved) {
    let dir = dirname(root)
    while (isUnder(dir, outDir) && dir !== outDir) {
      ancestors.add(dir)
      const parent = dirname(dir)
      if (parent === dir) break
      dir = parent
    }
  }
  return ancestors
}

// The prune never touches preserved paths, their ancestors, or the stage.
function isPruneSkipped(dir: string, ctx: CommitContext): boolean {
  return (
    isPreserved(dir, ctx.preserved) || ctx.preserveAncestors.has(dir) || isStageEntry(dir, ctx) || isFreshScratch(dir, ctx.scratch)
  )
}

// Post-order empty-dir prune: stale dirs left behind by the file pass drop,
// while skipped paths and the root itself never do.
function pruneEmptyDirs(dir: string, ctx: CommitContext, isRoot: boolean): void {
  if (isPruneSkipped(dir, ctx)) return
  let entries: Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry.isDirectory()) pruneEmptyDirs(join(dir, entry.name), ctx, false)
  }
  if (isRoot) return
  try {
    rmdirSync(dir)
  } catch {
    // ENOTEMPTY holds live files; ENOENT already gone: not ours to remove.
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

// A failed commit puts the folder back as it was. A superseded one only rethrows:
// the lock holder that took over owns the folder now, and undoing our writes could
// overwrite what it has committed since. When some entries cannot be restored, their
// backups leave the stage for a dir the error names, so the failed run's stage removal
// cannot take the last-good bytes with it.
function restoreAfterFailure(ctx: CommitContext, error: unknown): never {
  if (ctx.superseded()) throw error
  const stuck = ctx.journal.rollback()
  if (stuck.length === 0) throw error
  const kept = join(ctx.outDir, `${KEPT_BACKUP_PREFIX}${process.pid}-${Date.now()}`)
  const where = ctx.journal.keepBackups(kept) ? `; their last-good bytes are kept in ${kept}` : ''
  throw new Error(`${messageOf(error)}; rollback could not restore ${stuck.join(', ')}${where}`)
}

/**
 * Move an assembled staging dir live: unchanged bytes keep their mtime,
 * changed files are linked into place over a backup of their old bytes, stale entries
 * retire last, and the emptied stage drops. The live folder is never missing a
 * file mid-commit. A failure rolls every change back before it rethrows, and the
 * error names the dir holding the backups of any entry the rollback could not
 * restore; a superseded commit stops without rolling back.
 */
export function commitStagedDir(stagingDir: string, outDir: string, options: CommitOptions = {}): CommitStats {
  const stagingRoot = resolve(stagingDir)
  const liveRoot = resolve(outDir)
  const preserved = (options.preserve ?? []).map((entry) => resolve(entry))
  const stagedFiles: string[] = []
  collectStageFiles(stagingRoot, stagedFiles)
  mkdirSync(liveRoot, { recursive: true })
  const ctx: CommitContext = {
    stagingRoot,
    outDir: liveRoot,
    preserved,
    preserveAncestors: preserveAncestors(liveRoot, preserved),
    stagedRel: new Set(stagedFiles.map((file) => relative(stagingRoot, file))),
    journal: new CommitJournal(join(stagingRoot, `${BACKUP_DIR_PREFIX}${process.pid}`)),
    superseded: options.superseded ?? (() => false),
    scratch: options.scratch === undefined ? undefined : resolve(options.scratch),
  }
  const stats: CommitStats = { committed: 0, skipped: 0, removed: 0 }
  try {
    assertOwned(ctx)
    for (const file of stagedFiles) {
      if (commitOneFile(ctx, file)) stats.committed += 1
      else stats.skipped += 1
    }
    // Test-only and inert unless REF_TEST_COMMIT_PAUSE is set: the live changes have landed, stale retirement has not.
    pauseInCommit()
    stats.removed = sweepStrandedWriterTemps(preserved)
    stats.removed += retireStaleFiles(liveRoot, ctx)
    pruneEmptyDirs(liveRoot, ctx, true)
  } catch (error) {
    restoreAfterFailure(ctx, error)
  }
  ctx.journal.discard()
  rmSync(stagingRoot, { recursive: true, force: true })
  return stats
}
