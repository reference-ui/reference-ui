import { resolve } from 'node:path'
import fg from 'fast-glob'
import { emit } from '../../lib/event-bus'
import { log } from '../../lib/log'
import { getVirtualDirPath } from '../../lib/paths'
import { GLOB_CONFIG } from '../config.internal'
import {
  invalidateBreakpointsCache,
  resolveBreakpointsForProject,
} from '../breakpoints/resolve'
import { syncVirtualStyleCollection } from '../style/collection'
import { createVirtualStagingArea } from './staging'
import type { ReferenceUIConfig } from '../../config'

/**
 * Build and publish a full virtual snapshot.
 *
 * This is the cold-start/full-refresh path. It stages the source-shaped mirror,
 * then adds the reserved Panda-visible style collection, and publishes the
 * completed snapshot into the live virtual directory in one swap.
 */
export async function syncVirtualSnapshot(payload: {
  sourceDir: string
  config: ReferenceUIConfig
}): Promise<void> {
  const { sourceDir, config } = payload
  const root = resolve(sourceDir)
  const virtualDir = getVirtualDirPath(root)
  const staging = createVirtualStagingArea(virtualDir)
  const { include, debug } = config

  log.debug('virtual', 'Initializing', root, '→', virtualDir)

  await staging.reset()

  if (!include.length) {
    await staging.publish()
    log.debug('virtual', 'No include patterns - skipping')
    emit('virtual:copy:complete', { virtualDir })
    return
  }

  const files = await fg(include, {
    cwd: root,
    ...GLOB_CONFIG,
    ignore: [...GLOB_CONFIG.ignore],
  })

  log.debug('virtual', `Copying ${files.length} files`)

  // Snapshot syncs are an authoritative full refresh — invalidate the cache
  // so freshly added/removed breakpoints take effect immediately.
  invalidateBreakpointsCache(root)
  const breakpoints = await resolveBreakpointsForProject(root, include)

  for (const file of files) {
    await staging.stageFile({ file, root, debug, breakpoints })
  }

  await syncVirtualStyleCollection({
    root,
    virtualDir: staging.stagingDir,
    include,
    breakpoints,
  })

  await staging.publish()
  log.debug('virtual', 'Sync complete')
  emit('virtual:copy:complete', { virtualDir })
}
