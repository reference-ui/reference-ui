// CLI sync command: it takes the project dir plus the watch flag and emits
// a fresh generated folder or the resident watcher. One-shot sync runs the
// world's own sync, drains the session-owned tasty phase with a single
// subsystem call, and prints the cost; --watch routes to the watch runner.
// No build logic lives here — the command calls subsystems and reports.
import type { Command } from 'commander'
import { resolve } from 'node:path'
import { messageOf, printSyncLine } from './output.ts'
import { runWatch } from './watch.ts'

export interface SyncCommandOptions {
  watch?: boolean
}

export async function runSyncCommand(dir: string | undefined, watch: boolean): Promise<number> {
  const cwd = resolve(dir ?? process.cwd())
  if (watch) return runWatch(cwd)
  try {
    const { sync } = await import('../sync/index.ts')
    const started = Date.now()
    const result = await sync(cwd)
    const { flushReferenceBuild } = await import('../reference/bridge/init.ts')
    const build = await flushReferenceBuild(cwd)
    if (build?.status === 'failed') {
      console.log(`[ref] sync failed: reference tasty build failed: ${build.message}`)
      return 1
    }
    printSyncLine(Date.now() - started, result.outDir)
    return 0
  } catch (err) {
    console.log(`[ref] sync failed: ${messageOf(err)}`)
    return 1
  }
}

export function registerSyncCommand(program: Command, report: (code: number) => void): void {
  program
    .command('sync')
    .description('generate the .reference-ui folder; --watch stays resident and resyncs on change')
    .argument('[dir]', 'project dir (defaults to cwd)')
    .option('--watch', 'stay resident and resync on every matched change')
    .action(async (dir: string | undefined, options: SyncCommandOptions) => {
      report(await runSyncCommand(dir, options.watch ?? false))
    })
}
