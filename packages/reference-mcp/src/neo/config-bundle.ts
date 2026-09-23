// ui.config bundling for mcp-side config loads (Neo bundle.ts shape).
// It takes a config path and emits bundled code plus local dependency paths.
// Vendored (not retargeted) for one reason only: Neo resolves its author
// entry from `import.meta.url`, which breaks once bundled into mcp dist
// (F4). Everything else delegates to Neo's microbundle seam.

import { existsSync, realpathSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { microBundleWithResult } from '@reference-ui/neo/microbundle'
import { CONFIG_EXTERNALS } from '@reference-ui/neo/config/constants'
import { getNeoAuthorImportMap } from './author-entry'

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
  const bundled = await microBundleWithResult(configPath, {
    format: 'esm',
    external: options.external ?? ['esbuild'],
    metafile: true,
    packages: 'external',
    alias: getNeoAuthorImportMap([...CONFIG_EXTERNALS]),
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
