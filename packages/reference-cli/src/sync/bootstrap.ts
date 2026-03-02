import { loadUserConfig } from '../config'
import { initEventBus } from '../lib/event-bus'
import { setDebug } from '../lib/log'
import type { SyncOptions, SyncPayload } from './types'

/**
 * Bootstrap the sync pipeline: load config and build the shared payload.
 * All inits receive this payload.
 */
export async function bootstrap(
  cwd: string,
  options?: SyncOptions
): Promise<SyncPayload> {
  const config = await loadUserConfig(cwd)
  if (config.debug) setDebug(true)
  initEventBus()
  return { cwd, config, options: options ?? {} }
}
