import { microBundle } from '../lib/microbundle'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import type { ReferenceUIConfig } from './index'

/**
 * Load and execute a config file by bundling and evaluating it.
 * Bundles the config file with esbuild and executes it in a controlled environment.
 *
 * @param configPath - Absolute path to the config file
 * @param options - Optional esbuild externals
 * @returns The evaluated config object
 */
async function loadConfigFile(
  configPath: string,
  options: { external?: string[] } = {}
): Promise<any> {
  const bundled = await microBundle(configPath, {
    format: 'cjs',
    ...options,
  })

  const module = { exports: {} }
  // Use createRequire with a safe fallback for both ESM and CJS contexts
  let requireFn: NodeRequire
  try {
    // Try ESM approach first
    requireFn = createRequire(import.meta.url)
  } catch {
    // Fallback for CJS: use global require
    requireFn = require
  }

  const fn = new Function('module', 'exports', 'require', bundled)
  fn(module, module.exports, requireFn)

  return module.exports
}

/**
 * Load and evaluate the user's ui.config.ts/js file.
 * Uses esbuild bundling to handle TypeScript configs.
 */
export async function loadUserConfig(
  cwd: string = process.cwd()
): Promise<ReferenceUIConfig> {
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
