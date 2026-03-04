import { resolve } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { copyToVirtual, removeFromVirtual } from './copy'
import { getVirtualPath } from './utils'
import { log } from '../lib/log'
import { emit } from '../event-bus'
import { GLOB_CONFIG } from './config.internal'
import type { ReferenceUIConfig } from '@reference-ui/cli/config'

export interface VirtualWorkerPayload {
  sourceDir: string
  config: ReferenceUIConfig
  virtualDir?: string
  watchMode?: boolean
}

export interface VirtualContext {
  absSourceDir: string
  absVirtualDir: string
  debug: boolean
}

/** Run initial copy to virtual dir. Emits virtual:complete. Returns context for watch mode. */
export async function runInitialCopy(
  payload: VirtualWorkerPayload
): Promise<VirtualContext> {
  const { sourceDir, config } = payload
  const { include, debug = false } = config

  const absSourceDir = resolve(sourceDir)
  const absVirtualDir = resolve(absSourceDir, '.reference-ui', 'virtual')

  log.debug('virtual:worker', 'Initializing virtual filesystem')
  log.debug('virtual:worker', 'Source:', absSourceDir)
  log.debug('virtual:worker', 'Virtual:', absVirtualDir)

  if (!existsSync(absVirtualDir)) {
    await mkdir(absVirtualDir, { recursive: true })
    log.debug('virtual:worker', 'Created virtual directory')
  }

  if (include.length > 0) {
    const fg = await import('fast-glob')

    for (const pattern of include) {
      const files = await fg.default(pattern, {
        cwd: absSourceDir,
        ...GLOB_CONFIG,
      })

      log.debug(
        'virtual:worker',
        `Processing ${files.length} files for pattern: ${pattern}`
      )

      for (const file of files) {
        await copyToVirtual(file, absSourceDir, absVirtualDir, { debug })
      }
    }
  }

  log.debug('virtual:worker', 'Initialization complete')
  emit('virtual:complete', {})

  return { absSourceDir, absVirtualDir, debug }
}

/** Returns handler for watch:change – copy/remove, emit virtual:fs:change. */
export function onWatchChange(context: VirtualContext): (ev: {
  event: 'add' | 'change' | 'unlink'
  path: string
}) => void {
  const { absSourceDir, absVirtualDir, debug } = context

  log.debug('virtual:worker', 'Listening for watch:change, emitting virtual:fs:change')

  return async ({ event, path: sourcePath }) => {
    try {
      let virtualPath: string
      switch (event) {
        case 'unlink':
          virtualPath = getVirtualPath(sourcePath, absSourceDir, absVirtualDir)
          await removeFromVirtual(sourcePath, absSourceDir, absVirtualDir, { debug })
          break
        case 'add':
        case 'change':
          virtualPath = await copyToVirtual(sourcePath, absSourceDir, absVirtualDir, { debug })
          break
      }
      emit('virtual:fs:change', { event, path: virtualPath })
      log.debug('virtual:worker', 'Processed watch:change → virtual:fs:change', event, virtualPath)
    } catch (err) {
      log.error('[virtual:worker] Failed to process', event, sourcePath, err)
    }
  }
}
