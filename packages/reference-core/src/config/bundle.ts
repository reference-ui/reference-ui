import { microBundle } from '../lib/microbundle'
import { CONFIG_EXTERNALS } from './constants'

export interface BundleConfigOptions {
  /** Modules to leave as external (not bundled). */
  external?: string[]
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
  return microBundle(configPath, {
    format: 'cjs',
    external: options.external ?? [
      'esbuild',
      ...CONFIG_EXTERNALS,
    ],
  })
}
