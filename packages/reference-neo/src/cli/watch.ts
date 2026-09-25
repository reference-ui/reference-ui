// CLI watch runner: it takes a resolved project dir and emits the resident
// watcher behind `ref sync --watch`. The runner owns the process half only —
// boot block, resync/error prints, signal shutdown, and the never-promise
// that holds the process open. File events print only under --debug, the
// dev-only channel; --json moves every human line to stderr and prints one
// diagnostics array per sync event on stdout. The watch driver itself
// (watchSync) lives in lib/watch per the WAVE4 verdict; this file only
// routes the flag to it.
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
    const started = Date.now()
    const handle = await watchSync(dir, {
      onChange: (change) => {
        if (debug) say(`[ref] ${change.event} ${change.relativePath}`)
      },
      onResync: (result) => {
        if (json) {
          console.log(formatJsonDiagnostics(reportedSyncEntries(result.diagnostics, result.compilerDiagnostics)))
          return
        }
        if (!quiet) printSyncLine(result.elapsedMs ?? 0, result.outDir, foldedWarningCount(result.warningCount, verbose))
      },
      onError: (err) => {
        say(`[ref] watch error: ${messageOf(err)}`)
      },
    }, { breakLock, verbose, foldRefDiagnostics: true })
    const { flushReferenceBuild } = await import('../reference/bridge/init.ts')
    const build = await flushReferenceBuild(dir)
    if (build?.status === 'failed') {
      say(`[ref] watch error: reference tasty build failed: ${build.message}`)
    }
    const refWarnings = build?.status === 'complete' ? build.reportedWarningCount : 0
    if (json) {
      const { tastyDiagnosticToNative } = await import('../reference/bridge/build-report.ts')
      const refEntries =
        build?.status === 'complete' ? build.diagnostics.map(tastyDiagnosticToNative) : []
      const reported = reportedSyncEntries(handle.baseline.diagnostics, handle.baseline.compilerDiagnostics)
      console.log(formatJsonDiagnostics([...reported, ...refEntries]))
    } else if (!quiet) {
      const total = handle.baseline.warningCount + refWarnings
      printBootBlock({ elapsedMs: Date.now() - started, outDir: `${dir}/.reference-ui`, warnings: foldedWarningCount(total, verbose), watch: true })
    }
    const shutdown = (): void => {
      void handle.stop().then(
        () => process.exit(0),
        () => process.exit(1),
      )
    }
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
    await new Promise<void>(() => {})
    return 0
  } catch (err) {
    say(`[ref] watch failed: ${messageOf(err)}`)
    return 1
  }
}
