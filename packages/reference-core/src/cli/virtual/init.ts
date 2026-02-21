import { resolve, join, dirname } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { setupWatcher } from './watcher'
import { removeFromVirtual, copyToVirtual } from './copy'
import { log } from '../lib/log'
import { runWorker } from '../thread-pool'
import { resolveCorePackageDir } from '../lib/resolve-core'
import { DEFAULT_VIRTUAL_DIR, GLOB_CONFIG } from './config.internal'
import type { FileChangeEvent, InitVirtualOptions } from './types'
import type { ReferenceUIConfig } from '../config'

/**
 * Payload for the virtual worker
 */
export interface VirtualWorkerPayload {
  sourceDir: string

  config: ReferenceUIConfig
  virtualDir?: string
}

/**
 * Initialize the virtual filesystem.
 * Sets up the virtual directory and optionally starts watching for changes.
 *
 * @param sourceDir - Source directory (typically the user's project root)
 * @param config - User's Reference UI configuration
 * @param options - Additional options (watch mode, virtual directory path)
 */
export function initVirtual(
  sourceDir: string,
  config: ReferenceUIConfig,
  options: InitVirtualOptions = {}
): void {
  const { watch = false } = options

  // Kick off heavy initialization in worker thread (non-blocking)
  runWorker('virtual', {
    sourceDir,
    config,
    virtualDir: options.virtualDir,
  })
    .then(() => {
      log.debug('[virtual] Initial copy complete')
    })
    .catch(error => {
      log.error('[virtual] Initialization failed:', error)
    })

  // Setup file watcher if in watch mode
  if (watch) {
    setupFileWatcher(sourceDir, config, options)
  }
}

/**
 * Setup file watcher for virtual filesystem
 */
function setupFileWatcher(
  sourceDir: string,
  config: ReferenceUIConfig,
  options: InitVirtualOptions
): void {
  const { include, debug = false } = config
  const absSourceDir = resolve(sourceDir)

  setupWatcher(
    { sourceDir: absSourceDir, include, debug },
    async (event: FileChangeEvent) => {
      await handleFileChange(event, absSourceDir, config, options)
    }
  ).then(stopWatcher => {
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
  })
}

/**
 * Handle a file change event by copying, transforming, or removing files.
 */
async function handleFileChange(
  event: FileChangeEvent,
  sourceDir: string,
  config: ReferenceUIConfig,
  options: InitVirtualOptions
): Promise<void> {
  const { path } = event
  const { virtualDir = DEFAULT_VIRTUAL_DIR } = options
  const { debug = false } = config

  const sourcePath = resolve(sourceDir, path)
  const coreDir = resolveCorePackageDir(sourceDir)
  const absVirtualDir = resolve(coreDir, virtualDir)

  try {
    if (event.event === 'unlink') {
      await removeFromVirtual(sourcePath, sourceDir, absVirtualDir, { debug })
    } else {
      await copyToVirtual(sourcePath, sourceDir, absVirtualDir, { debug })
    }
  } catch (error) {
    log.error(`[virtual] Error handling ${event.event} for ${path}:`, error)
  }
}

/**
 * Heavy entry point for virtual filesystem initialization.
 * This runs in a worker thread for better performance.
 *
 * @param payload - Worker payload containing source dir, config, and options
 */
export async function runVirtual(payload: VirtualWorkerPayload): Promise<void> {
  const { sourceDir, config, virtualDir = DEFAULT_VIRTUAL_DIR } = payload
  const { include, debug = false } = config

  // Resolve absolute paths
  const absSourceDir = resolve(sourceDir)
  const coreDir = resolveCorePackageDir(sourceDir)
  const absVirtualDir = resolve(coreDir, virtualDir)

  log.debug('[virtual:worker] Initializing virtual filesystem')
  log.debug('[virtual:worker] Source:', absSourceDir)
  log.debug('[virtual:worker] Virtual:', absVirtualDir)

  // Ensure virtual directory exists
  if (!existsSync(absVirtualDir)) {
    await mkdir(absVirtualDir, { recursive: true })
    log.debug('[virtual:worker] Created virtual directory')
  }

  // Copy all files matching include patterns
  const fg = await import('fast-glob')

  for (const pattern of include) {
    const files = await fg.default(pattern, {
      cwd: absSourceDir,
      ...GLOB_CONFIG,
    })

    log.debug(`[virtual:worker] Processing ${files.length} files for pattern: ${pattern}`)

    for (const file of files) {
      await copyToVirtual(file, absSourceDir, absVirtualDir, { debug })
    }
  }

  log.debug('[virtual:worker] Initialization complete')
}

// Export as default for piscina worker compatibility
export default runVirtual
