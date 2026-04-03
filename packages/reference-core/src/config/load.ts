import type { ReferenceUIConfig } from './types'
import { ConfigNotFoundError, LoadConfigError } from './errors'
import { resolveRefConfigFile } from '../lib/paths'
import { bundleConfig } from './bundle'
import { evaluateConfig } from './evaluate'
import { validateConfig } from './validate'

/**
 * Load and evaluate the user's ui.config.ts/js file.
 * Uses esbuild bundling to handle TypeScript configs.
 */
export async function loadUserConfig(
  cwd: string = process.cwd()
): Promise<ReferenceUIConfig> {
  const configPath = resolveRefConfigFile(cwd)
  if (!configPath) {
    throw new ConfigNotFoundError(cwd)
  }

  let raw: unknown
  try {
    const bundled = await bundleConfig(configPath)
    raw = await evaluateConfig(bundled)
  } catch (err) {
    throw new LoadConfigError(configPath, err)
  }

  return validateConfig(raw)
}
