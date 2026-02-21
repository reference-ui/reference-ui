import type { ReferenceUIConfig } from '../config'
import { runWorker } from '../thread-pool'

export async function initSystem(config: ReferenceUIConfig): Promise<void> {
  await runWorker('system', { config })
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
