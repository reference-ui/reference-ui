import { microBundle, microBundleWithResult } from '../lib/microbundle'
import { CONFIG_EXTERNALS } from './constants'
import { existsSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

export interface BundleConfigOptions {
  /** Modules to leave as external (not bundled). */
  external?: string[]
}

export interface BundledConfig {
  code: string
  dependencyPaths: string[]
}

function normalizeConfigDependencyPaths(configPath: string, inputPaths: readonly string[]): string[] {
  const configDir = dirname(resolve(configPath))
  const normalizePath = (filePath: string) => (existsSync(filePath) ? realpathSync(filePath) : filePath)

  return Array.from(
    new Set(
      inputPaths
        .map((inputPath) => (inputPath.startsWith('/') ? inputPath : resolve(configDir, inputPath)))
        .map(normalizePath)
        .filter((inputPath) => !inputPath.includes('/node_modules/'))
        .concat(normalizePath(configPath)),
    ),
  ).sort()
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
  const bundled = await bundleConfigWithDependencies(configPath, options)
  return bundled.code
}

export async function bundleConfigWithDependencies(
  configPath: string,
  options: BundleConfigOptions = {}
): Promise<BundledConfig> {
  const defineConfigEntry = resolveDefineConfigEntry()

  const bundled = await microBundleWithResult(configPath, {
    format: 'esm',
    external: options.external ?? ['esbuild'],
    metafile: true,
    packages: 'external',
    alias: Object.fromEntries(CONFIG_EXTERNALS.map(id => [id, defineConfigEntry])),
    tsconfigRaw: {
      compilerOptions: {},
    },
  })

  return {
    code: bundled.code,
    dependencyPaths: normalizeConfigDependencyPaths(
      configPath,
      Object.keys(bundled.metafile?.inputs ?? {}),
    ),
  }
}
