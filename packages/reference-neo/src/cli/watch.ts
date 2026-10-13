// CLI watch runner: it takes a resolved project dir and emits the resident
// watcher behind `ref sync --watch`. The runner owns the process half only —
// boot block, resync/error prints, signal shutdown, and the never-promise
// that holds the process open. File events and shutdown steps print only
// under --debug, the dev-only channel; --json moves every human line to
// stderr and prints one diagnostics array per sync event on stdout. A second
// watch covered by the resident session attaches to it (block plus signal
// forwarding) instead of exiting, so supervisors never read an early exit as
// completion. The watch driver itself (watchSync) lives in lib/watch per the
// WAVE4 verdict; this file only routes the flag to it.
import type { ReferenceBuildResult } from '../reference/bridge/events.ts'
import type { WatchHandle } from '../lib/watch/index.ts'
import { SyncCoveredByWatchError } from '../sync/session-owner.ts'
import { attachToWatchSession } from '../sync/session.ts'
import {
  foldedWarningCount,
  formatJsonDiagnostics,
  messageOf,
  printBootBlock,
  printSyncLine,
  reportedSyncEntries,
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

// The shutdown wiring: every shutdown signal stops the watcher and exits by
// code, never by signal. Attached before the tasty drain so an interrupt
// during boot still exits graceful instead of dying mid-drain. The session
// keeps its lock while stop() settles the in-flight sync and releases it
// last, so one stop runs per process: a signal that lands while stopping (a
// second Ctrl-C, or the forwarded copy of the first) is ignored, and can
// neither start a second stop nor exit before the lock is released. The
// trace lines ride the dev-only --debug channel.
function attachShutdown(handle: WatchHandle, trace: (line: string) => void): void {
  let stopping = false
  const shutdown = (signal: NodeJS.Signals): void => {
    if (stopping) {
      trace(`shutdown ${signal}: already stopping, ignored`)
      return
    }
    stopping = true
    trace(`shutdown ${signal}: stopping`)
    void handle.stop().then(
      () => {
        trace('shutdown: stopped')
        process.exit(0)
      },
      (error: unknown) => {
        trace(`shutdown: stop failed: ${messageOf(error)}`)
        process.exit(1)
      },
    )
  }
  for (const signal of SHUTDOWN_SIGNALS) process.on(signal, shutdown)
}

export async function runWatch(dir: string, options: WatchRunnerOptions = {}): Promise<number> {
  const { breakLock = false, verbose = false, debug = false, json = false, quiet = false } = options
  // One sink per mode: --json keeps stdout purely machine-readable, so
  // every human line rides stderr and only diagnostics arrays print bare.
  const say = (line: string): void => {
    if (json) console.error(line)
    else console.log(line)
  }
  try {
    const { watchSync } = await import('../lib/watch/index.ts')
    const { flushReferenceBuild } = await import('../reference/bridge/init.ts')
    // Drain one folded tasty landing: failures route through the
    // runner's error line and the watch stays up; otherwise the caller
    // carries the completed build's count (human) or entries (JSON)
    // into its own line. Resolves undefined when nothing is pending —
    // every resync past the first drains free.
    const drainFoldedLanding = async (): Promise<ReferenceBuildResult | undefined> => {
      const build = await flushReferenceBuild(dir)
      if (build?.status === 'failed') say(`[ref] watch error: reference tasty build failed: ${build.message}`)
      return build
    }
    const handle = await watchSync(dir, {
      onChange: (change) => {
        if (debug) say(`[ref] ${change.event} ${change.relativePath}`)
      },
      onResync: async (result) => {
        const build = await drainFoldedLanding()
        const refWarnings = build?.status === 'complete' ? build.reportedWarningCount : 0
        if (json) {
          const { tastyDiagnosticToNative } = await import('../reference/bridge/build-report.ts')
          const refEntries = build?.status === 'complete' ? build.diagnostics.map(tastyDiagnosticToNative) : []
          console.log(formatJsonDiagnostics([...reportedSyncEntries(result.diagnostics, result.compilerDiagnostics), ...refEntries]))
          return
        }
        if (!quiet) printSyncLine(result.elapsedMs ?? 0, result.outDir, foldedWarningCount(result.warningCount + refWarnings, verbose))
      },
      onError: (err) => {
        say(`[ref] watch error: ${messageOf(err)}`)
      },
    // Fold every landing silent: the runner drains each one and carries
    // its count into its own line, so no background summary ever dangles.
    }, { breakLock, verbose, foldRefDiagnostics: true })
    attachShutdown(handle, (line) => {
      if (debug) say(`[ref] ${line}`)
    })
    // Ready means the hot path: the block prints the baseline's measured
    // sync wall, but only after the folded tasty landing drains, so the
    // Warnings row carries the total — sync plus tasty, one row, no dangle.
    const baselineBuild = await drainFoldedLanding()
    const baselineRefWarnings = baselineBuild?.status === 'complete' ? baselineBuild.reportedWarningCount : 0
    if (json) {
      const { tastyDiagnosticToNative } = await import('../reference/bridge/build-report.ts')
      const refEntries = baselineBuild?.status === 'complete' ? baselineBuild.diagnostics.map(tastyDiagnosticToNative) : []
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
