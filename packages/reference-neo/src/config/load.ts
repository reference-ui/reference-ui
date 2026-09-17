// Loading for Neo ui.config files from a project root.
// It takes a working directory and emits the validated config plus dependencies.
// This module is a Neo-owned copy of the core loader with no global registry.

import type { ReferenceUIConfig } from './types.ts'
import { ConfigNotFoundError, LoadConfigError } from './errors.ts'
import { resolveRefConfigFile } from '../lib/paths/index.ts'
import { bundleConfigWithDependencies } from './bundle.ts'
import { evaluateConfig } from './evaluate.ts'
import { validateConfig } from './validate.ts'

export interface LoadedUserConfig {
  config: ReferenceUIConfig
  dependencyPaths: string[]
}

/**
 * Load and evaluate the user's ui.config.ts/js file.
 * Uses esbuild bundling to handle TypeScript configs.
 */
export async function loadUserConfig(
  cwd: string = process.cwd()
): Promise<ReferenceUIConfig> {
  return (await loadUserConfigWithDependencies(cwd)).config
}

export async function loadUserConfigWithDependencies(
  cwd: string = process.cwd()
): Promise<LoadedUserConfig> {
  const configPath = resolveRefConfigFile(cwd)
  if (!configPath) {
    throw new ConfigNotFoundError(cwd)
  }

  let raw: unknown
  let dependencyPaths: string[]
  try {
    const bundled = await bundleConfigWithDependencies(configPath)
    dependencyPaths = bundled.dependencyPaths
    raw = await evaluateConfig(bundled.code, configPath)
  } catch (err) {
    throw new LoadConfigError(configPath, err)
  }

  const config = validateConfig(raw)

  return {
    config,
    dependencyPaths,
  }
}
