import { resolve } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { setupWatcher } from './watcher'
import { copyToVirtual, removeFromVirtual } from './copy'
import { log } from '../utils/log'
import { resolveCorePackageDir } from '../utils/resolve-core'
import { DEFAULT_VIRTUAL_DIR, GLOB_CONFIG } from './config.internal'
import type { FileChangeEvent, InitVirtualOptions } from './types'
import type { ReferenceUIConfig } from '../config'

/**
 * Initialize the virtual filesystem.
 * Sets up the virtual directory and optionally starts watching for changes.
 *
 * @param sourceDir - Source directory (typically the user's project root)
 * @param config - User's Reference UI configuration
 * @param options - Additional options (watch mode, virtual directory path)
 * @returns Cleanup function to stop watching
 */
export async function initVirtual(
  sourceDir: string,
  config: ReferenceUIConfig,
  options: InitVirtualOptions = {}
): Promise<() => void> {
  const { watch = false, virtualDir = DEFAULT_VIRTUAL_DIR } = options

  const { include, debug = false } = config

  // Resolve absolute paths
  const absSourceDir = resolve(sourceDir)
  const coreDir = resolveCorePackageDir(sourceDir)
  const absVirtualDir = resolve(coreDir, virtualDir)

  log.debug('[virtual] Initializing virtual filesystem')
  log.debug('[virtual] Source:', absSourceDir)
  log.debug('[virtual] Virtual:', absVirtualDir)

  // Ensure virtual directory exists
  if (!existsSync(absVirtualDir)) {
    await mkdir(absVirtualDir, { recursive: true })
    log.debug('[virtual] Created virtual directory')
  }

  // If not watching, just do a one-time copy
  if (!watch) {
    log.debug('[virtual] One-time copy (no watching)')

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

    log.debug('[virtual] One-time copy complete')
    return () => {} // No-op cleanup
  }

  // Setup file watcher
  const stopWatcher = await setupWatcher(
    { sourceDir: absSourceDir, include, debug },
    async (event: FileChangeEvent) => {
      await handleFileChange(event, absSourceDir, absVirtualDir, { debug })
    }
  )

  // Handle graceful shutdown in watch mode
  const cleanup = () => {
    stopWatcher()
  }

  process.on('SIGINT', () => {
    cleanup()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    cleanup()
    process.exit(0)
  })

  return cleanup
}

/**
 * Handle a file change event by copying, transforming, or removing files.
 */
async function handleFileChange(
  event: FileChangeEvent,
  sourceDir: string,
  virtualDir: string,
  options: { debug?: boolean }
): Promise<void> {
  const { path } = event
  const sourcePath = resolve(sourceDir, path)

  try {
    if (event.event === 'unlink') {
      await removeFromVirtual(sourcePath, sourceDir, virtualDir, options)
    } else {
      await copyToVirtual(sourcePath, sourceDir, virtualDir, options)
    }
  } catch (error) {
    log.error(`[virtual] Error handling ${event.event} for ${path}:`, error)
  }
}
