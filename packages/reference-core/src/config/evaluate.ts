import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Evaluate the bundled user config as an ESM module rooted beside the source config.
 *
 * The config bundle is emitted as ESM so dependencies that rely on `import.meta`
 * keep working during config evaluation, and bare package imports resolve using
 * the user's project as the module base.
 *
 * @param bundledCode - The bundled JavaScript string (ESM format)
 * @param configPath - Absolute path to the original config file being evaluated
 * @returns The evaluated config object (raw, may have default export)
 */
export async function evaluateConfig(bundledCode: string, configPath: string): Promise<unknown> {
  const tempDir = await mkdtemp(join(dirname(configPath), '.reference-ui-config-eval-'))
  const tempFile = join(tempDir, 'config.bundle.mjs')

  await writeFile(tempFile, bundledCode, 'utf8')

  try {
    const mod = await import(/* @vite-ignore */ `${pathToFileURL(tempFile).href}?t=${Date.now()}`)
    return mod.default ?? mod
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}
