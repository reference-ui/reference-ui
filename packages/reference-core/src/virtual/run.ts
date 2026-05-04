import { resolve } from 'node:path'
import { getConfig } from '../config/store'
import { emit } from '../lib/event-bus'
import { log } from '../lib/log'
import { getVirtualDirPath } from '../lib/paths'
import {
  invalidateBreakpointsCache,
  resolveBreakpointsForProject,
} from './breakpoints/resolve'
import { copyToVirtual, removeFromVirtual } from './fs/copy'
import { syncVirtualSnapshot } from './fs/sync-snapshot'
import { isFragmentFile } from './fragments/detect'
import { syncVirtualStyleCollection } from './style/collection'
import { getVirtualPath } from './utils'
import type { VirtualWorkerPayload } from './types'

/**
 * Virtual run handlers.
 *
 * This module owns the event-driven virtual orchestration so `worker.ts` can
 * stay focused on wiring event-bus subscriptions. The exported functions cover
 * the full snapshot path, single-file watch syncs, and the shared failure
 * reporting around those operations.
 */

export interface VirtualSyncFilePayload {
  event: 'add' | 'change' | 'unlink'
  path: string
}

interface VirtualRunContext {
  root: string
  virtualDir: string
  debug: boolean
  include: string[]
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function resolveVirtualRunContext(payload: VirtualWorkerPayload): VirtualRunContext {
  const { sourceDir } = payload
  const config = getConfig() ?? payload.config
  const root = resolve(sourceDir)

  return {
    include: config.include,
    root,
    virtualDir: getVirtualDirPath(root),
    debug: config.debug ?? false,
  }
}

async function syncVirtualFile(
  payload: VirtualWorkerPayload,
  event: VirtualSyncFilePayload,
  context: VirtualRunContext,
): Promise<string> {
  const sourcePath = event.path

  if (event.event === 'unlink') {
    const virtualPath = getVirtualPath(sourcePath, context.root, context.virtualDir)
    await removeFromVirtual(sourcePath, context.root, context.virtualDir)
    return virtualPath
  }

  // Token fragment changes can mutate the breakpoint table — evict cache.
  if (await isFragmentFile(sourcePath, event.event)) {
    invalidateBreakpointsCache(context.root)
  }

  const breakpoints = await resolveBreakpointsForProject(context.root, context.include)

  return copyToVirtual(sourcePath, context.root, context.virtualDir, {
    debug: context.debug,
    breakpoints,
  })
}

async function emitVirtualChange(
  sourcePath: string,
  event: VirtualSyncFilePayload,
  virtualPath: string,
): Promise<void> {
  const changeEvent = (await isFragmentFile(sourcePath, event.event))
    ? 'virtual:fragment:change'
    : 'virtual:fs:change'

  emit(changeEvent, {
    event: event.event,
    path: virtualPath,
  })
  log.debug('virtual', `Processed watch:change → ${changeEvent}`, event.event, virtualPath)
}

/**
 * Run the cold-start or explicit full snapshot sync path.
 */
export async function runVirtualCopyAll(payload: VirtualWorkerPayload): Promise<void> {
  await syncVirtualSnapshot({
    sourceDir: payload.sourceDir,
    config: getConfig() ?? payload.config,
  })
}

/**
 * Run the single-file watch sync path and emit the resulting change event.
 */
export async function runVirtualSyncFile(
  workerPayload: VirtualWorkerPayload,
  event: VirtualSyncFilePayload,
): Promise<void> {
  const context = resolveVirtualRunContext(workerPayload)
  const virtualPath = await syncVirtualFile(workerPayload, event, context)

  const breakpoints = await resolveBreakpointsForProject(context.root, context.include)

  await syncVirtualStyleCollection({
    root: context.root,
    virtualDir: context.virtualDir,
    include: context.include,
    breakpoints,
  })

  await emitVirtualChange(event.path, event, virtualPath)
}

/**
 * Handler for `run:virtual:copy:all`.
 */
export function onRunVirtualCopyAll(payload: VirtualWorkerPayload): void {
  runVirtualCopyAll(payload).catch((err) => {
    log.error('[virtual] Copy failed:', err)
    emit('virtual:failed', {
      operation: 'copy:all',
      message: toMessage(err),
    })
  })
}

/**
 * Handler for `run:virtual:sync:file`.
 */
export async function onRunVirtualSyncFile(
  workerPayload: VirtualWorkerPayload,
  event: VirtualSyncFilePayload,
): Promise<void> {
  try {
    await runVirtualSyncFile(workerPayload, event)
  } catch (err) {
    log.error('[virtual] Failed to process', event.event, event.path, err)
    emit('virtual:failed', {
      operation: 'sync:file',
      event: event.event,
      path: event.path,
      message: toMessage(err),
    })
  }
}