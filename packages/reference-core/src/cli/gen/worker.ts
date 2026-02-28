import { on, emit } from '../event-bus'
import { resolveCorePackageDir } from '../lib/resolve-core'
import { runCodegen, onConfigReady } from './code'
import { runCss } from './css'
import type { ReferenceUIConfig } from '../config'

export interface GenWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
  watchMode?: boolean
}

export async function runGen(payload: GenWorkerPayload): Promise<void> {
  const { cwd, watchMode = false } = payload
  const coreDir = resolveCorePackageDir(cwd)

  if (watchMode) {
    on('virtual:fs:change', () => runCss(coreDir))
    on('config:ready', onConfigReady(coreDir))
    emit('gen:ready', {})
    return new Promise(() => {})
  }

  await runCodegen(coreDir)
}

export default runGen
