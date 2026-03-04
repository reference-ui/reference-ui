/**
 * Config worker – runs config generation when requested.
 * Listens: run:system:config (payload: { cwd }).
 * Writes panda.config to outDir, then emits system:config:complete.
 */
import { emit, on } from '../../lib/event-bus'
import { KEEP_ALIVE } from '../../lib/thread-pool'
import { log } from '../../lib/log'
import { runConfig } from './runConfig'

export default async function runConfigWorker(): Promise<never> {
  on('run:system:config', (p: { cwd: string }) => {
    log.debug('config', 'run:system:config received', p.cwd)
    runConfig(p.cwd)
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
  emit('system:config:ready')
  return KEEP_ALIVE
}
