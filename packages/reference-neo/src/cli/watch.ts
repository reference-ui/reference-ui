// CLI watch runner: it takes a resolved project dir and emits the resident
// watcher behind `ref sync --watch`. The runner owns the process half only —
// boot lines, change/resync/error prints, signal shutdown, and the
// never-promise that holds the process open. The watch driver itself
// (watchSync) stays where WAVE1-WATCH's verdict put it; this file only
// routes the flag to it.
import { messageOf } from './output.ts'

export async function runWatch(dir: string): Promise<number> {
  try {
    const { watchSync } = await import('../sync/watch.ts')
    const started = Date.now()
    const handle = await watchSync(dir, {
      onChange: (change) => console.log(`[ref] ${change.event} ${change.relativePath}`),
      onResync: (result) => console.log(`[ref] resync → ${result.outDir}`),
      onError: (err) => console.log(`[ref] watch error: ${messageOf(err)}`),
    })
    console.log(`[ref] sync ${Date.now() - started}ms → ${dir}/.reference-ui`)
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
