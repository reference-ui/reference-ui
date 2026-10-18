// Tasty phase after a sync: it keeps the reference tasty build current behind every sync without blocking one.
// A cold process gets its first build from initReference on the background loop. Once the session holds a build,
// each sync queues one rebuild lane per source dir, so rapid saves coalesce into at most one follow-up. A save that
// lands while the cold build is still pending gets that same follow-up once the cold build settles. Every warm run
// reports its warnings the way the cold build does and keeps its landing until the next run lands, and a caller that
// drains its landings (fold) reads them through flushTastyLanding. It takes the project root, the config and the
// reporting flags, and sync never awaits a run.

import { resolve } from 'node:path'
import type { ReferenceUIConfig } from '../config/types.ts'
import { formatJsonDiagnostics, reportRefDiagnostics } from '../diagnostics/index.ts'
import {
  createReferenceBuildReport,
  flushReferenceBuild,
  getReferenceTastyBuild,
  initReference,
  isReferenceBuildPending,
  rebuildReferenceTastyBuild,
  tastyDiagnosticToNative,
  type ReferenceBuildResult,
  type ReferenceTastyBuildState,
} from '../reference/bridge/index.ts'

/** The failed shape of a build result: the only outcome a warm run leaves behind for its drainer. */
type FailedBuild = Extract<ReferenceBuildResult, { status: 'failed' }>

/** The complete shape of a build result: what a landed warm run reports to its drainer. */
type CompleteBuild = Extract<ReferenceBuildResult, { status: 'complete' }>

/** How a landing reports: the flags sync threads into the cold build, so warm and cold warnings read alike. */
interface LandingReporting {
  verbose: boolean
  fold: boolean
  json: boolean
}

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
  const landing: LandingReporting = {
    verbose: reporting.verbose,
    fold: reporting.foldRefDiagnostics,
    json: reporting.json,
  }
  initReference({ sourceDir: cwd, config }, landing)
  if (coldPending) queueAfterColdBuild(cwd, config, landing)
  refreshWarmTastyBuild(cwd, config, landing)
}

/**
 * Waits for the warm lane on sourceDir to run dry, then reports its latest landing: the complete or failed result of
 * the most recent run, or undefined when no warm run has landed. A watch resync drains it, so the resync line carries
 * the landing's warnings, and a failed rebuild prints on that line instead of a success line.
 */
export async function flushTastyLanding(sourceDir: string): Promise<ReferenceBuildResult | undefined> {
  const key = resolve(sourceDir)
  await tastyRefreshLanes.get(key)?.settled
  return latestLandings.get(key)
}

/**
 * The failure view of flushTastyLanding: the failed landing of the most recent run, or undefined once a run lands
 * cleanly or when no warm run ever failed. A drainer that reads only failures reads this one.
 */
export async function flushTastyRefresh(sourceDir: string): Promise<FailedBuild | undefined> {
  const landing = await flushTastyLanding(sourceDir)
  return landing?.status === 'failed' ? landing : undefined
}

interface TastyRefreshLane {
  config: ReferenceUIConfig
  /** The reporting of the sync that queued the latest run: a drained landing reports on its caller's line. */
  reporting: LandingReporting
  /** A sync landed while a run was in flight: the lane runs once more. */
  queued: boolean
  /** Settles once the lane runs dry: the in-flight run and any follow-up it queued. */
  settled: Promise<void>
}

/** One lane per resolved source dir; it exists exactly while a run is in flight or queued. */
const tastyRefreshLanes = new Map<string, TastyRefreshLane>()

/** The latest warm landing per resolved source dir, complete or failed; the next run that lands replaces it. */
const latestLandings = new Map<string, ReferenceBuildResult>()

/** Saves that landed while a cold build was pending, keyed by resolved source dir. The latest request wins. */
const coldFollowUps = new Map<string, { config: ReferenceUIConfig; reporting: LandingReporting }>()

