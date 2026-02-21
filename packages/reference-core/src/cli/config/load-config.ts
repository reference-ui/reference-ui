import { loadConfig as loadConfigFile } from '../lib/microbundle'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ReferenceUIConfig } from './index'

/**
 * Load and evaluate the user's ui.config.ts/js file.
 * Uses bundle-n-require (same as Panda CSS) to handle TypeScript configs.
 */
export async function loadUserConfig(cwd: string = process.cwd()): Promise<ReferenceUIConfig> {
  // Try .ts first (preferred), then .js, then .mjs
  const candidates = ['ui.config.ts', 'ui.config.js', 'ui.config.mjs']
  let configPath: string | null = null
  
  for (const candidate of candidates) {
    const path = resolve(cwd, candidate)
    if (existsSync(path)) {
      configPath = path
      break
    }
  }
  
  if (!configPath) {
    throw new Error(
      `reference-ui: No ui.config.ts or ui.config.js found in ${cwd}.\n` +
      `Create a ui.config.ts file with your configuration:\n\n` +
      `  import { defineConfig } from '@reference-ui/core'\n` +
      `  export default defineConfig({ include: ['src/**/*.{ts,tsx}'] })`
    )
  }

  let userConfig: any
  
  try {
    // Bundle and load the config file with esbuild
    // Returns the evaluated module.exports
    userConfig = await loadConfigFile(configPath, {
      external: ['esbuild'],
    })
  } catch (err) {
    throw new Error(
      `reference-ui: Failed to load ${configPath}:\n${err instanceof Error ? err.message : String(err)}`
    )
  }
  
  // Handle both default and named exports
  userConfig = (userConfig?.default ?? userConfig) as ReferenceUIConfig
  
  if (!userConfig || typeof userConfig !== 'object') {
    throw new Error(
      `reference-ui: Config file must export a config object.\n` +
      `Make sure your ui.config.ts exports: export default defineConfig({ ... })`
    )
  }

  if (!userConfig.include || !Array.isArray(userConfig.include)) {
    throw new Error(
      `reference-ui: Config must have an 'include' array with file patterns.\n` +
      `Example: export default defineConfig({ include: ['src/**/*.{ts,tsx}'] })`
    )
  }

  return userConfig
}
