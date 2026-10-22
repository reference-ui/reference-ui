// What a staged commit must leave alone beside the generated files, and the strays it may sweep. It takes paths and
// the preserve roots and emits keep verdicts: a writer temp beside a preserved root stays while its writer lives, and
// evaluator scratch stays while it is young enough to belong to a running evaluation. Strays sweep: a dead writer's
// temp at once, a pid-less legacy temp and stranded scratch once old.

import { lstatSync, readdirSync, rmSync } from 'node:fs'
import { basename, dirname, join, sep } from 'node:path'
import { pidAlive } from './session.ts'

// An older writer build may still own a pid-less temp: sweep only once it is this old.
const LEGACY_TEMP_SWEEP_MS = 5 * 60_000
// A config evaluation (the one writer of scratch; fragments run in memory) finishes well inside this;
// older scratch was stranded by a killed run or by a build whose fragment evaluation still wrote temp files.
const SCRATCH_SWEEP_MS = 60_000

export function isUnder(path: string, root: string): boolean {
  return path === root || path.startsWith(root + sep)
}

// A writer stages beside its root as `<base>.tmp-<pid>-<random>` (an older build
// wrote `<base>.tmp-<random>`), then renames over the root: that temp is covered too.
function writerTempPrefix(root: string): string {
  return `${basename(root)}.tmp-`
}

export function isPreserved(path: string, preserved: string[]): boolean {
  return preserved.some(
    (root) => isUnder(path, root) || path.startsWith(join(dirname(root), writerTempPrefix(root)))
  )
}

// Scratch under the evaluator dir that a running evaluation may still own. A
// failed stat reads as fresh, since the owner may have just removed it.
export function isFreshScratch(path: string, scratch: string | undefined): boolean {
  if (scratch === undefined || path === scratch || !isUnder(path, scratch)) return false
  try {
    return Date.now() - lstatSync(path).mtimeMs < SCRATCH_SWEEP_MS
  } catch {
    return true
  }
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
export function sweepStrandedWriterTemps(preserved: string[]): number {
  return preserved.reduce((total, root) => total + sweepRootWriterTemps(root), 0)
}
