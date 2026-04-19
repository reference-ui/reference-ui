import { log } from '../lib/log'
import { tryAcquireLock } from './files'

const LOG_SCOPE = 'session'

/**
 * Watch sessions own the outDir with a lock file so only one live `ref sync --watch`
 * process can publish readiness and incremental updates for a given output root.
 */
export function enforceWatchSessionLock(outDir: string): void {
  const lockPayload = {
    pid: process.pid,
    startedAt: new Date().toISOString(),
  }

  const firstAttempt = tryAcquireLock(outDir, lockPayload)
  const result =
    firstAttempt === 'stale' ? tryAcquireLock(outDir, lockPayload) : firstAttempt

  if (result !== 'contested') {
    return
  }

  log.error(
    LOG_SCOPE,
    `Another ref sync --watch process already owns ${outDir}. ` +
      'Use a different outDir to run parallel watch sessions.'
  )
  process.exit(1)
}