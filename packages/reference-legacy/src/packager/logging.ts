import { emitLog } from '../lib/log'

const BADGE = 'ref'

function formatElapsed(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(durationMs >= 10_000 ? 1 : 2)}s`
}

export function logPackagesBuilt(packageCount: number, durationMs: number): void {
  emitLog('info', [`Built ${packageCount} package(s) in ${formatElapsed(durationMs)}`], {
    badge: BADGE,
    module: 'sync',
  })
}