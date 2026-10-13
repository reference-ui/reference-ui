// Staged commit for the Neo generated folder.
// It takes a fully assembled staging dir plus the live out dir and emits the
// new folder with no missing-file window. Identical bytes keep their mtime so
// watchers see nothing, changed files flip by atomic rename, and stale
// entries delete last. Preserved paths (the session lock, the tasty dir)
// never commit and never delete, and a writer temp beside one survives too,
// so the holder's mutex and the background tasty writer survive every sync;
// temps a dead writer left behind sweep at commit. Readers always see
// complete files, which is what makes the folder bundler-friendly with no
// bundler plugin.

import {
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  rmSync,
  statSync,
  type Dirent,
  type Stats,
} from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
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
}

interface CommitPlan {
  outDir: string
  stagedRel: Set<string>
  preserved: string[]
  preserveAncestors: Set<string>
  /** Nested stage root: the stale pass never descends into it. */
  stageRoot: string
}

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

// Every non-dir entry under the stage, recursive. Symlinks never resolve,
// so a linked dir moves as one entry instead of spilling its target.
function collectStageFiles(dir: string, out: string[]): void {
  let entries: Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return
    throw error
  }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) collectStageFiles(full, out)
    else out.push(full)
  }
}

function sameBytes(stagedFile: string, liveFile: string): boolean {
  const staged = readFileSync(stagedFile)
  const live = readFileSync(liveFile)
  return staged.length === live.length && staged.equals(live)
}

// One staged file goes live: identical bytes stay untouched (mtime stable),
// anything else flips by atomic rename. True when the live tree changed.
function commitOneFile(
  stagingRoot: string,
  outDir: string,
  stagedFile: string,
  preserved: string[]
): boolean {
  const liveFile = join(outDir, relative(stagingRoot, stagedFile))
  if (isPreserved(liveFile, preserved)) return false
  mkdirSync(dirname(liveFile), { recursive: true })
  let liveStat: Stats | undefined
  try {
    liveStat = statSync(liveFile)
  } catch {
    liveStat = undefined
  }
  if (liveStat?.isDirectory() === true) rmSync(liveFile, { recursive: true, force: true })
  else if (liveStat?.isFile() === true && sameBytes(stagedFile, liveFile)) return false
  else if (liveStat !== undefined) rmSync(liveFile, { force: true })
  renameSync(stagedFile, liveFile)
  return true
}

// Live files with no staged twin delete, last, after every commit landed.
// Preserved paths stay put whatever the stage holds.
function removeStaleFiles(dir: string, plan: CommitPlan): number {
  let removed = 0
  let entries: Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return 0
    throw error
  }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    // The nested stage is not live output: the final rm drops it whole.
    if (full === plan.stageRoot) continue
    if (entry.isDirectory()) {
      removed += removeStaleFiles(full, plan)
      continue
    }
    if (plan.stagedRel.has(relative(plan.outDir, full))) continue
    if (isPreserved(full, plan.preserved)) continue
    rmSync(full, { force: true })
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

// An older writer build may still own a pid-less temp: sweep only once it is this old.
const LEGACY_TEMP_SWEEP_MS = 5 * 60_000

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

// The prune never touches preserved paths, their ancestors, or the nested
// stage (the final rm drops it whole).
function isPruneSkipped(dir: string, plan: CommitPlan): boolean {
  return isPreserved(dir, plan.preserved) || plan.preserveAncestors.has(dir) || dir === plan.stageRoot
}

// Post-order empty-dir prune: stale dirs left behind by the file pass drop,
// while skipped paths and the root itself never do.
function pruneEmptyDirs(dir: string, plan: CommitPlan, isRoot: boolean): void {
  if (isPruneSkipped(dir, plan)) return
  let entries: Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry.isDirectory()) pruneEmptyDirs(join(dir, entry.name), plan, false)
  }
  if (isRoot) return
  try {
    rmdirSync(dir)
  } catch {
    // ENOTEMPTY holds live files; ENOENT already gone: not ours to remove.
  }
}

/**
 * Move an assembled staging dir live: unchanged bytes keep their mtime,
 * changed files flip by atomic rename, stale entries delete last, and the
 * emptied stage drops. The live folder is never missing mid-commit, so any
 * bundler watching it sees one coherent refresh with no plugin.
 */
export function commitStagedDir(
  stagingDir: string,
  outDir: string,
  options: CommitOptions = {}
): CommitStats {
  const stagingRoot = resolve(stagingDir)
  const liveRoot = resolve(outDir)
  const preserved = (options.preserve ?? []).map((entry) => resolve(entry))
  const stats: CommitStats = { committed: 0, skipped: 0, removed: 0 }
  const stagedFiles: string[] = []
  collectStageFiles(stagingRoot, stagedFiles)
  const stagedRel = new Set(stagedFiles.map((file) => relative(stagingRoot, file)))
  for (const file of stagedFiles) {
    if (commitOneFile(stagingRoot, liveRoot, file, preserved)) stats.committed += 1
    else stats.skipped += 1
  }
  const plan: CommitPlan = {
    outDir: liveRoot,
    stagedRel,
    preserved,
    preserveAncestors: preserveAncestors(liveRoot, preserved),
    stageRoot: stagingRoot,
  }
  stats.removed = sweepStrandedWriterTemps(preserved)
  stats.removed += removeStaleFiles(liveRoot, plan)
  pruneEmptyDirs(liveRoot, plan, true)
  rmSync(stagingRoot, { recursive: true, force: true })
  return stats
}
