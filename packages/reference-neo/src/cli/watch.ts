// CLI watch runner: it takes a resolved project dir and emits the resident
// watcher behind `ref sync --watch`. The runner owns the process half only —
// boot lines, change/resync/error prints, signal shutdown, and the
// never-promise that holds the process open. The watch driver itself
// (watchSync) lives in lib/watch per the WAVE4 verdict; this file only
// routes the flag to it.
import { messageOf, printSyncLine } from './output.ts'

export async function runWatch(dir: string): Promise<number> {
  try {
    const { watchSync } = await import('../lib/watch/index.ts')
    const started = Date.now()
    const handle = await watchSync(dir, {
      onChange: (change) => console.log(`[ref] ${change.event} ${change.relativePath}`),
      onResync: (result) => console.log(`[ref] resync → ${result.outDir}`),
      onError: (err) => console.log(`[ref] watch error: ${messageOf(err)}`),
    })
    printSyncLine(Date.now() - started, `${dir}/.reference-ui`)
    console.log(`[ref] watching ${dir} — Ctrl-C to stop`)
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
    console.log(`[ref] watch failed: ${messageOf(err)}`)
    return 1
  }
}
