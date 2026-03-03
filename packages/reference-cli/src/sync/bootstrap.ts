import { loadUserConfig, setConfig } from '../config'
import { initEventBus } from '../lib/event-bus'
import { initPool } from '../lib/thread-pool'
import { setDebug } from '../lib/log'
import type { SyncOptions, SyncPayload } from './types'

/**
 * Bootstrap the sync pipeline: load config and build the shared payload.
 * Config is passed to the worker pool via workerData for worker-thread access.
 */
export async function bootstrap(
  cwd: string,
  options?: SyncOptions
): Promise<SyncPayload> {
  const config = await loadUserConfig(cwd)
  setConfig(config)
  initPool(config)
  if (config.debug) setDebug(true)
  initEventBus()
  return { cwd, config, options: options ?? {} }
}
