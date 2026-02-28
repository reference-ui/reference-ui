import { initLog } from '../lib/log'
import { initEventBus } from '../event-bus'
import { initSyncComplete } from './complete'
import { loadUserConfig } from '../config'
import { initPackager } from '../packager'
import { initSystem } from '../system'
import { initGen } from '../gen'
import { initTsPackager } from '../packager-ts'
import { initVirtual } from '../virtual'
import { initWatch } from '../watch'
import type { SyncOptions } from './types'
export type { SyncOptions } from './types'

export const syncCommand = async (cwd: string, options: SyncOptions) => {
  const config = await loadUserConfig(cwd)
  initEventBus()
  initLog(config)
  initSyncComplete(config, options?.watch)
  initWatch(cwd, config, options)
  initVirtual(cwd, config, options)
  initSystem(cwd, config, { watch: options?.watch })
  initGen(cwd, config, { watch: options?.watch })
  initTsPackager(cwd, config, { watch: options?.watch }) // before packager so listener is ready
  initPackager(cwd, config, { watch: options?.watch })
}
