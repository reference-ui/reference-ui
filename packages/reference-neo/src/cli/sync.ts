// CLI sync command: it takes the project dir plus the sync flags and emits
// a fresh generated folder or the resident watcher. One-shot sync runs the
// world's own sync, drains the session-owned tasty phase with a single
// subsystem call, and prints the boot block with its folded warnings;
// --watch routes to the watch runner and --quiet prints nothing on
// success in either mode. --debug traces watch file events on
// the dev-only channel. --json replaces the human stdout with the
// canonical diagnostics array and moves every human line to stderr, so
// agents parse stdout without a filter. No build logic lives here — the
// command calls subsystems and reports.
import type { Command } from 'commander'
import { resolve } from 'node:path'
import type { ReferenceBuildResult } from '../reference/bridge/events.ts'
import type { SyncResult } from '../sync/index.ts'
import { SyncCoveredByWatchError } from '../sync/session-owner.ts'
import { foldedWarningCount, formatJsonDiagnostics, messageOf, printBootBlock, reportedSyncEntries } from './output.ts'
import { runWatch } from './watch.ts'

export interface SyncCommandOptions {
  watch?: boolean
  breakLock?: boolean
  verbose?: boolean
  debug?: boolean
  json?: boolean
  quiet?: boolean
}

export async function runSyncCommand(dir: string | undefined, options: SyncCommandOptions): Promise<number> {
  const cwd = resolve(dir ?? process.cwd())
  const { watch = false, breakLock = false, verbose = false, debug = false, json = false, quiet = false } = options
  if (watch) return runWatch(cwd, { breakLock, verbose, debug, json, quiet })
  // JSON runs keep stdout purely machine-readable: failures report on
  // stderr with empty stdout, so agents never JSON-parse a cause line.
  const fail = (message: string): number => {
    if (json) console.error(message)
    else console.log(message)
    return 1
  }
  try {
    const { sync } = await import('../sync/index.ts')
    const started = Date.now()
    const result = await sync(cwd, { breakLock, verbose, foldRefDiagnostics: true, json })
    const { flushReferenceBuild } = await import('../reference/bridge/init.ts')
    const build = await flushReferenceBuild(cwd)
    if (build?.status === 'failed') {
      return fail(`[ref] sync failed: reference tasty build failed: ${build.message}`)
    }
    if (json) {
      const { tastyDiagnosticToNative } = await import('../reference/bridge/build-report.ts')
      const refEntries =
        build?.status === 'complete' ? build.diagnostics.map(tastyDiagnosticToNative) : []
      const reported = reportedSyncEntries(result.diagnostics, result.compilerDiagnostics)
      console.log(formatJsonDiagnostics([...reported, ...refEntries]))
      return 0
    }
    reportOneShotSuccess({ build, result, started, verbose, quiet })
    return 0
  } catch (err) {
    if (err instanceof SyncCoveredByWatchError) {
      // The watch session owns this sync: no diagnostics from this run, so
      // the JSON array is empty and the note rides stderr.
      if (json) {
        console.log(formatJsonDiagnostics([]))
        console.error(err.message)
        return 0
      }
      console.log(err.message)
      return 0
    }
    return fail(`[ref] sync failed: ${messageOf(err)}`)
  }
}

interface OneShotSuccess {
  build: ReferenceBuildResult | undefined
  result: SyncResult
  started: number
  verbose: boolean
  quiet: boolean
}

// The one-shot success report: folds the drained tasty warnings into the
// boot block, or prints nothing under --quiet. Pure reporting — the sync
// and the drain already ran.
function reportOneShotSuccess(report: OneShotSuccess): void {
  if (report.quiet) return
  const refWarnings = report.build?.status === 'complete' ? report.build.reportedWarningCount : 0
  printBootBlock({
    elapsedMs: Date.now() - report.started,
    outDir: report.result.outDir,
    warnings: foldedWarningCount(report.result.warningCount + refWarnings, report.verbose),
  })
}

export function registerSyncCommand(program: Command, report: (code: number) => void): void {
  program
    .command('sync')
    .description('generate the .reference-ui folder; --watch stays resident and resyncs on change')
    .argument('[dir]', 'project dir (defaults to cwd)')
    .option('--watch', 'stay resident and resync on every matched change')
    .option('--break-lock', 'take the sync session lock unconditionally')
    .option('--verbose', 'list every warning with its location and fix hint')
    .option('--debug', 'trace watch file events (dev-only channel)')
    .option('--quiet', 'print nothing on success (errors still fail loud)')
    .option('--json', 'print diagnostics as machine-readable JSON on stdout instead of the human lines')
    .action(async (dir: string | undefined, options: SyncCommandOptions) => {
      report(await runSyncCommand(dir, options))
    })
}
