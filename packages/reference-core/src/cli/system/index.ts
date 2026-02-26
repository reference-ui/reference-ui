import type { ReferenceUIConfig } from '../config'
import { runWorker } from '../thread-pool'

export interface InitSystemOptions {
  watch?: boolean
}

export async function initSystem(
  cwd: string,
  config: ReferenceUIConfig,
  options?: InitSystemOptions
): Promise<void> {
  await runWorker('system', {
    cwd,
    config,
    watchMode: options?.watch ?? false,
  })
}

export {
  runEval,
  scanDirectories,
  runFiles,
  REGISTERED_FUNCTIONS,
  isRegistered,
} from './eval'
export { createBoxPattern } from './boxPattern'
export { createPandaConfig } from './config'
export { createFontSystem } from './fontFace'
