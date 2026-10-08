// ui.config loading for the mcp child (Neo load.ts shape).
// It takes a project root and emits the validated config plus dependencies.
// Retargets Neo's evaluate/validate/errors seams; bundling goes through the
// mcp-local bundle copy whose author entry resolves in dist (F4).

import type { ReferenceUIConfig } from '@reference-ui/neo/config/types'
import { ConfigNotFoundError, LoadConfigError } from '@reference-ui/neo/config/errors'
import { bundleConfigWithDependencies } from './config-bundle'
import { evaluateConfig } from '@reference-ui/neo/config/evaluate'
import { validateConfig } from '@reference-ui/neo/config/validate'
import { resolveRefConfigFile } from './paths'

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
