import { bundleNRequire } from 'bundle-n-require'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ReferenceUIConfig } from '../config.js'

/**
 * Load and evaluate the user's ui.config.ts/js file.
 * Uses bundle-n-require (same as Panda CSS) to handle TypeScript configs.
 */
export async function loadUserConfig(cwd: string): Promise<ReferenceUIConfig> {
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

  let result: Awaited<ReturnType<typeof bundleNRequire>>
  
  try {
    // Use bundle-n-require to load and bundle the config file (handles TS/ESM)
    // This is the exact same approach Panda CSS uses for panda.config.ts
    result = await bundleNRequire(configPath, {
      cwd,
      interopDefault: true,
    })
  } catch (err) {
    throw new Error(
      `reference-ui: Failed to load ${configPath}:\n${err instanceof Error ? err.message : String(err)}`
    )
  }

  // Extract the config from the module (default export or direct export)
  const userConfig = (result.mod?.default ?? result.mod) as ReferenceUIConfig
  
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
