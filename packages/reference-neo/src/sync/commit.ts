// Staged commit for the Neo generated folder. It takes a fully assembled staging dir plus the live out dir and emits the new folder with no missing-file window.
// Identical bytes keep their mtime, changed files are linked into place over a backup of their old bytes, and stale entries retire last.
// Every live change is journaled, so a failed commit rolls back to the last-good folder, and a superseded one stops without touching what the new lock holder owns.
// Preserved paths (the session lock, the tasty dir) never commit or delete, and a writer temp beside one survives too; temps a dead writer left behind sweep at commit.
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
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { CommitJournal } from './commit-journal.ts'
import { pidAlive } from './session.ts'

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
}

interface CommitContext {
  stagingRoot: string
  outDir: string
  preserved: string[]
  preserveAncestors: Set<string>
  stagedRel: Set<string>
  journal: CommitJournal
  superseded: () => boolean
}

type LiveKind = 'missing' | 'file' | 'symlink' | 'dir' | 'other'

// The backup dir lives inside the stage, so every hard link stays on one volume.
// It is named per process, so a sync that displaced another never shares its backups.
const BACKUP_DIR_PREFIX = '.commit-backup-'
const SUPERSEDED_MESSAGE =
  '[ref] sync: another sync took the lock during this commit; the new holder now owns the generated folder'

// An older writer build may still own a pid-less temp: sweep only once it is this old.
const LEGACY_TEMP_SWEEP_MS = 5 * 60_000

function isUnder(path: string, root: string): boolean {
  return path === root || path.startsWith(root + sep)
}

// A writer stages beside its root as `<base>.tmp-<pid>-<random>` (an older build
// wrote `<base>.tmp-<random>`), then renames over the root: that temp is covered too.
function writerTempPrefix(root: string): string {
  return `${basename(root)}.tmp-`
}

function isPreserved(path: string, preserved: string[]): boolean {
  return preserved.some(
    (root) => isUnder(path, root) || path.startsWith(join(dirname(root), writerTempPrefix(root)))
  )
}

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
    if (isPreserved(full, ctx.preserved)) continue
    assertOwned(ctx)
    ctx.journal.moveAside(full)
    removed += 1
  }
  return removed
}

// A writer's temp carries its pid after the base: `<pid>-<random>`. A name with
// no leading pid is the legacy shape from an older writer build.
function writerTempPid(rest: string): number | undefined {
  const match = /^(\d+)-/.exec(rest)
  return match === null ? undefined : Number(match[1])
}

// Stranded means no live writer owns it: a dead pid sweeps at once, a legacy name
// only once old, and a live pid always stays (our own included). A failed stat
// keeps the entry, since a live writer may have renamed it a moment ago.
function isStrandedWriterTemp(entryPath: string, rest: string): boolean {
  const pid = writerTempPid(rest)
  if (pid !== undefined) return !pidAlive(pid)
  try {
    return Date.now() - lstatSync(entryPath).mtimeMs > LEGACY_TEMP_SWEEP_MS
  } catch {
    return false
  }
}

// A missing dir holds nothing to sweep.
function entryNames(dir: string): string[] {
  try {
    return readdirSync(dir)
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return []
    throw error
  }
}

// The stranded writer temps beside one preserved root; each swept entry counts once.
function sweepRootWriterTemps(root: string): number {
  const parent = dirname(root)
  const prefix = writerTempPrefix(root)
  let swept = 0
  for (const name of entryNames(parent)) {
    if (!name.startsWith(prefix)) continue
    const entryPath = join(parent, name)
    if (!isStrandedWriterTemp(entryPath, name.slice(prefix.length))) continue
    rmSync(entryPath, { recursive: true, force: true })
    swept += 1
  }
  return swept
}

// Sweeps every preserved root's stranded writer temps and returns how many went.
function sweepStrandedWriterTemps(preserved: string[]): number {
  return preserved.reduce((total, root) => total + sweepRootWriterTemps(root), 0)
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
  return isPreserved(dir, ctx.preserved) || ctx.preserveAncestors.has(dir) || isStageEntry(dir, ctx)
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
// overwrite what it has committed since.
function restoreAfterFailure(ctx: CommitContext, error: unknown): never {
  if (ctx.superseded()) throw error
  const stuck = ctx.journal.rollback()
  if (stuck.length === 0) throw error
  throw new Error(`${messageOf(error)}; rollback could not restore ${stuck.join(', ')}`)
}

/**
 * Move an assembled staging dir live: unchanged bytes keep their mtime,
 * changed files are linked into place over a backup of their old bytes, stale entries
 * retire last, and the emptied stage drops. The live folder is never missing a
 * file mid-commit. A failure rolls every change back before it rethrows; a
 * superseded commit stops without rolling back.
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
  }
  const stats: CommitStats = { committed: 0, skipped: 0, removed: 0 }
  try {
    assertOwned(ctx)
    for (const file of stagedFiles) {
      if (commitOneFile(ctx, file)) stats.committed += 1
      else stats.skipped += 1
    }
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
