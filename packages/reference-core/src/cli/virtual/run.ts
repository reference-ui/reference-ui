import { resolve, join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { copyToVirtual, removeFromVirtual } from './copy'
import { log } from '../lib/log'
import { on, emit } from '../event-bus'
import { resolveCorePackageDir } from '../lib/resolve-core'
import { DEFAULT_VIRTUAL_DIR, GLOB_CONFIG } from './config.internal'
import type { ReferenceUIConfig } from '../config'

/**
 * Payload for the virtual worker
 */
export interface VirtualWorkerPayload {
  sourceDir: string
  config: ReferenceUIConfig
  virtualDir?: string
  /** When true, virtual stays alive and reacts to watch:change, emitting virtual:fs:change */
  watchMode?: boolean
}

/**
 * Heavy entry point for virtual filesystem initialization.
 * This runs in a worker thread for better performance.
 */
export async function runVirtual(payload: VirtualWorkerPayload): Promise<void> {
  const { sourceDir, config, virtualDir = DEFAULT_VIRTUAL_DIR, watchMode = false } = payload
  const { include, debug = false } = config

  const absSourceDir = resolve(sourceDir)
  const coreDir = resolveCorePackageDir(sourceDir)
  const absVirtualDir = resolve(coreDir, virtualDir)

  log.debug('[virtual:worker] Initializing virtual filesystem')
  log.debug('[virtual:worker] Source:', absSourceDir)
  log.debug('[virtual:worker] Virtual:', absVirtualDir)

  if (!existsSync(absVirtualDir)) {
    await mkdir(absVirtualDir, { recursive: true })
    log.debug('[virtual:worker] Created virtual directory')
  }

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

  if (watchMode) {
    return startWatchMode({ absSourceDir, absVirtualDir, debug })
  }
}

/**
 * Subscribe to watch:change, process each event, emit virtual:fs:change.
 * Never resolves – keeps the worker alive for incremental updates.
 */
function startWatchMode(context: {
  absSourceDir: string
  absVirtualDir: string
  debug: boolean
}): Promise<never> {
  const { absSourceDir, absVirtualDir, debug } = context

  on('watch:change', async ({ event, path }) => {
    const absSourcePath = join(absSourceDir, path)
    try {
      if (event === 'unlink') {
        await removeFromVirtual(absSourcePath, absSourceDir, absVirtualDir, { debug })
      } else {
        await copyToVirtual(absSourcePath, absSourceDir, absVirtualDir, { debug })
      }
      emit('virtual:fs:change', { event, path })
      log.debug('[virtual:worker] Processed watch:change → virtual:fs:change', event, path)
    } catch (err) {
      log.error('[virtual:worker] Failed to process', event, path, err)
    }
  })

  log.debug('[virtual:worker] Listening for watch:change, emitting virtual:fs:change')
  return new Promise(() => {})
}
