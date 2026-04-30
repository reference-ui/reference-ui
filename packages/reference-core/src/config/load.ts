import type { ReferenceUIConfig } from './types'
import { ConfigNotFoundError, LoadConfigError } from './errors'
import { resolveRefConfigFile } from '../lib/paths'
import { bundleConfigWithDependencies } from './bundle'
import { evaluateConfig } from './evaluate'
import { validateConfig } from './validate'

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
  let dependencyPaths: string[] = [configPath]
  try {
    const bundled = await bundleConfigWithDependencies(configPath)
    dependencyPaths = bundled.dependencyPaths
    raw = await evaluateConfig(bundled.code, configPath)
  } catch (err) {
    throw new LoadConfigError(configPath, err)
  }

  return {
    config: validateConfig(raw),
    dependencyPaths,
  }
}
