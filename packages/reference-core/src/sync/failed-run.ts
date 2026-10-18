// What a failed sync clears away. It takes the stage dir, the out dir and whether this run still owns the lock,
// and emits nothing: the stage and any stale evaluator scratch are removed, young scratch stays for a running
// evaluation, and a run that lost the lock removes neither. The last-good folder is never touched here. Backups
// a rollback could not restore are moved to a sibling of the stage (commit.ts), so this removal never reaches them.

import { readdirSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { getOutDirTmpPath } from '../lib/paths/index.ts'
import { removeDirIfEmpty } from './clean.ts'
import { isFreshScratch } from './commit-keep.ts'

// Stale evaluator scratch goes, young scratch stays: another process may be
// loading its config there before it contends for the lock. The dir itself goes
// once empty.
async function dropStaleScratch(outDir: string): Promise<void> {
  const scratch = getOutDirTmpPath(outDir)
  let names: string[]
  try {
    names = readdirSync(scratch)
  } catch {
    return
  }
  for (const name of names) {
    const entry = join(scratch, name)
    if (!isFreshScratch(entry, scratch)) await rm(entry, { recursive: true, force: true })
  }
  await removeDirIfEmpty(scratch)
}

// The stage dies with the failed run while the live folder keeps its
// last-good outputs. Stale evaluator scratch drops too, so a fresh world still
// lands nothing at all (NEO-SYNC-11). A run that lost the lock removes neither:
// the stage and scratch belong to the new holder by then.
export async function dropFailedStageAndScratch(stageDir: string, outDir: string, ownsLock: boolean): Promise<void> {
  if (!ownsLock) return
  try {
    await rm(stageDir, { recursive: true, force: true })
    await dropStaleScratch(outDir)
  } catch {
    // Best effort: the next sync drops a stranded stage at start, and
    // the commit prunes scratch it did not stage.
  }
}
