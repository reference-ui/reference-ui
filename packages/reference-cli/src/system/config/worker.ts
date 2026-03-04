/**
 * Config worker – runs config generation when requested.
 * Listens: run:system:config. Gets cwd from workerData (getCwd).
 * Writes panda.config to outDir, then emits system:config:complete.
 */
import { getCwd } from '../../config'
import { emit, on } from '../../lib/event-bus'
import { KEEP_ALIVE } from '../../lib/thread-pool'
import { log } from '../../lib/log'
import { runConfig } from './runConfig'

export default async function runConfigWorker(): Promise<never> {
  on('run:system:config', () => {
    const cwd = getCwd()
    if (!cwd) {
      log.error('[config] run:system:config: getCwd() is undefined')
      emit('system:config:complete')
      return
    }
    log.debug('config', 'run:system:config received', cwd)
    runConfig(cwd)
      .then(() => {
        log.debug('config', 'runConfig done → system:config:complete')
        emit('system:config:complete')
      })
      .catch((err) => {
        log.error(
          '[config] runConfig failed',
          err instanceof Error ? err.message : String(err),
          err instanceof Error ? err.stack : ''
        )
        emit('system:config:complete')
      })
  })
  log.debug('config', 'system:config:ready')
  emit('system:config:ready')
  return KEEP_ALIVE
}
