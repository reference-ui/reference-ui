import { bootstrap } from './bootstrap'
import { initComplete } from './complete'
import { initEvents } from './events'
import { initGlobalSyncFailureBoundary } from './failure-boundary'
import { initShutdown } from './shutdown'
import { initVirtual } from '../virtual/init'
import { initConfig } from '../system/panda/config/init'
import { initWatch } from '../watch/init'
import { initPackager, initTsPackager } from '../packager/init'
import { initPanda } from '../system/panda/gen/init'
import { initReference } from '../reference/bridge/init'
import { initSession } from '../session'
import { startSyncLogging } from './logging'
import type { SyncOptions } from './types'

export type { SyncOptions, SyncPayload } from './types'

/** Sync command – main hub for the design system build pipeline. */
export async function syncCommand(cwd: string, options?: SyncOptions): Promise<void> {
  const payload = await bootstrap(cwd, options)
  initShutdown()
  initGlobalSyncFailureBoundary()
  startSyncLogging()
  initEvents()
  initSession(payload)
  initComplete(payload)
  initWatch(payload)
  initVirtual(payload)
  initReference(payload)
  initConfig()
  initPanda()
  initPackager(payload)
  initTsPackager(payload)
}
