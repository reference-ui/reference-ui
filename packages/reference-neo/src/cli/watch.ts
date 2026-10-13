// CLI watch runner: it takes a resolved project dir and emits the resident
// watcher behind `ref sync --watch`. The runner owns the process half only —
// boot block, resync/error prints, stall reports, signal shutdown, and the
// never-promise that holds the process open. File events and shutdown steps
// print only under --debug, the dev-only channel; --json moves every human line
// to stderr and prints one diagnostics array per sync event on stdout, a failed
// event included. A second watch covered by the resident session attaches to it
// (block plus signal forwarding) instead of exiting, so supervisors never read
// an early exit as completion. The watch driver itself (watchSync) lives in
// lib/watch per the WAVE4 verdict; this file only routes the flag to it.
import type { NativeDiagnostic } from '../native/contract.ts'
import type { ReferenceBuildResult } from '../reference/bridge/events.ts'
import type { WatchHandle } from '../lib/watch/index.ts'
import { onResyncStall } from '../lib/watch/scheduler.ts'
import { SyncCoveredByWatchError } from '../sync/session-owner.ts'
import { attachToWatchSession } from '../sync/session.ts'
import {
  foldedWarningCount,
  formatJsonDiagnostics,
  formatStuckSyncLine,
  messageOf,
  printBootBlock,
  printSyncLine,
  reportedSyncEntries,
  syncFailureEntry,
  UNSETTLED_SYNC_LINE,
} from './output.ts'

export interface WatchRunnerOptions {
  breakLock?: boolean
  verbose?: boolean
  debug?: boolean
  json?: boolean
  quiet?: boolean
}

// Ctrl-C, a supervisor's terminate, and the terminal hanging up all stop the
// watcher the same way.
const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const

// A bare process.exit can cut a piped write short, so the exit waits until the
// lines already written have left the process.
function exitAfterFlush(code: number): void {
  process.stdout.write('', () => {
    process.stderr.write('', () => process.exit(code))
  })
}

// What the shutdown reports: the dev-only trace, the human sink, and whether the
// scheduler gave up an in-flight sync at the shutdown bound.
interface ShutdownReport {
  trace: (line: string) => void
  say: (line: string) => void
  shutdownStalled: () => boolean
}

// The shutdown wiring: every shutdown signal stops the watcher and exits by
// code, never by signal. Attached before the tasty drain so an interrupt
// during boot still exits graceful instead of dying mid-drain. The session
// keeps its lock while stop() settles the in-flight sync and releases it
// last, so one stop runs per process: a signal that lands while stopping (a
// second Ctrl-C, or the forwarded copy of the first) is ignored, and can
// neither start a second stop nor exit before the lock is released. stop()
// waits at most the scheduler's shutdown bound for a wedged sync, so the exit
// is bounded too, and a sync given up that way exits 1 with the unsettled line.
function attachShutdown(handle: WatchHandle, report: ShutdownReport): void {
  let stopping = false
  const shutdown = (signal: NodeJS.Signals): void => {
    if (stopping) {
      report.trace(`shutdown ${signal}: already stopping, ignored`)
      return
    }
    stopping = true
    report.trace(`shutdown ${signal}: stopping`)
    void handle.stop().then(
      () => {
        report.trace('shutdown: stopped')
        if (report.shutdownStalled()) {
          report.say(UNSETTLED_SYNC_LINE)
          exitAfterFlush(1)
          return
        }
        exitAfterFlush(0)
      },
      (error: unknown) => {
        report.trace(`shutdown: stop failed: ${messageOf(error)}`)
        exitAfterFlush(1)
      },
    )
  }
  for (const signal of SHUTDOWN_SIGNALS) process.on(signal, shutdown)
}

// Routes the scheduler's stall reports onto the watch's own lines: a save that
// finds a stuck pass prints one line, and a pass that outlives the shutdown
// bound is recorded so the exit can name it. The subscription lives as long as
// the process, which runs one watch.
function trackStalls(say: (line: string) => void): { shutdownStalled: () => boolean } {
  let stalled = false
  onResyncStall((stall) => {
    if (stall.kind === 'shutdown') {
      stalled = true
      return
    }
    say(formatStuckSyncLine(stall.elapsedMs))
  })
  return { shutdownStalled: () => stalled }
}

