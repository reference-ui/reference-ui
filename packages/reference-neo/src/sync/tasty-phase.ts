// Tasty phase after a sync: it keeps the reference tasty build current behind every sync without blocking one.
// A cold process gets its first build from initReference on the background loop. Once the session holds a build,
// each sync queues one rebuild lane per source dir, so rapid saves coalesce into at most one follow-up. A save that
// lands while the cold build is still pending gets that same follow-up once the cold build settles. A caller that
// drains its landings (fold) reads a failed warm run through flushTastyRefresh instead of the background line. It
// takes the project root, the config and the reporting flags, and sync never awaits a run.

import { resolve } from 'node:path'
import type { ReferenceUIConfig } from '../config/types.ts'
import {
  flushReferenceBuild,
  getReferenceTastyBuild,
  initReference,
  isReferenceBuildPending,
  rebuildReferenceTastyBuild,
  type ReferenceBuildResult,
} from '../reference/bridge/index.ts'

/** The failed shape of a build result: the only outcome a warm run leaves behind for its drainer. */
type FailedBuild = Extract<ReferenceBuildResult, { status: 'failed' }>

/**
 * Schedules the tasty phase for one sync. Runs never block sync, failures report and clear, and a sync landing
 * mid-run queues exactly one follow-up, so two builds never write the tasty dir at once.
 */
export function scheduleReferenceTastyPhase(
  cwd: string,
  config: ReferenceUIConfig,
  reporting: { verbose: boolean; foldRefDiagnostics: boolean; json: boolean }
): void {
  // Read before initReference: the sync that starts the cold build finds nothing pending, so it asks for no follow-up.
  const coldPending = isReferenceBuildPending(cwd)
  initReference(
    { sourceDir: cwd, config },
    { verbose: reporting.verbose, fold: reporting.foldRefDiagnostics, json: reporting.json }
  )
  if (coldPending) queueAfterColdBuild(cwd, config, reporting.foldRefDiagnostics)
  refreshWarmTastyBuild(cwd, config, reporting.foldRefDiagnostics)
}

/**
 * Waits for the warm lane on sourceDir to run dry, then reports the latest warm failure: the failed result while the
 * most recent rebuild threw, and undefined once one lands or when no warm run ever failed. A watch resync drains it,
 * so a failed rebuild prints on that resync's own line instead of a success line.
 */
export async function flushTastyRefresh(sourceDir: string): Promise<FailedBuild | undefined> {
  const key = resolve(sourceDir)
  await tastyRefreshLanes.get(key)?.settled
  return latestRefreshFailures.get(key)
}

interface TastyRefreshLane {
  config: ReferenceUIConfig
  /** The caller drains each landing, so a failed run rides that caller's line and not the background one. */
  fold: boolean
  /** A sync landed while a run was in flight: the lane runs once more. */
  queued: boolean
  /** Settles once the lane runs dry: the in-flight run and any follow-up it queued. */
  settled: Promise<void>
}

/** One lane per resolved source dir; it exists exactly while a run is in flight or queued. */
const tastyRefreshLanes = new Map<string, TastyRefreshLane>()

/** The latest warm run's failure per resolved source dir; the next run that lands clears it. */
const latestRefreshFailures = new Map<string, FailedBuild>()

/** Saves that landed while a cold build was pending, keyed by resolved source dir. The latest request wins. */
const coldFollowUps = new Map<string, { config: ReferenceUIConfig; fold: boolean }>()

// Warm path: the session holds a build, so every sync queues a rebuild. The
// first run starts on the next loop iteration, so sync never runs the scan.
function refreshWarmTastyBuild(sourceDir: string, config: ReferenceUIConfig, fold: boolean): void {
  if (getReferenceTastyBuild(sourceDir) === undefined) return
  const key = resolve(sourceDir)
  const lane = tastyRefreshLanes.get(key)
  if (lane !== undefined) {
    lane.config = config
    lane.fold = fold
    lane.queued = true
    return
  }
  const fresh: TastyRefreshLane = { config, fold, queued: false, settled: Promise.resolve() }
  tastyRefreshLanes.set(key, fresh)
  fresh.settled = new Promise<void>((resolveSettled) => {
    setImmediate(() => resolveSettled(drainTastyRefreshLane(key, fresh)))
  })
}

// One rebuild at a time per source dir. Resetting the flag before each run means
// only a sync that lands during a run asks for another. Each run replaces the last
// outcome, so a failure stays reported until a run lands; an undrained lane also
// prints its failure on the background line.
async function drainTastyRefreshLane(key: string, lane: TastyRefreshLane): Promise<void> {
  do {
    lane.queued = false
    try {
      await rebuildReferenceTastyBuild({ sourceDir: key, config: lane.config })
      latestRefreshFailures.delete(key)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason)
      latestRefreshFailures.set(key, { status: 'failed', message })
      if (!lane.fold) console.error(`[neo] [ref] background tasty refresh failed: ${message}`)
    }
  } while (lane.queued)
  tastyRefreshLanes.delete(key)
}

// The cold scan may predate a save that landed while it ran, so one follow-up
// runs once the cold build settles. Saves during one cold build coalesce into it.
function queueAfterColdBuild(sourceDir: string, config: ReferenceUIConfig, fold: boolean): void {
  const key = resolve(sourceDir)
  const alreadyWaiting = coldFollowUps.has(key)
  coldFollowUps.set(key, { config, fold })
  if (alreadyWaiting) return
  void flushReferenceBuild(key).then(() => runColdFollowUp(key))
}

// A failed cold build leaves no cached build, so refreshWarmTastyBuild drops the
// follow-up here, and the next sync starts a fresh cold build.
function runColdFollowUp(key: string): void {
  const followUp = coldFollowUps.get(key)
  coldFollowUps.delete(key)
  if (followUp !== undefined) refreshWarmTastyBuild(key, followUp.config, followUp.fold)
}
