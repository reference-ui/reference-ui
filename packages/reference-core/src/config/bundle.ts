import { microBundle } from '../lib/microbundle'
import { CONFIG_EXTERNALS } from './constants'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

export interface BundleConfigOptions {
  /** Modules to leave as external (not bundled). */
  external?: string[]
}

function resolveDefineConfigEntry(): string {
  const currentFile = fileURLToPath(import.meta.url)
  const packageRoot = resolve(currentFile, '..', '..', '..')
  const sourceEntry = resolve(packageRoot, 'src/config/types.ts')
  if (existsSync(sourceEntry)) return sourceEntry

  const builtEntry = resolve(packageRoot, 'dist/cli/config.mjs')
  if (existsSync(builtEntry)) return builtEntry

  throw new Error(`Unable to resolve defineConfig entry from ${currentFile}`)
}

/**
 * Bundle a config file with esbuild.
 * @param configPath - Absolute path to the config file
 * @returns The bundled JavaScript code as a string
 */
export async function bundleConfig(
  configPath: string,
  options: BundleConfigOptions = {}
): Promise<string> {
  const defineConfigEntry = resolveDefineConfigEntry()

  return microBundle(configPath, {
    format: 'esm',
    external: options.external ?? ['esbuild'],
    packages: 'external',
    alias: Object.fromEntries(CONFIG_EXTERNALS.map(id => [id, defineConfigEntry])),
    tsconfigRaw: {
      compilerOptions: {},
    },
  })
}
