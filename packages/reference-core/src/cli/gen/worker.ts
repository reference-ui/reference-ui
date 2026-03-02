import { on, emit } from '../event-bus'
import { KEEP_ALIVE } from '../thread-pool'
import { resolveCorePackageDir } from '../lib/resolve-core'
import { runCodegen, onConfigReady } from './code'
import { runCss } from './css'
import type { ReferenceUIConfig } from '@reference-ui/cli/config'

export interface GenWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
  watchMode?: boolean
}

export async function runGen(payload: GenWorkerPayload): Promise<void> {
  const { cwd, config, watchMode = false } = payload
  const coreDir = resolveCorePackageDir(cwd)

  if (watchMode) {
    on('virtual:fs:change', () => runCss(coreDir))
    on('config:ready', onConfigReady(cwd, config))
    emit('gen:ready', {})
    return KEEP_ALIVE
  }

  await runCodegen(cwd, config)
}

export default runGen
