import { runWorker } from '../thread-pool'
import type { SyncPayload } from '../sync/types'

/**
 * Initialize system worker (eval + config generation only).
 * Gen (Panda) runs separately via initGen().
 */
export async function initSystem(payload: SyncPayload): Promise<void> {
  const watchMode = payload.options.watch ?? false
  if (watchMode) {
    runWorker('system', {
      cwd: payload.cwd,
      config: payload.config,
      watchMode: true,
    })
    return
  }
  await runWorker('system', {
    cwd: payload.cwd,
    config: payload.config,
    watchMode: false,
  })
}

export {
  runEval,
  scanDirectories,
  runFiles,
  REGISTERED_FUNCTIONS,
  isRegistered,
} from './eval'
export { createBoxPattern, createPandaConfig, createFontSystem } from './config'