// Warm path: the session holds a build, so every sync queues a rebuild. The
// first run starts on the next loop iteration, so sync never runs the scan.
function refreshWarmTastyBuild(sourceDir: string, config: ReferenceUIConfig, reporting: LandingReporting): void {
  if (getReferenceTastyBuild(sourceDir) === undefined) return
  const key = resolve(sourceDir)
  const lane = tastyRefreshLanes.get(key)
  if (lane !== undefined) {
    lane.config = config
    lane.reporting = reporting
    lane.queued = true
    return
  }
  const fresh: TastyRefreshLane = { config, reporting, queued: false, settled: Promise.resolve() }
  tastyRefreshLanes.set(key, fresh)
  fresh.settled = new Promise<void>((resolveSettled) => {
    setImmediate(() => resolveSettled(drainTastyRefreshLane(key, fresh)))
  })
}

// One rebuild at a time per source dir. Resetting the flag before each run means
// only a sync that lands during a run asks for another. Each run replaces the last
// landing, so a failure stays reported until a run lands.
async function drainTastyRefreshLane(key: string, lane: TastyRefreshLane): Promise<void> {
  do {
    lane.queued = false
    latestLandings.set(key, await landWarmBuild(key, lane))
  } while (lane.queued)
  tastyRefreshLanes.delete(key)
}

// One warm run: rebuild, then report the landing the way the cold build does. A
// throw becomes a failed landing, and an undrained lane also prints the failure on
// the background line.
async function landWarmBuild(key: string, lane: TastyRefreshLane): Promise<ReferenceBuildResult> {
  const reporting = lane.reporting
  try {
    const state = await rebuildReferenceTastyBuild({ sourceDir: key, config: lane.config })
    return reportWarmBuild(state, reporting)
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : String(reason)
    if (!reporting.fold) console.error(`[core] [ref] background tasty refresh failed: ${message}`)
    return { status: 'failed', message }
  }
}

// The same report run.ts makes for a cold build: an undrained json landing prints
// its array, and the verbose list or the folded count rides the caller's line. A
// state that carries no lists reports them empty, so it lands as a clean run.
function reportWarmBuild(state: ReferenceTastyBuildState, reporting: LandingReporting): CompleteBuild {
  const report = createReferenceBuildReport({
    warnings: state.warnings ?? [],
    diagnostics: state.diagnostics ?? [],
  })
  const entries = report.diagnostics.map(tastyDiagnosticToNative)
  if (reporting.json && !reporting.fold && entries.length > 0) console.log(formatJsonDiagnostics(entries))
  const reportedWarningCount = reportRefDiagnostics(entries, { verbose: reporting.verbose, fold: reporting.fold })
  return {
    status: 'complete',
    source: 'project',
    manifestPath: state.manifestPath,
    outputDir: state.outputDir,
    warningCount: report.warningCount,
    diagnosticCount: report.diagnosticCount,
    reportedWarningCount,
    diagnostics: report.diagnostics,
  }
}

// The cold scan may predate a save that landed while it ran, so one follow-up
// runs once the cold build settles. Saves during one cold build coalesce into it.
function queueAfterColdBuild(sourceDir: string, config: ReferenceUIConfig, reporting: LandingReporting): void {
  const key = resolve(sourceDir)
  const alreadyWaiting = coldFollowUps.has(key)
  coldFollowUps.set(key, { config, reporting })
  if (alreadyWaiting) return
  void flushReferenceBuild(key).then(() => runColdFollowUp(key))
}

// A failed cold build leaves no cached build, so refreshWarmTastyBuild drops the
// follow-up here, and the next sync starts a fresh cold build.
function runColdFollowUp(key: string): void {
  const followUp = coldFollowUps.get(key)
  coldFollowUps.delete(key)
  if (followUp !== undefined) refreshWarmTastyBuild(key, followUp.config, followUp.reporting)
}
