import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { log } from '../../lib/log'
import { microBundle } from '../../lib/microbundle'

export interface RunCollectScriptOptions<T> {
  /** Core package root (reference-core) */
  coreDir: string
  /** Generated entry file content */
  entryContent: string
  /** Base name for temp files (e.g. 'collect-extensions' → .ts and .mjs) */
  entryBasename: string
  /** JSON output filename in .ref (e.g. 'extensions.json') */
  jsonFilename: string
  /** Log label for debug (e.g. 'system:box') */
  logLabel?: string
}

/**
 * Shared flow for collect scripts: mkdir .ref, write entry, microBundle, spawnSync, read JSON, rm temp.
 * Used by createBoxPattern and createFontSystem.
 */
export async function runCollectScript<T>(
  options: RunCollectScriptOptions<T>
): Promise<T> {
  const { coreDir, entryContent, entryBasename, jsonFilename, logLabel = 'system' } =
    options

  const refDir = join(coreDir, '.ref')
  if (!existsSync(refDir)) mkdirSync(refDir, { recursive: true })

  const entryPath = join(refDir, `${entryBasename}.ts`)
  const scriptPath = join(refDir, `${entryBasename}.mjs`)
  const jsonPath = join(refDir, jsonFilename)

  writeFileSync(entryPath, entryContent)
  const bundled = await microBundle(entryPath)
  writeFileSync(scriptPath, bundled)

  const memBefore = process.memoryUsage().rss / 1024 / 1024
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: coreDir,
    encoding: 'utf-8',
  })
  const memAfter = process.memoryUsage().rss / 1024 / 1024
  log.debug(
    logLabel,
    `Parent RSS: ${memBefore.toFixed(1)}MB → ${memAfter.toFixed(1)}MB (${(memAfter - memBefore).toFixed(1)}MB delta)`
  )

  if (result.status !== 0) {
    throw new Error(
      `[runCollectScript] Collect script failed:\n${result.stderr || result.stdout}`
    )
  }

  const data = JSON.parse(readFileSync(jsonPath, 'utf-8')) as T

  rmSync(entryPath, { force: true })
  rmSync(scriptPath, { force: true })
  rmSync(jsonPath, { force: true })

  return data
}
