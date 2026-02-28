import pc from 'picocolors'
import { writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { COLLECTOR_KEY } from '../config/panda/extendPandaConfig'
import { microBundle } from '../../lib/microbundle'
import type { Config } from '@pandacss/dev'
import { log } from '../../lib/log'

/**
 * Run the given files and collect config fragments from extendPandaConfig.
 * Sets a global collector before each file run; when the file calls
 * extendPandaConfig(partial), the partial is pushed to the collector.
 *
 * Uses microBundle and writes to a temp file
 * in coreDir/.ref/eval/ so Node can resolve @pandacss/dev from core's node_modules.
 */
export async function runFiles(
  filePaths: string[],
  coreDir: string
): Promise<Partial<Config>[]> {
  const allFragments: Partial<Config>[] = []
  const evalDir = join(coreDir, '.ref', 'eval')
  mkdirSync(evalDir, { recursive: true })
  const tmpFiles: string[] = []

  try {
    for (const filePath of filePaths) {
      const collector: Partial<Config>[] = []
      ;(globalThis as Record<string, unknown>)[COLLECTOR_KEY] = collector

      try {
        const bundled = await microBundle(filePath)
        const tmpPath = join(evalDir, `eval-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`)
        writeFileSync(tmpPath, bundled, 'utf-8')
        tmpFiles.push(tmpPath)
        await import(pathToFileURL(tmpPath).href)
      } finally {
        delete (globalThis as Record<string, unknown>)[COLLECTOR_KEY]
      }

      const n = collector.length
      const label = `${String(n).padStart(3)} ${n === 1 ? 'frag' : 'frags'}`.padEnd(10)
      log.debug('system:eval', pc.dim(label), filePath)
      allFragments.push(...collector)
    }

    return allFragments
  } finally {
    for (const f of tmpFiles) {
      try {
        rmSync(f, { force: true })
      } catch {
        /* ignore */
      }
    }
  }
}
