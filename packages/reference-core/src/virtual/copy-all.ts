import { resolve } from 'node:path'
import fg from 'fast-glob'
import { emit } from '../lib/event-bus'
import { log } from '../lib/log'
import { getVirtualDirPath } from '../lib/paths'
import { GLOB_CONFIG } from './config.internal'
import { writeReferenceUiVirtualArtifacts } from './reference-ui-artifacts'
import { createVirtualStagingArea } from './staging'
import type { ReferenceUIConfig } from '../config'

export async function copyAll(payload: {
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

  for (const file of files) {
    await staging.stageFile({ file, root, debug })
  }

  await writeReferenceUiVirtualArtifacts({
    root,
    virtualDir: staging.stagingDir,
    include,
  })

  await staging.publish()
  log.debug('virtual', 'Sync complete')
  emit('virtual:copy:complete', { virtualDir })
}
