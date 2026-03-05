import { bootstrap } from './bootstrap'
import { initComplete } from './complete'
import { initEvents } from './events'
import { initVirtual } from '../virtual/init'
import { initConfig } from '../system/config/init'
import { initWatch } from '../watch/init'
import { initPackager } from '../packager/init'
import { initPanda } from '../system/panda/init'
import type { SyncOptions } from './types'

export type { SyncOptions, SyncPayload } from './types'

/** Sync command – main hub for the design system build pipeline. */
export async function syncCommand(cwd: string, options?: SyncOptions): Promise<void> {
  const payload = await bootstrap(cwd, options)
  initEvents()
  initComplete(payload)
  initWatch(payload)
  initVirtual(payload)
  initConfig()
  initPanda()
  await initPackager({ cwd, watchMode: options?.watch })
}
