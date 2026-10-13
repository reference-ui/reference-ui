// Tasty phase after a sync: it keeps the reference tasty build current behind every sync without blocking one.
// A cold process gets its first build from initReference on the background loop. Once the session holds a build,
// each sync queues one rebuild lane per source dir, so rapid saves coalesce into at most one follow-up. A save that
// lands while the cold build is still pending gets that same follow-up once the cold build settles. It takes the
// project root, the config and the reporting flags, and emits nothing: sync never awaits a run.

import { resolve } from 'node:path'
import type { ReferenceUIConfig } from '../config/types.ts'
import {
  flushReferenceBuild,
  getReferenceTastyBuild,
  initReference,
  isReferenceBuildPending,
  rebuildReferenceTastyBuild,
} from '../reference/bridge/index.ts'

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
  if (coldPending) queueAfterColdBuild(cwd, config)
  refreshWarmTastyBuild(cwd, config)
}

interface TastyRefreshLane {
  config: ReferenceUIConfig
  /** A sync landed while a run was in flight: the lane runs once more. */
  queued: boolean
}

/** One lane per resolved source dir; it exists exactly while a run is in flight or queued. */
const tastyRefreshLanes = new Map<string, TastyRefreshLane>()

/** Saves that landed while a cold build was pending, keyed by resolved source dir. The latest config wins. */
const coldFollowUps = new Map<string, ReferenceUIConfig>()

// Warm path: the session holds a build, so every sync queues a rebuild. The
// first run starts on the next loop iteration, so sync never runs the scan.
function refreshWarmTastyBuild(sourceDir: string, config: ReferenceUIConfig): void {
  if (getReferenceTastyBuild(sourceDir) === undefined) return
  const key = resolve(sourceDir)
  const lane = tastyRefreshLanes.get(key)
  if (lane !== undefined) {
    lane.config = config
    lane.queued = true
    return
  }
  const fresh: TastyRefreshLane = { config, queued: false }
  tastyRefreshLanes.set(key, fresh)
  setImmediate(() => drainTastyRefreshLane(key, fresh))
}

// One rebuild at a time per source dir. Resetting the flag before each run means
// only a sync that lands during a run asks for another.
async function drainTastyRefreshLane(key: string, lane: TastyRefreshLane): Promise<void> {
  do {
    lane.queued = false
    try {
      await rebuildReferenceTastyBuild({ sourceDir: key, config: lane.config })
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : String(reason)
      console.error(`[neo] [ref] background tasty refresh failed: ${detail}`)
    }
  } while (lane.queued)
  tastyRefreshLanes.delete(key)
}

// The cold scan may predate a save that landed while it ran, so one follow-up
// runs once the cold build settles. Saves during one cold build coalesce into it.
function queueAfterColdBuild(sourceDir: string, config: ReferenceUIConfig): void {
  const key = resolve(sourceDir)
  const alreadyWaiting = coldFollowUps.has(key)
  coldFollowUps.set(key, config)
  if (alreadyWaiting) return
  void flushReferenceBuild(key).then(() => runColdFollowUp(key))
}

// A failed cold build leaves no cached build, so refreshWarmTastyBuild drops the
// follow-up here, and the next sync starts a fresh cold build.
function runColdFollowUp(key: string): void {
  const config = coldFollowUps.get(key)
  coldFollowUps.delete(key)
  if (config !== undefined) refreshWarmTastyBuild(key, config)
}
