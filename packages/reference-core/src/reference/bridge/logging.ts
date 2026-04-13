import { emitLog } from '../../lib/log'

const BADGE = 'ref'

function formatElapsed(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(durationMs >= 10_000 ? 1 : 2)}s`
}

export function logReferenceBuilt(durationMs: number): void {
  emitLog('info', [`Built reference in ${formatElapsed(durationMs)}`], {
    badge: BADGE,
    module: 'sync',
  })
}

export function logReferenceWarning(message: string): void {
  emitLog('warn', [message], {
    badge: BADGE,
    module: 'warn',
  })
}