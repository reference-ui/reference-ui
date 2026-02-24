import { initLog } from '../lib/log'
import { initEventBus } from '../event-bus'
import { loadUserConfig } from '../config'
import { initPackager } from '../packager'
import { initSystem } from '../system'
import { initTsPackager } from '../packager-ts'
import { initVirtual } from '../virtual'
import { initWatch } from '../watch'
import type { SyncOptions } from './types'
export type { SyncOptions } from './types'

export const syncCommand = async (cwd: string, options: SyncOptions) => {
  const config = await loadUserConfig(cwd)
  initEventBus(config)
  initLog(config)
  initWatch(cwd, config, options)
  initVirtual(cwd, config, options)
  await initPackager(cwd, config)
  initSystem(cwd, config)
  await initTsPackager(cwd, config)
}
