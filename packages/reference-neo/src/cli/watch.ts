// CLI watch runner: it takes a resolved project dir and emits the resident
// watcher behind `ref sync --watch`. The runner owns the process half only —
// boot block, resync/error prints, signal shutdown, and the never-promise
// that holds the process open. File events print only under --debug, the
// dev-only channel; --json moves every human line to stderr and prints one
// diagnostics array per sync event on stdout. The watch driver itself
// (watchSync) lives in lib/watch per the WAVE4 verdict; this file only
// routes the flag to it.
import type { ReferenceBuildResult } from '../reference/bridge/events.ts'
import type { WatchHandle } from '../lib/watch/index.ts'
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

// The shutdown wiring: SIGINT/SIGTERM stop the watcher and exit by code,
// never by signal. Attached before the tasty drain so an interrupt during
// boot still exits graceful instead of dying mid-drain.
function attachShutdown(handle: WatchHandle): void {
  const shutdown = (): void => {
    void handle.stop().then(
      () => process.exit(0),
      () => process.exit(1),
    )
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
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
    attachShutdown(handle)
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
    say(`[ref] watch failed: ${messageOf(err)}`)
    return 1
  }
}
