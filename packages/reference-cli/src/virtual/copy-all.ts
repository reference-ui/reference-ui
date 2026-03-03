import { mkdir, copyFile } from 'node:fs/promises'
import { join, dirname, relative, resolve } from 'node:path'
import { existsSync } from 'node:fs'
import fg from 'fast-glob'
import { getOutDir } from '../config/store'
import { emit } from '../lib/event-bus'
import { log } from '../lib/log'
import { getVirtualDirPath } from '../lib/paths'
import type { ReferenceUIConfig } from '../config'

const GLOB_IGNORE = ['**/node_modules/**', '**/.git/**'] as const

export async function copyAll(payload: {
  sourceDir: string
  config: ReferenceUIConfig
}): Promise<void> {
  const { sourceDir, config } = payload
  const root = resolve(sourceDir)
  const virtualDir = getVirtualDirPath(root)
  const { include, debug } = config

  log.debug('virtual', 'Initializing', root, '→', virtualDir)

  if (!existsSync(virtualDir)) {
    await mkdir(virtualDir, { recursive: true })
  }

  if (!include.length) {
    log.debug('virtual', 'No include patterns - skipping')
    emit('virtual:complete', {})
    return
  }

  const ignore = [...GLOB_IGNORE, `**/${getOutDir()}/**`]
  const files = await fg(include, {
    cwd: root,
    onlyFiles: true,
    absolute: true,
    ignore,
  })

  log.debug('virtual', `Copying ${files.length} files`)

  const destDirs = [...new Set(files.map((f) => dirname(join(virtualDir, relative(root, f)))))]
  await Promise.all(destDirs.map((d) => mkdir(d, { recursive: true })))

  await Promise.all(
    files.map(async (file) => {
      const rel = relative(root, file)
      await copyFile(file, join(virtualDir, rel))
      if (debug) log.debug('virtual', `✓ ${rel}`)
    })
  )

  log.debug('virtual', 'Sync complete')
  emit('virtual:complete', {})
}
