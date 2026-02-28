import { initLog } from '../lib/log'
import { initEventBus } from '../event-bus'
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
  initWatch(cwd, config, options)
  initVirtual(cwd, config, options) // completion: virtual:complete
  initSystem(cwd, config, { watch: options?.watch }) // completion: system:complete
  initGen(cwd, config, { watch: options?.watch }) // completion: gen:complete
  initPackager(cwd, config, { watch: options?.watch }) // completion: packager:complete
  await initTsPackager(cwd, config) // completion: packager-ts:complete
 
  if (!options?.watch) {
    process.exit(0)
  }
}
