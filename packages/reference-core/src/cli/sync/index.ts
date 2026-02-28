import { initLog } from '../lib/log'
import { initEventBus } from '../event-bus'
import { initSyncComplete } from './complete'
import { initPackager } from '../packager'
import { initSystem } from '../system'
import { initGen } from '../gen'
import { initTsPackager } from '../packager-ts'
import { initVirtual } from '../virtual'
import { initWatch } from '../watch'
import { bootstrap } from './bootstrap'
import type { SyncOptions } from './types'
export type { SyncOptions, SyncPayload } from './types'

export const syncCommand = async (cwd: string, options?: SyncOptions) => {
  const payload = await bootstrap(cwd, options)
  initEventBus()
  initLog(payload)
  initSyncComplete(payload)
  initWatch(payload)
  initVirtual(payload)
  initSystem(payload)
  initGen(payload)
  initPackager(payload)
  initTsPackager(payload)
}
