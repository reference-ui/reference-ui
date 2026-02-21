import { resolve } from 'node:path'
import { copyToVirtual } from './copy'
import { log } from '../utils/log'
import { DEFAULT_VIRTUAL_DIR, GLOB_CONFIG } from './config.internal'
import type { InitVirtualOptions } from './types'
import type { ReferenceUIConfig } from '../config'

/**
 * Sync all files matching patterns to the virtual directory.
 * Useful for initial setup or manual refresh.
 *
 * @param sourceDir - Source directory (typically the user's project root)
 * @param config - User's Reference UI configuration
 * @param options - Additional options (virtual directory path)
 */
export async function syncVirtual(
  sourceDir: string,
  config: ReferenceUIConfig,
  options: InitVirtualOptions = {}
): Promise<void> {
  const { virtualDir = DEFAULT_VIRTUAL_DIR } = options
  const { include, debug = false } = config

  const absSourceDir = resolve(sourceDir)
  const absVirtualDir = resolve(sourceDir, virtualDir)

  log.debug('[virtual] Syncing files to virtual directory')

  const fg = await import('fast-glob')

  for (const pattern of include) {
    const files = await fg.default(pattern, {
      cwd: absSourceDir,
      ...GLOB_CONFIG,
    })

    for (const file of files) {
      await copyToVirtual(file, absSourceDir, absVirtualDir, { debug })
    }
  }

  log.debug('[virtual] Sync complete')
}
