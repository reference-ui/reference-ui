import type { ReferenceUIConfig } from './types'
import { ConfigNotFoundError, LoadConfigError } from './errors'
import { resolveConfigFile } from './resolve-config-file'
import { bundleConfig } from './bundle-config'
import { evaluateConfig } from './evaluate-config'
import { validateConfig } from './validate-config'

/**
 * Load and evaluate the user's ui.config.ts/js file.
 * Uses esbuild bundling to handle TypeScript configs.
 */
export async function loadUserConfig(
  cwd: string = process.cwd()
): Promise<ReferenceUIConfig> {
  const configPath = resolveConfigFile(cwd)
  if (!configPath) {
    throw new ConfigNotFoundError(cwd)
  }

  let raw: unknown
  try {
    const bundled = await bundleConfig(configPath)
    raw = evaluateConfig(bundled)
  } catch (err) {
    throw new LoadConfigError(configPath, err)
  }

  return validateConfig(raw)
}
