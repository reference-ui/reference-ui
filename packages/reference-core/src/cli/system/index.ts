import type { ReferenceUIConfig } from '../config'
import { runWorker } from '../thread-pool'

export interface InitSystemOptions {
  watch?: boolean
}

/**
 * Initialize system worker (eval + config generation only).
 * Gen (Panda) runs separately via initGen().
 */
export async function initSystem(
  cwd: string,
  config: ReferenceUIConfig,
  options?: InitSystemOptions
): Promise<void> {
  const watchMode = options?.watch ?? false
  if (watchMode) {
    runWorker('system', { cwd, config, watchMode: true })
    return
  }
  await runWorker('system', { cwd, config, watchMode: false })
}

export {
  runEval,
  scanDirectories,
  runFiles,
  REGISTERED_FUNCTIONS,
  isRegistered,
} from './eval'
export { createBoxPattern, createPandaConfig, createFontSystem } from './config'
