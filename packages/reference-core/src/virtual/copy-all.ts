import { mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import fg from 'fast-glob'
import { emit } from '../lib/event-bus'
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
  const { include, debug } = config

  log.debug('virtual', 'Initializing', root, '→', virtualDir)

  if (existsSync(virtualDir)) {
    await rm(virtualDir, { recursive: true, force: true })
  }

  await mkdir(virtualDir, { recursive: true })

  if (!include.length) {
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
    const virtualPath = await copyToVirtual(file, root, virtualDir, { debug })
    emit('virtual:fs:change', { event: 'add', path: virtualPath })
  }

  log.debug('virtual', 'Sync complete')
  emit('virtual:copy:complete', { virtualDir })
}
