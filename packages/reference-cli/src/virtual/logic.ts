import { mkdir, copyFile } from 'node:fs/promises'
import { join, dirname, relative, resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { getOutDir } from '../config/store'
import { emit } from '../lib/event-bus'
import { log } from '../lib/log'
import { getVirtualDirPath } from '../lib/paths'
import type { ReferenceUIConfig } from '../config'

const GLOB_IGNORE_BASE = ['**/node_modules/**', '**/.git/**'] as const

/** Run initial copy to virtual dir. Emits virtual:complete. */
export async function runInitialCopy(payload: {
  sourceDir: string
  config: ReferenceUIConfig
}): Promise<void> {
  const { sourceDir, config } = payload
  const { include, debug = false } = config

  const absSourceDir = resolve(sourceDir)
  const absVirtualDir = getVirtualDirPath(absSourceDir)

  log.debug('virtual', 'Initializing virtual filesystem')
  log.debug('virtual', 'Source:', absSourceDir)
  log.debug('virtual', 'Virtual:', absVirtualDir)

  if (!existsSync(absVirtualDir)) {
    await mkdir(absVirtualDir, { recursive: true })
    log.debug('virtual', 'Created virtual directory')
  }

  if (include.length === 0) {
    log.debug('virtual', 'No include patterns - skipping copy')
    emit('virtual:complete', {})
    return
  }

  const fg = await import('fast-glob')

  for (const pattern of include) {
    const files = await fg.default(pattern, {
      cwd: absSourceDir,
      onlyFiles: true,
      absolute: true,
      ignore: [...GLOB_IGNORE_BASE, `**/${getOutDir()}/**`],
    })

    log.debug('virtual', `Processing ${files.length} files for pattern: ${pattern}`)

    for (const file of files) {
      const relPath = relative(absSourceDir, file)
      const destPath = join(absVirtualDir, relPath)
      const destDir = dirname(destPath)

      if (!existsSync(destDir)) {
        await mkdir(destDir, { recursive: true })
      }

      await copyFile(file, destPath)
      if (debug) log.debug('virtual', `✓ ${relPath}`)
    }
  }

  log.debug('virtual', 'Sync complete')
  emit('virtual:complete', {})
}
