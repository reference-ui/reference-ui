import { loadUserConfig } from '@reference-ui/cli/config'
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
  return { cwd, config, options: options ?? {} }
}
