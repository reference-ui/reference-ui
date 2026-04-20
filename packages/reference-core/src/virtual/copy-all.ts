import { join, relative, resolve } from 'node:path'
import fg from 'fast-glob'
import { emit } from '../lib/event-bus'
import { resetDir } from '../lib/fs/reset-dir'
import { publishStagedDir } from '../lib/fs/publish-staged-dir'
import { log } from '../lib/log'
import { getVirtualDirPath } from '../lib/paths'
import { copyToVirtual } from './copy'
import { GLOB_CONFIG } from './config.internal'
import type { ReferenceUIConfig } from '../config'

export async function copyAll(payload: {
  sourceDir: string
  config: ReferenceUIConfig
}): Promise<void> {
  const { sourceDir, config } = payload
  const root = resolve(sourceDir)
  const virtualDir = getVirtualDirPath(root)
  const stagingDir = `${virtualDir}.next`
  const { include, debug } = config

  log.debug('virtual', 'Initializing', root, '→', virtualDir)

  await resetDir(stagingDir)

  if (!include.length) {
    await publishStagedDir(stagingDir, virtualDir)
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

  for (const file of files) {
    const stagedPath = await copyToVirtual(file, root, stagingDir, { debug })
    const virtualPath = join(virtualDir, relative(stagingDir, stagedPath))
    emit('virtual:fs:change', { event: 'add', path: virtualPath })
  }

  await publishStagedDir(stagingDir, virtualDir)
  log.debug('virtual', 'Sync complete')
  emit('virtual:copy:complete', { virtualDir })
}
