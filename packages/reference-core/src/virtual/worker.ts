/**
 * Virtual worker – copies/transforms source files to .reference-ui/virtual for Panda scanning.
 * Transform is part of copy; emits virtual:fs:change per file (copy+transform one file).
 * Listens: run:virtual:copy:all (full), run:virtual:sync:file (single file, from watch:change).
 */
import { emit, on } from '../lib/event-bus'
import { KEEP_ALIVE } from '../lib/thread-pool'
import { resolve } from 'node:path'
import { copyToVirtual, removeFromVirtual } from './copy'
import { copyAll } from './copy-all'
import { getVirtualPath } from './utils'
import { log } from '../lib/log'
import { getVirtualDirPath } from '../lib/paths'
import type { VirtualWorkerPayload } from './types'

export default async function runVirtual(payload: VirtualWorkerPayload): Promise<never> {
  const { sourceDir, config } = payload
  const root = resolve(sourceDir)
  const virtualDir = getVirtualDirPath(root)
  const debug = config.debug ?? false
  const toMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

  const onCopyAll = () => {
    copyAll(payload).catch((err) => {
      log.error('[virtual] Copy failed:', err)
      emit('virtual:failed', {
        operation: 'copy:all',
        message: toMessage(err),
      })
    })
  }

  const onWatchChange = async (ev: { event: 'add' | 'change' | 'unlink'; path: string }) => {
    const sourcePath = ev.path
    try {
      let virtualPath: string
      if (ev.event === 'unlink') {
        virtualPath = getVirtualPath(sourcePath, root, virtualDir)
        await removeFromVirtual(sourcePath, root, virtualDir)
      } else {
        virtualPath = await copyToVirtual(sourcePath, root, virtualDir, { debug })
      }
      emit('virtual:fs:change', { event: ev.event, path: virtualPath })
      log.debug('virtual', 'Processed watch:change → virtual:fs:change', ev.event, virtualPath)
    } catch (err) {
      log.error('[virtual] Failed to process', ev.event, sourcePath, err)
      emit('virtual:failed', {
        operation: 'sync:file',
        event: ev.event,
        path: sourcePath,
        message: toMessage(err),
      })
    }
  }

  on('run:virtual:copy:all', onCopyAll)
  on('run:virtual:sync:file', onWatchChange)
  emit('virtual:ready')

  return KEEP_ALIVE
}
