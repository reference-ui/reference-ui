import { loadUserConfig, setConfig, setCwd } from '../config'
import { initEventBus } from '../lib/event-bus'
import { initLogRelay } from '../lib/log'
import { initPool } from '../lib/thread-pool'
import workersManifest from '../../workers.json'
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
  if (options?.debug) {
    config.debug = true
  }
  setConfig(config)
  setCwd(cwd)
  initPool(
    { config, cwd },
    {
      // Sync starts one long-lived task per registered worker.
      maxThreads: Object.keys(workersManifest).length,
    }
  )
  initLogRelay()
  initEventBus()
  return { cwd, config, options: options ?? {} }
}
