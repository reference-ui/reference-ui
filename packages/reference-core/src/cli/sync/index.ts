import { initLog, log } from '../lib/log'
import { initEventBus, onceAll } from '../event-bus'
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

  onceAll(['config:ready', 'packager:complete'], () => {
    log.debug('sync', 'onceAll: all events fired')
  })

  initWatch(cwd, config, options)
  initVirtual(cwd, config, options)
  initSystem(cwd, config, { watch: options?.watch })
  initGen(cwd, config, { watch: options?.watch })
  await initPackager(cwd, config, { watch: options?.watch })
  await initTsPackager(cwd, config)

  if (!options?.watch) {
    process.exit(0)
  }
}