// Drain the folded tasty landings one sync kicked off: the cold build first,
// then the warm refresh lane's latest landing. A failed landing prints its line
// here and the watch stays up; the caller then prints no success line for that
// sync. Otherwise the caller carries the landing's count (human) or diagnostics
// (JSON) into its own line. Resolves undefined when no landing has ever run.
async function drainFoldedLanding(dir: string, say: (line: string) => void): Promise<ReferenceBuildResult | undefined> {
  const { flushReferenceBuild } = await import('../reference/bridge/init.ts')
  const { flushTastyLanding } = await import('../sync/tasty-phase.ts')
  const cold = await flushReferenceBuild(dir)
  const landing = cold?.status === 'failed' ? cold : ((await flushTastyLanding(dir)) ?? cold)
  if (landing?.status === 'failed') say(`[ref] watch error: reference tasty build failed: ${landing.message}`)
  return landing
}

// The landing as JSON rows: a complete build contributes its diagnostics, and a
// failed build contributes its failure, so the sync event's array names it.
async function landingEntries(landing: ReferenceBuildResult | undefined): Promise<NativeDiagnostic[]> {
  if (landing === undefined) return []
  if (landing.status === 'failed') return [syncFailureEntry(`reference tasty build failed: ${landing.message}`)]
  const { tastyDiagnosticToNative } = await import('../reference/bridge/build-report.ts')
  return landing.diagnostics.map(tastyDiagnosticToNative)
}

export async function runWatch(dir: string, options: WatchRunnerOptions = {}): Promise<number> {
  const { breakLock = false, verbose = false, debug = false, json = false, quiet = false } = options
  // One sink per mode: --json keeps stdout purely machine-readable, so
  // every human line rides stderr and only diagnostics arrays print bare.
  const say = (line: string): void => {
    if (json) console.error(line)
    else console.log(line)
  }
  const stalls = trackStalls(say)
  try {
    const { watchSync } = await import('../lib/watch/index.ts')
    const handle = await watchSync(dir, {
      onChange: (change) => {
        if (debug) say(`[ref] ${change.event} ${change.relativePath}`)
      },
      onResync: async (result) => {
        const landing = await drainFoldedLanding(dir, say)
        const refWarnings = landing?.status === 'complete' ? landing.reportedWarningCount : 0
        if (json) {
          const refEntries = await landingEntries(landing)
          console.log(formatJsonDiagnostics([...reportedSyncEntries(result.diagnostics, result.compilerDiagnostics), ...refEntries]))
          return
        }
        // A failed landing already printed its own line, so the resync adds no success line over it.
        if (landing?.status === 'failed') return
        if (!quiet) printSyncLine(result.elapsedMs ?? 0, result.outDir, foldedWarningCount(result.warningCount + refWarnings, verbose))
      },
      onError: (err) => {
        // A failed resync is a sync event, so a JSON run prints its failure as that event's array.
        // Watcher faults reach here too and print the same single-row array.
        say(`[ref] watch error: ${messageOf(err)}`)
        if (json) console.log(formatJsonDiagnostics([syncFailureEntry(messageOf(err))]))
      },
    // Fold every landing silent: the runner drains each one and carries
    // its count into its own line, so no background summary ever dangles.
    }, { breakLock, verbose, foldRefDiagnostics: true })
    attachShutdown(handle, {
      trace: (line) => {
        if (debug) say(`[ref] ${line}`)
      },
      say,
      shutdownStalled: stalls.shutdownStalled,
    })
    // Ready means the hot path: the block prints the baseline's measured
    // sync wall, but only after the folded tasty landing drains, so the
    // Warnings row carries the total — sync plus tasty, one row, no dangle.
    const baselineLanding = await drainFoldedLanding(dir, say)
    const baselineRefWarnings = baselineLanding?.status === 'complete' ? baselineLanding.reportedWarningCount : 0
    if (json) {
      const refEntries = await landingEntries(baselineLanding)
      const reported = reportedSyncEntries(handle.baseline.diagnostics, handle.baseline.compilerDiagnostics)
      console.log(formatJsonDiagnostics([...reported, ...refEntries]))
    } else if (!quiet) {
      printBootBlock({ elapsedMs: handle.baseline.elapsedMs ?? 0, outDir: `${dir}/.reference-ui`, warnings: foldedWarningCount(handle.baseline.warningCount + baselineRefWarnings, verbose), watch: true })
    }
    await new Promise<void>(() => {})
    return 0
  } catch (err) {
    if (err instanceof SyncCoveredByWatchError) {
      // Covered but not done: attach to the resident session (block while
      // the owner runs, forwarding signals to it) instead of exiting, so a
      // second `ref sync --watch` never reports early completion to a
      // supervisor like `concurrently --success first`. The covered line
      // prints once the forwarders are armed, so whoever reads it can signal
      // this client at once and the signal still reaches the owner.
      await attachToWatchSession(err.watchPid, () => say(err.message))
      return 0
    }
    say(`[ref] watch failed: ${messageOf(err)}`)
    return 1
  }
}
